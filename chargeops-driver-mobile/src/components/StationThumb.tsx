import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors, radius as radiusTokens } from '@/theme';

/** The ChargeOps bolt, in a 0 0 100 100 space (shared with the brand mark). */
const BOLT = 'M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z';

interface StationThumbProps {
  /** Side length in px. */
  size?: number;
  /** Corner radius in px (defaults to the `md` token). */
  radius?: number;
}

/**
 * Neutral media placeholder for a station, used until real photos exist. A soft
 * grey gradient with a faint brand bolt watermark — deliberately NOT a flat
 * emerald tile, so the lists read as photo slots rather than a wall of green
 * (DESIGN_SYSTEM: "a single confident emerald accent", used sparingly).
 *
 * Swapping in a real image later means rendering an <Image> over this, or
 * replacing the call site — the gradient stays as the loading/empty state.
 */
export function StationThumb({ size = 64, radius = radiusTokens.md }: StationThumbProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="stationThumb" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.surface} />
          <Stop offset="1" stopColor={colors.surfaceAlt} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={100} rx={(radius / size) * 100} fill="url(#stationThumb)" />
      <Rect
        x={1}
        y={1}
        width={98}
        height={98}
        rx={(radius / size) * 100}
        fill="none"
        stroke={colors.border}
        strokeWidth={2}
      />
      {/* Faint brand watermark — a hint of emerald, not a fill. */}
      <Path d={BOLT} transform="translate(28,24) scale(0.5)" fill={colors.primary} opacity={0.14} />
    </Svg>
  );
}
