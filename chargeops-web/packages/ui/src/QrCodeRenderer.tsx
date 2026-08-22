import React, { useMemo } from 'react';

/**
 * Lightweight, zero-dependency QR Code generator & SVG renderer (ISO/IEC 18004).
 * Supports automatic version selection (v1 to v10), Byte encoding, and Reed-Solomon EC.
 */

// Galois Field GF(256) tables with primitive polynomial 0x11d (285)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCalculateEc(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.set(res.subarray(1));
    res[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      res[j] ^= gfMul(gen[j], factor);
    }
  }
  return res;
}

// QR Code Specifications: [totalCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsBlock1, numBlocksGroup2, dataCodewordsBlock2]
// For Level M:
const QR_TABLE_M: number[][] = [
  [], // index 0 unused
  [26, 10, 1, 16, 0, 0], // v1
  [44, 16, 1, 28, 0, 0], // v2
  [70, 26, 1, 44, 0, 0], // v3
  [100, 18, 2, 32, 0, 0], // v4 (2 blocks of 32+18=50)
  [134, 24, 2, 43, 0, 0], // v5
  [172, 16, 4, 27, 0, 0], // v6
  [196, 18, 4, 31, 0, 0], // v7
  [242, 22, 2, 38, 2, 39], // v8
  [292, 22, 3, 36, 2, 37], // v9
  [346, 26, 4, 43, 1, 44], // v10
];

const ALIGNMENT_PATTERN_POS = [
  [],
  [], // v1
  [6, 18], // v2
  [6, 22], // v3
  [6, 26], // v4
  [6, 30], // v5
  [6, 34], // v6
  [6, 22, 38], // v7
  [6, 24, 42], // v8
  [6, 26, 46], // v9
  [6, 28, 50], // v10
];

function encodeToQrMatrix(text: string): boolean[][] {
  const utf8Bytes = new TextEncoder().encode(text);
  const dataLen = utf8Bytes.length;

  // Determine minimal QR version for Level M (Byte mode)
  let version = 1;
  while (version <= 10) {
    const table = QR_TABLE_M[version];
    const totalDataCapacity = table[2] * table[3] + (table[4] ? table[4] * table[5] : 0);
    // Header = 4 bits (Mode: Byte = 4) + 8 or 16 bits (Char count indicator for Byte mode)
    const countBits = version <= 9 ? 8 : 16;
    const requiredBits = 4 + countBits + dataLen * 8;
    if (Math.ceil(requiredBits / 8) <= totalDataCapacity) {
      break;
    }
    version++;
  }

  if (version > 10) {
    version = 10; // Cap at v10
  }

  const table = QR_TABLE_M[version];
  const totalDataBytes = table[2] * table[3] + (table[4] ? table[4] * table[5] : 0);

  // Build bit stream
  const bits: number[] = [];
  const appendBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // 1. Mode indicator: Byte mode (0100)
  appendBits(0b0100, 4);

  // 2. Character count indicator
  const charCountBits = version <= 9 ? 8 : 16;
  appendBits(dataLen, charCountBits);

  // 3. Data bytes
  for (let i = 0; i < dataLen; i++) {
    appendBits(utf8Bytes[i], 8);
  }

  // 4. Terminator (up to 4 zeroes)
  const maxBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  appendBits(0, termLen);

  // 5. Pad to multiple of 8
  while (bits.length % 8 !== 0 && bits.length < maxBits) {
    bits.push(0);
  }

  // 6. Pad bytes (0xEC, 0x11)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    appendBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data bytes
  const dataBytes = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  // Split into blocks and compute Error Correction Codewords
  const numBlocks = table[2] + table[4];
  const ecPerBlock = table[1];
  const blocksData: Uint8Array[] = [];
  const blocksEc: Uint8Array[] = [];

  let byteOffset = 0;
  for (let b = 0; b < table[2]; b++) {
    const len = table[3];
    const blk = dataBytes.subarray(byteOffset, byteOffset + len);
    byteOffset += len;
    blocksData.push(blk);
    blocksEc.push(rsCalculateEc(blk, ecPerBlock));
  }
  for (let b = 0; b < table[4]; b++) {
    const len = table[5];
    const blk = dataBytes.subarray(byteOffset, byteOffset + len);
    byteOffset += len;
    blocksData.push(blk);
    blocksEc.push(rsCalculateEc(blk, ecPerBlock));
  }

  // Interleave data codewords
  const finalCodewords: number[] = [];
  const maxDataLen = Math.max(...blocksData.map((b) => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < blocksData[b].length) {
        finalCodewords.push(blocksData[b][i]);
      }
    }
  }

  // Interleave EC codewords
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalCodewords.push(blocksEc[b][i]);
    }
  }

  // Initialize Matrix
  const matrixSize = 17 + version * 4;
  const matrix: (boolean | null)[][] = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill(null),
  );
  const isFunction: boolean[][] = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill(false),
  );

  const setModule = (r: number, c: number, val: boolean) => {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  };

  // Draw Finder Pattern (7x7 with 1-module separator)
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr >= 0 && mr < matrixSize && mc >= 0 && mc < matrixSize) {
          const isBlack =
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(mr, mc, isBlack);
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, matrixSize - 7);
  drawFinder(matrixSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const alignPos = ALIGNMENT_PATTERN_POS[version] || [];
  for (let i = 0; i < alignPos.length; i++) {
    for (let j = 0; j < alignPos.length; j++) {
      const r = alignPos[i];
      const c = alignPos[j];
      if (
        (r === 6 && c === 6) ||
        (r === 6 && c === matrixSize - 7) ||
        (r === matrixSize - 7 && c === 6)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack =
            Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setModule(r + dr, c + dc, isBlack);
        }
      }
    }
  }

  // Reserve Format Information areas
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setModule(8, i, false);
      setModule(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setModule(8, matrixSize - 1 - i, false);
    setModule(matrixSize - 1 - i, 8, false);
  }
  setModule(matrixSize - 8, 8, true); // Dark module

  // Data Bits placement (up-down zig-zag)
  const bitStream: boolean[] = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) {
      bitStream.push(((cw >> b) & 1) === 1);
    }
  }

  // Remainder bits for versions 2-6
  const remainderBitsCount = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0][version] || 0;
  for (let i = 0; i < remainderBitsCount; i++) {
    bitStream.push(false);
  }

  let bitIdx = 0;
  let dir = -1; // -1: upwards, 1: downwards
  let row = matrixSize - 1;
  let col = matrixSize - 1;

  while (col > 0) {
    if (col === 6) col--; // Skip vertical timing column
    while (row >= 0 && row < matrixSize) {
      for (let c = 0; c < 2; c++) {
        const curCol = col - c;
        if (!isFunction[row][curCol]) {
          const bitVal = bitIdx < bitStream.length ? bitStream[bitIdx++] : false;
          // Apply Standard Mask Pattern 0: (row + column) % 2 === 0
          const mask = (row + curCol) % 2 === 0;
          matrix[row][curCol] = mask ? !bitVal : bitVal;
        }
      }
      row += dir;
    }
    dir = -dir;
    row += dir;
    col -= 2;
  }

  // Format info for Level M + Mask 0: 0b000000000000000 ^ mask = 0b101010000010010 (pre-calculated with BCH(15,5))
  // Level M = 00, Mask 0 = 000 => 00000 => BCH 0000000000 => XOR 101010000010010 => 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Write format info around top-left finder
  const formatPosTopLeft = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];

  for (let i = 0; i < 15; i++) {
    const [r, c] = formatPosTopLeft[i];
    matrix[r][c] = formatBits[i] === 1;
  }

  // Write format info around other finders
  for (let i = 0; i < 7; i++) {
    matrix[matrixSize - 1 - i][8] = formatBits[i] === 1;
  }
  for (let i = 7; i < 15; i++) {
    matrix[8][matrixSize - 15 + i] = formatBits[i] === 1;
  }

  return matrix as boolean[][];
}

