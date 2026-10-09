import React, { useMemo } from 'react';
import QRCode from 'qrcode';

export interface QrCodeRendererProps {
  /** The raw text/payload to encode (e.g. UUID challengeToken). */
  value: string;
  /** Rendered width/height in px. Default 200. */
  size?: number;
  /** Foreground module color. Default '#0F172A'. */
  fgColor?: string;
  /** Background color. Default '#FFFFFF'. Set 'transparent' for no background. */
  bgColor?: string;
  /** Quiet zone margin in modules. Default 2. Minimum 2-4 recommended. */
  quietZone?: number;
  /** Custom logo or icon in center (optional). */
  centerBadge?: React.ReactNode;
  /** Custom class names. */
  className?: string;
}

/**
 * Standard ISO/IEC 18004 compliant QR Code Renderer for ChargeOps.
 * Powered by battle-tested qrcode engine with crisp SVG single-path rendering.
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
  const qrData = useMemo(() => {
    if (!value || typeof value !== 'string') {
      return null;
    }
    try {
      // Use Higher Error Correction ('Q' or 'H') when center badge is present
      const ecl = centerBadge ? 'Q' : 'M';
      return QRCode.create(value, { errorCorrectionLevel: ecl });
    } catch (e) {
      console.warn('QR code generation error:', e);
      try {
        return QRCode.create(value.slice(0, 36), { errorCorrectionLevel: 'M' });
      } catch {
        return null;
      }
    }
  }, [value, Boolean(centerBadge)]);

  const { pathD, totalGridSize } = useMemo(() => {
    if (!qrData) return { pathD: '', totalGridSize: 25 + quietZone * 2 };
    const matrixLen = qrData.modules.size;
    const totalGrid = matrixLen + quietZone * 2;
    const parts: string[] = [];

    for (let r = 0; r < matrixLen; r++) {
      for (let c = 0; c < matrixLen; c++) {
        if (qrData.modules.get(r, c)) {
          const x = c + quietZone;
          const y = r + quietZone;
          parts.push(`M${x},${y}h1v1h-1z`);
        }
      }
    }
    return { pathD: parts.join(' '), totalGridSize: totalGrid };
  }, [qrData, quietZone]);

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
          <div className="rounded-[8px] bg-white p-0.5 shadow-md flex items-center justify-center">
            {centerBadge}
          </div>
        </div>
      )}
    </div>
  );
}
