import Svg, { Circle, G, Path } from 'react-native-svg';

import { colors } from '@/theme';

/** Availability state a pin can represent. */
export type PinStatus = 'available' | 'busy' | 'full' | 'closed';

const PIN_COLOR: Record<PinStatus, string> = {
  available: colors.primary,
  busy: colors.warning,
  full: colors.error,
  closed: colors.textMuted,
};

const BOLT = 'M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z';
const TEARDROP =
  'M24 3 C13 3 4 12 4 23 C4 38 24 55 24 55 C24 55 44 38 44 23 C44 12 35 3 24 3 Z';

interface StationPinProps {
  status?: PinStatus;
  /** Larger pin with a halo ring + darker shade, for the focused station. */
  selected?: boolean;
  /** Height of the pin in px (width scales to keep the teardrop ratio). */
  size?: number;
}

/**
 * Map marker for a charging station — the brand bolt inside a teardrop, tinted
 * by availability. The selected state adds a halo and uses the darker emerald.
 */
export function StationPin({ status = 'available', selected = false, size = 48 }: StationPinProps) {
  const color = selected ? colors.primaryDark : PIN_COLOR[status];

  if (selected) {
    // 72x72 space leaves room for the halo around the teardrop.
    const w = (size / 58) * 72;
    return (
      <Svg width={w} height={(size / 58) * 72} viewBox="0 0 72 72">
        <Circle cx={36} cy={30} r={30} fill={colors.primary} opacity={0.16} />
        <Path d={TEARDROP} transform="translate(12,5) scale(1.0)" fill={color} />
        <Circle cx={36} cy={31} r={15} fill={colors.textInverse} />
        <Path d={BOLT} transform="translate(22,17) scale(0.28)" fill={color} />
      </Svg>
    );
  }

  const w = (size / 58) * 48;
  return (
    <Svg width={w} height={size} viewBox="0 0 48 58">
      <G>
        <Path d={TEARDROP} fill={color} />
        <Circle cx={24} cy={22} r={12} fill={colors.textInverse} />
        <Path d={BOLT} transform="translate(13,11) scale(0.22)" fill={color} />
      </G>
    </Svg>
  );
}
