import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { isMockMode } from '@/services/stationService';
import { fontSizes, fontWeights, spacing } from '@/theme';
import { formatVnd } from '@/utils/format';
import type { BackendPricePreviewResponse } from '@/services/bookingService';

export interface BookingConfirmationFooterProps {
  totalPrice: number;
  submitting: boolean;
  loading: boolean;
  backendPreview: BackendPricePreviewResponse | null;
  onSubmit: () => void;
}

export function BookingConfirmationFooter({
  totalPrice,
  submitting,
  loading,
  backendPreview,
  onSubmit,
}: BookingConfirmationFooterProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const insets = useSafeAreaInsets();

  const isPricingInvalid =
    !isMockMode() &&
    (!backendPreview || !/^[0-9a-fA-F]{64}$/.test(backendPreview.pricingVersion?.trim() || ''));

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <View style={styles.footerRow}>
        <View>
          <Text style={[styles.footerLabel, { color: themeColors.textMuted }]}>
            {t('bookingConfirmation.totalPayment')}
          </Text>
          <Text style={[styles.footerAmount, { color: themeColors.textStrong }]}>
            {formatVnd(totalPrice)}
          </Text>
        </View>
        <AppButton
          label={t('bookingConfirmation.payBtn', { amount: formatVnd(totalPrice) })}
          loading={submitting}
          disabled={submitting || loading || isPricingInvalid}
          onPress={onSubmit}
          style={styles.payBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  footerLabel: { fontSize: fontSizes.caption },
  footerAmount: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  payBtn: { flex: 1 },
});
