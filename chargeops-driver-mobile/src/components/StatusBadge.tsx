import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

/**
 * Pill-shaped status badge (DESIGN_SYSTEM §7). Tinted background + solid text,
 * mapped to a semantic variant. Optionally shows a leading status dot.
 */
export type BadgeVariant = 'success' | 'error' | 'info' | 'warning' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StatusBadge({ label, variant = 'neutral', dot = false, style }: StatusBadgeProps) {
  const { themeColors } = usePreferences();

  const variantStyles: Record<BadgeVariant, { bg: string; fg: string }> = {
    success: { bg: themeColors.primarySoft, fg: themeColors.primaryDark },
    error: { bg: `${themeColors.error}26`, fg: themeColors.error },
    info: { bg: `${themeColors.info}26`, fg: themeColors.info },
    warning: { bg: `${themeColors.warning}26`, fg: themeColors.warning },
    neutral: { bg: themeColors.surfaceAlt, fg: themeColors.textMuted },
  };

  const v = variantStyles[variant];

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
