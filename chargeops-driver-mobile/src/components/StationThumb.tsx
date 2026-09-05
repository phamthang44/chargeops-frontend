import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { usePreferences } from '@/context/PreferencesContext';
import { radius as radiusTokens } from '@/theme';

/** The ChargeOps bolt, in a 0 0 100 100 space (shared with the brand mark). */
const BOLT = 'M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z';

interface StationThumbProps {
  /** Side length in px. */
  size?: number;
  /** Corner radius in px (defaults to the `md` token). */
  radius?: number;
}

/**
 * Neutral media placeholder for a station, dynamic theme aware.
 */
export function StationThumb({ size = 64, radius = radiusTokens.md }: StationThumbProps) {
  const { themeColors, isDark } = usePreferences();

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="stationThumb" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={isDark ? '#1C2A25' : themeColors.surface} />
          <Stop offset="1" stopColor={isDark ? '#101815' : themeColors.surfaceAlt} />
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
        stroke={isDark ? '#2A4237' : themeColors.border}
        strokeWidth={1.5}
      />
      {/* Brand bolt with high visibility in dark mode */}
      <Path
        d={BOLT}
        transform="translate(28,24) scale(0.5)"
        fill={isDark ? '#10C98A' : themeColors.primary}
        opacity={isDark ? 0.85 : 0.22}
      />
    </Svg>
  );
}
