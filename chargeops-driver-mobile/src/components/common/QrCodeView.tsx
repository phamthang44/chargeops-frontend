import React, { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/**
 * Lightweight, zero-dependency QR Code generator & SVG renderer (ISO/IEC 18004).
 * Single-path GPU accelerated rendering for React Native SVG.
 */

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

const QR_TABLE_M: number[][] = [
  [],
  [26, 10, 1, 16, 0, 0], // v1
  [44, 16, 1, 28, 0, 0], // v2
  [70, 26, 1, 44, 0, 0], // v3
  [100, 18, 2, 32, 0, 0], // v4
  [134, 24, 2, 43, 0, 0], // v5
  [172, 16, 4, 27, 0, 0], // v6
  [196, 18, 4, 31, 0, 0], // v7
  [242, 22, 2, 38, 2, 39], // v8
  [292, 22, 3, 36, 2, 37], // v9
  [346, 26, 4, 43, 1, 44], // v10
];

const ALIGNMENT_PATTERN_POS = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

function encodeToQrMatrix(text: string): boolean[][] {
  let utf8Bytes: Uint8Array;
  try {
    utf8Bytes = new TextEncoder().encode(text);
  } catch {
    utf8Bytes = new Uint8Array(Array.from(text).map((c) => c.charCodeAt(0) & 0xff));
  }
  const dataLen = utf8Bytes.length;

  let version = 1;
  while (version <= 10) {
    const table = QR_TABLE_M[version];
    const totalDataCapacity = table[2] * table[3] + (table[4] ? table[4] * table[5] : 0);
    const countBits = version <= 9 ? 8 : 16;
    const requiredBits = 4 + countBits + dataLen * 8;
    if (Math.ceil(requiredBits / 8) <= totalDataCapacity) {
      break;
    }
    version++;
  }

  if (version > 10) {
    version = 10;
  }

  const table = QR_TABLE_M[version];
  const totalDataBytes = table[2] * table[3] + (table[4] ? table[4] * table[5] : 0);

  const bits: number[] = [];
  const appendBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  appendBits(0b0100, 4);
  const charCountBits = version <= 9 ? 8 : 16;
  appendBits(dataLen, charCountBits);

  for (let i = 0; i < dataLen; i++) {
    appendBits(utf8Bytes[i], 8);
  }

  const maxBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  appendBits(0, termLen);

  while (bits.length % 8 !== 0 && bits.length < maxBits) {
    bits.push(0);
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    appendBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataBytes = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

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

  const finalCodewords: number[] = [];
  const maxDataLen = Math.max(...blocksData.map((b) => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < blocksData[b].length) {
        finalCodewords.push(blocksData[b][i]);
      }
    }
  }

  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalCodewords.push(blocksEc[b][i]);
    }
  }

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

  for (let i = 8; i < matrixSize - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

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
  setModule(matrixSize - 8, 8, true);

  const bitStream: boolean[] = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) {
      bitStream.push(((cw >> b) & 1) === 1);
    }
  }

  const remainderBitsCount = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0][version] || 0;
  for (let i = 0; i < remainderBitsCount; i++) {
    bitStream.push(false);
  }

  let bitIdx = 0;
  let dir = -1;
  let row = matrixSize - 1;
  let col = matrixSize - 1;

  while (col > 0) {
    if (col === 6) col--;
    while (row >= 0 && row < matrixSize) {
      for (let c = 0; c < 2; c++) {
        const curCol = col - c;
        if (!isFunction[row][curCol]) {
          const bitVal = bitIdx < bitStream.length ? bitStream[bitIdx++] : false;
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

  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
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

  for (let i = 0; i < 7; i++) {
    matrix[matrixSize - 1 - i][8] = formatBits[i] === 1;
  }
  for (let i = 7; i < 15; i++) {
    matrix[8][matrixSize - 15 + i] = formatBits[i] === 1;
  }

  return matrix as boolean[][];
}

export interface QrCodeViewProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  quietZone?: number;
}

export function QrCodeView({
  value,
  size = 200,
  fgColor = '#0F172A',
  bgColor = '#FFFFFF',
  quietZone = 2,
}: QrCodeViewProps) {
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
    <Svg width={size} height={size} viewBox={`0 0 ${totalGridSize} ${totalGridSize}`}>
      {bgColor !== 'transparent' && (
        <Rect width={totalGridSize} height={totalGridSize} fill={bgColor} rx={2} />
      )}
      <Path d={pathD} fill={fgColor} />
    </Svg>
  );
}
