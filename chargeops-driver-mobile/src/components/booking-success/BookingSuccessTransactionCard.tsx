import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatDayMonth, formatTimeRange, formatVnd } from '@/utils/format';

interface BookingSuccessTransactionCardProps {
  booking: Booking;
}

function TxRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { themeColors } = usePreferences();
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconWrap, { backgroundColor: themeColors.surfaceAlt }]}>
        <Ionicons name={icon} size={15} color={themeColors.textMuted} />
      </View>
      <Text style={[styles.txLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <Text style={[styles.txValue, { color: themeColors.textStrong }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function BookingSuccessTransactionCard({ booking }: BookingSuccessTransactionCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.txCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.txHeader}>
        <View style={styles.txHeaderLeft}>
          <Ionicons name="document-text-outline" size={17} color={themeColors.primary} />
          <Text style={[styles.txTitle, { color: themeColors.textStrong }]}>{t('bookingSuccess.txTitle')}</Text>
        </View>
        <StatusBadge variant="success" label={t('bookingSuccess.paid')} dot />
      </View>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      <TxRow
        icon="business-outline"
        label={t('bookingSuccess.station')}
        value={booking.stationName}
      />
      <TxRow
        icon="flash-outline"
        label={t('bookingSuccess.connector')}
        value={`${booking.chargePointName} · ${booking.connectorName} (${booking.connectorType})`}
      />
      <TxRow
        icon="time-outline"
        label={t('bookingSuccess.window')}
        value={`${formatDayMonth(booking.startAt)} · ${formatTimeRange(booking.startAt, booking.endAt)}`}
      />

      <View style={[styles.dashedDivider, { borderColor: themeColors.border }]} />

      <View style={styles.totalRow}>
        <View style={styles.totalLabelWrap}>
          <View style={[styles.totalIconWrap, { backgroundColor: themeColors.primarySoft }]}>
            <Ionicons name="wallet-outline" size={16} color={themeColors.primary} />
          </View>
          <Text style={[styles.totalLabel, { color: themeColors.textStrong }]}>{t('bookingSuccess.total')}</Text>
        </View>
        <Text style={[styles.totalValue, { color: themeColors.primary }]}>
          {formatVnd(booking.totalPrice)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  txCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  txTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  divider: {
    height: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  txIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txLabel: {
    fontSize: fontSizes.body,
    width: 95,
  },
  txValue: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    textAlign: 'right',
  },
  dashedDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  totalLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  totalValue: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
  },
});
