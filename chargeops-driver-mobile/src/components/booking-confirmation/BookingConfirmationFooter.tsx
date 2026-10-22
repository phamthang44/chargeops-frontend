import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/AppButton';
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
  isTabletOrSplit?: boolean;
}

export function BookingConfirmationFooter({
  totalPrice,
  submitting,
  loading,
  backendPreview,
  onSubmit,
  isTabletOrSplit = false,
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
        styles.footerWrapper,
        {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <View style={[styles.footerContent, isTabletOrSplit && styles.footerContentSplit]}>
        <View style={styles.amountBlock}>
          <Text style={[styles.footerLabel, { color: themeColors.textMuted }]}>
            {t('bookingConfirmation.totalPayment')}
          </Text>
          <Text style={[styles.footerAmount, { color: themeColors.primaryDark }]}>
            {formatVnd(totalPrice)}
          </Text>
        </View>

        <AppButton
          label={t('bookingConfirmation.payBtn', { amount: formatVnd(totalPrice) })}
          loading={submitting}
          disabled={submitting || loading || isPricingInvalid}
          onPress={onSubmit}
          style={isTabletOrSplit ? styles.payBtnSplit : styles.payBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerWrapper: {
    width: '100%',
    borderTopWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 12,
  },
  footerContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerContentSplit: {
    paddingVertical: spacing.md,
    gap: spacing.xl,
  },
  amountBlock: {
    gap: 3,
  },
  footerLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  footerAmount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  payBtn: {
    flex: 1,
  },
  payBtnSplit: {
    flex: 0,
    minWidth: 260,
    maxWidth: 360,
  },
});
