import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface PowerBadgeProps {
  powerKw?: number;
  currentType?: 'AC' | 'DC';
  hasFastCharging?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Dynamic theme-aware power rating badge.
 * Displays charging speed (kW) and type (AC/DC) with high-contrast styling
 * for both Light & Dark modes.
 */
export function PowerBadge({
  powerKw,
  currentType,
  hasFastCharging,
  size = 'md',
}: PowerBadgeProps) {
  const { themeColors, isDark } = usePreferences();

  const isDc = currentType === 'DC' || (hasFastCharging && currentType !== 'AC');
  const isSuper = (powerKw ?? 0) >= 100 || isDc;

  const label = powerKw
    ? `${powerKw} kW ${isDc ? 'DC' : 'AC'}`
    : isDc
      ? 'DC Fast Charge'
      : 'AC Standard';

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        isSmall && styles.badgeSm,
        {
          backgroundColor: isDark
            ? isSuper
              ? '#113322'
              : '#161B1A'
            : isSuper
              ? themeColors.primarySoft
              : themeColors.surfaceAlt,
          borderColor: isDark
            ? isSuper
              ? '#10B981'
              : themeColors.border
            : isSuper
              ? '#A7F3D0'
              : themeColors.border,
        },
      ]}
    >
      <Ionicons
        name="flash"
        size={isSmall ? 10 : 12}
        color={isDark ? (isSuper ? '#34D399' : themeColors.primaryLight) : themeColors.primaryDark}
      />
      <Text
        style={[
          styles.text,
          isSmall && styles.textSm,
          {
            color: isDark
              ? isSuper
                ? '#6EE6A0'
                : themeColors.textStrong
              : isSuper
                ? themeColors.primaryDark
                : themeColors.textBody,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    height: 22,
    borderWidth: 1,
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 2,
    height: 18,
  },
  text: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    lineHeight: 14,
    includeFontPadding: false,
  },
  textSm: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    lineHeight: 12,
    includeFontPadding: false,
  },
});
