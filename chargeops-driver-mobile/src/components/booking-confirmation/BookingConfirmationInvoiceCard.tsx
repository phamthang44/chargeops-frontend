import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatTime, formatVnd } from '@/utils/format';
import type { Quote } from '@/utils/pricing';

export interface BookingConfirmationInvoiceCardProps {
  quote: Quote;
  previewCode: string;
  isBackendVerified: boolean;
}

export function BookingConfirmationInvoiceCard({
  quote,
  previewCode,
  isBackendVerified,
}: BookingConfirmationInvoiceCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.cardTitleRow}>
        <Ionicons name="receipt-outline" size={18} color={themeColors.primary} />
        <Text style={[styles.cardTitle, { color: themeColors.textStrong }]}>
          {t('bookingConfirmation.invoiceTitle')}
        </Text>
        <StatusBadge
          variant={isBackendVerified ? 'success' : 'neutral'}
          label={isBackendVerified ? `${previewCode} · BE Verified` : previewCode}
        />
      </View>

      {quote.priceLines.map((line, i) => (
        <View key={i} style={styles.invoiceRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.invoiceLineTitle, { color: themeColors.textStrong }]}>
              {t('bookingConfirmation.chargingBand', {
                kind: t(`timeRangePicker.band.${line.rateKind}`),
                from: formatTime(line.fromAt),
                to: formatTime(line.toAt),
              })}
            </Text>
            <Text style={[styles.invoiceLineSub, { color: themeColors.textMuted }]}>
              {t('bookingConfirmation.bandSub', {
                kwh: line.energyKwh,
                rate: formatVnd(line.rateVndPerKwh),
              })}
            </Text>
          </View>
          <Text style={[styles.invoiceLineAmount, { color: themeColors.textStrong }]}>
            {formatVnd(line.amount)}
          </Text>
        </View>
      ))}

      {quote.serviceFee > 0 && (
        <View style={styles.invoiceRow}>
          <Text style={[styles.invoiceFeeLabel, { color: themeColors.textMuted }]}>
            {t('bookingConfirmation.serviceFee')}
          </Text>
          <Text style={[styles.invoiceFeeAmount, { color: themeColors.textStrong }]}>
            {formatVnd(quote.serviceFee)}
          </Text>
        </View>
      )}

      <View style={[styles.invoiceTotalRow, { borderTopColor: themeColors.border }]}>
        <Text style={[styles.totalLabel, { color: themeColors.textStrong }]}>
          {t('bookingConfirmation.total')}
        </Text>
        <Text style={[styles.totalAmount, { color: themeColors.textStrong }]}>
          {formatVnd(quote.totalPrice)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  cardTitle: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  invoiceLineTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  invoiceLineSub: { fontSize: fontSizes.caption },
  invoiceLineAmount: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  invoiceFeeLabel: { fontSize: fontSizes.caption },
  invoiceFeeAmount: { fontSize: fontSizes.body },
  invoiceTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  totalLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  totalAmount: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
});