export interface QrCodeRendererProps {
  /** The raw text/payload to encode (e.g. UUID challengeToken). */
  value: string;
  /** Rendered width/height in px. Default 200. */
  size?: number;
  /** Foreground module color. Default '#0F172A'. */
  fgColor?: string;
  /** Background color. Default '#FFFFFF'. Set 'transparent' for no background. */
  bgColor?: string;
  /** Quiet zone margin in modules. Default 2. */
  quietZone?: number;
  /** Custom logo or icon in center (optional). */
  centerBadge?: React.ReactNode;
  /** Custom class names. */
  className?: string;
}

/**
 * High-performance, vector SVG QR Code Renderer for ChargeOps.
 */
export function QrCodeRenderer({
  value,
  size = 200,
  fgColor = '#0F172A',
  bgColor = '#FFFFFF',
  quietZone = 2,
  centerBadge,
  className = '',
}: QrCodeRendererProps) {
  const matrix = useMemo(() => {
    if (!value || typeof value !== 'string') {
      return encodeToQrMatrix('EMPTY');
    }
    try {
      return encodeToQrMatrix(value);
    } catch {
      return encodeToQrMatrix(value.slice(0, 36));
    }
  }, [value]);

  const matrixLen = matrix.length;
  const totalGridSize = matrixLen + quietZone * 2;

  // Build SVG path string for all dark modules for single-path GPU acceleration
  const pathD = useMemo(() => {
    const parts: string[] = [];
    for (let r = 0; r < matrixLen; r++) {
      for (let c = 0; c < matrixLen; c++) {
        if (matrix[r][c]) {
          const x = c + quietZone;
          const y = r + quietZone;
          parts.push(`M${x},${y}h1v1h-1z`);
        }
      }
    }
    return parts.join(' ');
  }, [matrix, matrixLen, quietZone]);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${totalGridSize} ${totalGridSize}`}
        shapeRendering="crispEdges"
        className="h-full w-full"
      >
        {bgColor !== 'transparent' && (
          <rect width={totalGridSize} height={totalGridSize} fill={bgColor} rx={1} />
        )}
        <path d={pathD} fill={fgColor} />
      </svg>

      {centerBadge && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-[8px] bg-white p-1 shadow-md flex items-center justify-center">
            {centerBadge}
          </div>
        </div>
      )}
    </div>
  );
}
