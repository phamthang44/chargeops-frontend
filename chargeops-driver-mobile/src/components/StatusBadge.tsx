import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';

/**
 * Pill-shaped status badge (DESIGN_SYSTEM §7). Tinted background + solid text,
 * mapped to a semantic variant. Optionally shows a leading status dot.
 */
export type BadgeVariant = 'success' | 'error' | 'info' | 'warning' | 'neutral';

// `${hex}1A` ≈ 10% alpha tint, derived from the token (no hardcoded colors).
const VARIANTS: Record<BadgeVariant, { bg: string; fg: string }> = {
  success: { bg: colors.primarySoft, fg: colors.primaryDark },
  error: { bg: `${colors.error}1A`, fg: colors.error },
  info: { bg: `${colors.info}1A`, fg: colors.info },
  warning: { bg: `${colors.warning}1A`, fg: colors.warning },
  neutral: { bg: colors.surfaceAlt, fg: colors.textMuted },
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StatusBadge({ label, variant = 'neutral', dot = false, style }: StatusBadgeProps) {
  const v = VARIANTS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: v.fg }]} />}
      <Text style={[styles.label, { color: v.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  dot: { width: 6, height: 6, borderRadius: radius.full },
  label: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
});
