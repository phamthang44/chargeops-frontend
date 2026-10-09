import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import { formatVnd } from '@/utils/format';
import { BezelCard } from './BezelCard';

export interface BookingRefundPolicyCardProps {
  isConfirmed: boolean;
  refundableAmount: number;
}

export function BookingRefundPolicyCard({
  isConfirmed,
  refundableAmount,
}: BookingRefundPolicyCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <BezelCard
      tone={themeColors.error}
      coreColor={`${themeColors.error}0A`}
      contentStyle={styles.refundCard}
    >
      <View style={styles.refundHeader}>
        <View style={[styles.refundIcon, { backgroundColor: `${themeColors.error}14` }]}>
          <Ionicons name="shield-checkmark-outline" size={17} color={themeColors.error} />
        </View>
        <Text style={[styles.refundTitle, { color: themeColors.textStrong }]}>
          {t('bookingDetail.refundTitle')}
        </Text>
      </View>
      <Text style={[styles.refundText, { color: themeColors.textBody }]}>
        {t('bookingDetail.refundBody')}
      </Text>
      {isConfirmed && (
        <View style={[styles.refundNowRow, { borderTopColor: `${themeColors.error}26` }]}>
          <Text style={[styles.refundNowLabel, { color: themeColors.textBody }]}>
            {t('bookingDetail.refundNow')}
          </Text>
          <Text style={[styles.refundNowValue, { color: themeColors.textStrong }]}>
            {formatVnd(refundableAmount)}
          </Text>
        </View>
      )}
    </BezelCard>
  );
}

const styles = StyleSheet.create({
  refundCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  refundHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refundIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  refundText: { fontSize: fontSizes.caption, lineHeight: lineHeights.body },
  refundNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  refundNowLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  refundNowValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
});
