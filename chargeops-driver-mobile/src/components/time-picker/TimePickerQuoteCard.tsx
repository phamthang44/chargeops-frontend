import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatMinutes } from '@/utils/availability';
import { formatVnd } from '@/utils/format';

interface PriceLine {
  fromAt: string;
  toAt: string;
  rateKind: string;
  rateVndPerKwh: number;
  amount: number;
}

interface QuoteData {
  totalPrice: number;
  energyKwh: number;
  serviceFee: number;
  priceLines: PriceLine[];
}

interface TimePickerQuoteCardProps {
  quote: QuoteData | null;
  startAt: string | null;
  themeColors: any;
  t: (key: string, options?: any) => string;
}

export const TimePickerQuoteCard = React.memo(function TimePickerQuoteCard({
  quote,
  startAt,
  themeColors,
  t,
}: TimePickerQuoteCardProps) {
  if (!quote || !startAt) return null;

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.headerIconBox, { backgroundColor: `${themeColors.primary}18` }]}>
          <Ionicons name="receipt-outline" size={18} color={themeColors.primaryDark} />
        </View>
        <Text style={[styles.cardTitle, { color: themeColors.textStrong }]}>
          {t('timeRangePicker.priceTitle')}
        </Text>
      </View>

      {/* Breakdown Lines */}
      <View style={styles.breakdownList}>
        {quote.priceLines.map((line, i) => {
          const fromDate = new Date(line.fromAt);
          const toDate = new Date(line.toAt);
          const fromMin = fromDate.getHours() * 60 + fromDate.getMinutes();
          const toMin = toDate.getHours() * 60 + toDate.getMinutes();

          return (
            <View key={i} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text style={[styles.lineTimeRange, { color: themeColors.textStrong }]}>
                  {formatMinutes(fromMin)} – {formatMinutes(toMin)}
                </Text>
                <Text style={[styles.lineBand, { color: themeColors.textMuted }]}>
                  {t(`timeRangePicker.band.${line.rateKind}`)} · {t('timeRangePicker.perKwh', { rate: formatVnd(line.rateVndPerKwh) })}
                </Text>
              </View>
              <Text style={[styles.lineAmount, { color: themeColors.textStrong }]}>
                {formatVnd(line.amount)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Energy & Service fee */}
      <View style={styles.energyRow}>
        <View style={styles.energyBadge}>
          <Ionicons name="flash" size={14} color="#F59E0B" />
          <Text style={[styles.energyText, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.estEnergy', { kwh: quote.energyKwh })}
          </Text>
        </View>

        {quote.serviceFee > 0 && (
          <Text style={[styles.feeText, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.serviceFee')}: {formatVnd(quote.serviceFee)}
          </Text>
        )}
      </View>

      {/* Total row */}
      <View style={[styles.totalRow, { borderTopColor: themeColors.border }]}>
        <Text style={[styles.totalLabel, { color: themeColors.textStrong }]}>
          {t('timeRangePicker.total')}
        </Text>
        <Text style={[styles.totalAmount, { color: themeColors.primaryDark }]}>
          {formatVnd(quote.totalPrice)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1.2,
    padding: spacing.md + 2,
    gap: spacing.sm + 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 4,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
  },
  breakdownList: {
    gap: spacing.xs + 4,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineInfo: {
    flex: 1,
    gap: 2,
  },
  lineTimeRange: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  lineBand: {
    fontSize: 12.5,
  },
  lineAmount: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  energyText: {
    fontSize: 12.5,
    fontWeight: fontWeights.medium,
  },
  feeText: {
    fontSize: 12.5,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
  },
  totalAmount: {
    fontSize: 19,
    fontWeight: '800',
  },
});
