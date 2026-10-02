import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatTime, formatVnd } from '@/utils/format';
import { SectionHeading } from './SectionHeading';

export interface BookingPaymentCardProps {
  booking: Booking;
  hasAccountingDiscrepancy: boolean;
  durationText: string;
}

export function BookingPaymentCard({
  booking,
  hasAccountingDiscrepancy,
  durationText,
}: BookingPaymentCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const paymentDetail = booking.paymentDetail;

  return (
    <>
      <SectionHeading
        icon="receipt-outline"
        title={t('bookingDetail.paymentTitle')}
        color={themeColors.primary}
        textColor={themeColors.textStrong}
      />

      <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        {booking.priceLines.map((line, i) => {
          const fromTime = line.fromAt ?? (line as any).startAt ?? booking.startAt;
          const toTime = line.toAt ?? (line as any).endAt ?? booking.endAt;
          const kind = line.rateKind ?? (line as any).periodCode ?? 'STANDARD';
          const kwh = line.energyKwh ?? (line as any).estimatedEnergyKwh ?? (booking.energyKwh || 0);
          const rate = line.rateVndPerKwh ?? 0;
          const amount = line.amount ?? 0;
          const kindStr = String(kind);
          const bandKey = `timeRangePicker.band.${kindStr}`;
          const fallbackBand =
            kindStr === 'PEAK'
              ? 'Giờ cao điểm'
              : kindStr === 'OFF_PEAK' || kindStr === 'OFFPEAK'
              ? 'Giờ thấp điểm'
              : 'Giờ bình thường';
          const bandLabel = t(bandKey, fallbackBand);

          return (
            <View key={`${fromTime}-${toTime}-${i}`} style={styles.invoiceRow}>
              <View style={styles.invoiceCopy}>
                <View style={styles.invoiceBandRow}>
                  <View style={[styles.bandPill, { backgroundColor: `${themeColors.primary}12` }]}>
                    <Text style={[styles.bandPillText, { color: themeColors.primaryDark }]}>{bandLabel}</Text>
                  </View>
                  <Text style={[styles.invoiceTime, { color: themeColors.textBody }]}>
                    ({formatTime(fromTime)} - {formatTime(toTime)})
                  </Text>
                </View>
                <Text style={[styles.invoiceSub, { color: themeColors.textMuted }]}>
                  {Number(kwh).toFixed(1)} kWh × {formatVnd(rate)}/kWh
                </Text>
              </View>
              <Text style={[styles.invoiceValue, { color: themeColors.textStrong }]}>{formatVnd(amount)}</Text>
            </View>
          );
        })}

        {Boolean(booking.serviceFee && booking.serviceFee > 0) && (
          <View style={styles.invoiceRow}>
            <Text style={[styles.invoiceSub, { color: themeColors.textMuted }]}>{t('bookingDetail.serviceFee')}</Text>
            <Text style={[styles.invoiceValue, { color: themeColors.textStrong }]}>{formatVnd(booking.serviceFee)}</Text>
          </View>
        )}

        <View style={[styles.totalPanel, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
          <View>
            <Text style={[styles.totalLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.total')}</Text>
            <Text style={[styles.totalValue, { color: themeColors.textStrong }]}>{formatVnd(booking.totalPrice)}</Text>
          </View>
          <View style={styles.totalMeta}>
            <Text style={[styles.energyValue, { color: themeColors.textMuted }]}>{booking.energyKwh.toFixed(1)} kWh</Text>
            <Text style={[styles.energyValue, { color: themeColors.textMuted }]}>{durationText}</Text>
          </View>
        </View>

        {hasAccountingDiscrepancy && paymentDetail && (
          <View
            style={[
              styles.accountingCard,
              { backgroundColor: `${themeColors.info}10`, borderColor: `${themeColors.info}30` },
            ]}
          >
            <View style={styles.accountingHeader}>
              <Ionicons name="wallet-outline" size={16} color={themeColors.info} />
              <Text style={[styles.accountingTitle, { color: themeColors.textStrong }]}>
                {t('bookingDetail.accountingTitle')}
              </Text>
            </View>
            <View style={styles.accountingGrid}>
              <View style={styles.accountingItem}>
                <Text style={[styles.accountingLabel, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.accountingCollected')}
                </Text>
                <Text style={[styles.accountingValue, { color: themeColors.textStrong }]}>
                  {formatVnd(paymentDetail.collectedAmount ?? 0)}
                </Text>
              </View>
              <View style={styles.accountingItem}>
                <Text style={[styles.accountingLabel, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.accountingApplied')}
                </Text>
                <Text style={[styles.accountingValue, { color: themeColors.textStrong }]}>
                  {formatVnd(paymentDetail.appliedAmount ?? paymentDetail.appliedToPackageAmount ?? 0)}
                </Text>
              </View>
              <View style={styles.accountingItem}>
                <Text style={[styles.accountingLabel, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.accountingUnallocated')}
                </Text>
                <Text style={[styles.accountingValue, { color: themeColors.primary }]}>
                  {formatVnd(paymentDetail.unallocatedAmount ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.paidViaRow}>
          <Ionicons name="wallet-outline" size={14} color={themeColors.textMuted} />
          <Text style={[styles.paidVia, { color: themeColors.textMuted }]}>
            {t('payment.paidVia', { method: t(`payment.${booking.paymentMethod}`) })}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  invoiceRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  invoiceCopy: { flex: 1, minWidth: 0, gap: 3 },
  invoiceBandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  bandPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  bandPillText: { fontSize: 11, fontWeight: fontWeights.bold, letterSpacing: 0.3 },
  invoiceTime: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  invoiceSub: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption, marginTop: 1 },
  invoiceValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  totalPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  totalLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: { marginTop: spacing.xs, fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  totalMeta: { alignItems: 'flex-end', gap: spacing.xs },
  energyValue: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },
  paidViaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  paidVia: { fontSize: fontSizes.caption },

  accountingCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  accountingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  accountingTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  accountingGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  accountingItem: { flex: 1, minWidth: 0 },
  accountingLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  accountingValue: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    marginTop: 2,
  },
});
