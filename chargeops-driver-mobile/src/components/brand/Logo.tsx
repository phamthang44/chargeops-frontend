import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, fontWeights } from '@/theme';

/** The ChargeOps lightning-bolt glyph, drawn in a 0 0 100 100 space. */
const BOLT = 'M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z';

type MarkVariant = 'brand' | 'dark' | 'mono';

interface BrandMarkProps {
  size?: number;
  variant?: MarkVariant;
  style?: StyleProp<ViewStyle>;
}

/**
 * ChargeOps brand mark — the bolt in a rounded square. Source of truth for the
 * app icon too (the icon PNGs are rasterized from this same artwork).
 */
export function BrandMark({ size = 96, variant = 'brand', style }: BrandMarkProps) {
  const bg = variant === 'dark' ? colors.textStrong : colors.primary;
  const fg = variant === 'dark' ? colors.primaryLight : colors.textInverse;

  if (variant === 'mono') {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
        <Rect x={4} y={4} width={92} height={92} rx={22} fill="none" stroke={colors.border} strokeWidth={3} />
        <Path d={BOLT} transform="translate(16,13) scale(0.68)" fill={colors.textStrong} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Rect x={4} y={4} width={92} height={92} rx={24} fill={bg} />
      {variant === 'brand' && <Circle cx={50} cy={50} r={33} fill={colors.textInverse} opacity={0.12} />}
      <Path d={BOLT} transform="translate(14,11) scale(0.72)" fill={fg} />
    </Svg>
  );
}

interface LogoProps {
  /** Height of the bolt mark; the wordmark scales with it. */
  size?: number;
  /** Hide the wordmark and render the mark only. */
  markOnly?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Horizontal ChargeOps lockup: bolt mark + "ChargeOps" wordmark. */
export function Logo({ size = 36, markOnly = false, style }: LogoProps) {
  return (
    <View style={[styles.row, style]}>
      <BrandMark size={size} />
      {!markOnly && (
        <Text style={[styles.wordmark, { fontSize: size * 0.72 }]}>
          Charge<Text style={styles.wordmarkAccent}>Ops</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontWeight: fontWeights.bold, color: colors.textStrong, letterSpacing: -0.5 },
  wordmarkAccent: { color: colors.primary },
});
