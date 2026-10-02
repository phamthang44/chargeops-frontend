import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface ProfilePaymentSectionProps {
  savedPaymentMethodsCount: number;
  preferredPaymentTitle: string;
  onPressPaymentMethods: () => void;
  onPressHistory: () => void;
}

export function ProfilePaymentSection({
  savedPaymentMethodsCount,
  preferredPaymentTitle,
  onPressPaymentMethods,
  onPressHistory,
}: ProfilePaymentSectionProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="card-outline" size={20} color={themeColors.primary} />
        <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
          {t('profile.wallet.sectionTitle', 'Thanh toán')}
        </Text>
      </View>

      {/* List Item: Payment Methods Management */}
      <Pressable style={styles.menuRow} onPress={onPressPaymentMethods}>
        <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
          <Ionicons name="wallet-outline" size={20} color={themeColors.primary} />
        </View>
        <View style={styles.menuTextContent}>
          <View style={styles.paymentMethodTitleRow}>
            <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
              {t('profile.wallet.paymentMethods', 'Phương thức thanh toán')}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: themeColors.primarySoft }]}>
              <Text style={[styles.countBadgeText, { color: themeColors.primaryDark }]}>
                {savedPaymentMethodsCount}
              </Text>
            </View>
          </View>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]} numberOfLines={1}>
            {t('profile.wallet.defaultPrefix', 'Ưu tiên')}: {preferredPaymentTitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
      </Pressable>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* List Item: Transaction History */}
      <Pressable style={styles.menuRow} onPress={onPressHistory}>
        <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
          <Ionicons name="time-outline" size={20} color={isDark ? '#818CF8' : '#6366F1'} />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
            {t('profile.wallet.history')}
          </Text>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
            {t('profile.wallet.historySub')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.semibold,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuIconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContent: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  paymentMethodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  menuSub: {
    fontSize: fontSizes.caption,
  },
});
