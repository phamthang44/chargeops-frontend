import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, lineHeights, radius, spacing } from '@/theme';

interface StationListPromoBannerProps {
  visible: boolean;
  onDismiss: () => void;
}

export function StationListPromoBanner({ visible, onDismiss }: StationListPromoBannerProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.promo,
        {
          backgroundColor: isDark ? 'rgba(16, 201, 138, 0.08)' : themeColors.primarySoft,
          borderColor: isDark ? 'rgba(52, 211, 153, 0.28)' : '#A7F3D0',
        },
      ]}
    >
      <View
        style={[
          styles.promoIcon,
          { backgroundColor: isDark ? 'rgba(16, 201, 138, 0.16)' : themeColors.surface },
        ]}
      >
        <Ionicons name="pricetag" size={18} color={isDark ? '#34D399' : themeColors.primaryDark} />
      </View>
      <View style={styles.promoBody}>
        <Text style={[styles.promoTitle, { color: isDark ? '#6EE6A0' : themeColors.primaryDark }]}>
          {t('stationList.promoTitle')}
        </Text>
        <Text style={[styles.promoText, { color: isDark ? '#CBD5E1' : themeColors.textBody }]}>
          {t('stationList.promoBody')}
        </Text>
      </View>
      <Pressable hitSlop={8} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Đóng thông báo">
        <Ionicons name="close" size={16} color={isDark ? '#94A3B8' : themeColors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  promoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBody: { flex: 1, gap: spacing.xs },
  promoTitle: { fontSize: fontSizes.body, fontWeight: '700' },
  promoText: { fontSize: fontSizes.caption, lineHeight: lineHeights.body },
});
