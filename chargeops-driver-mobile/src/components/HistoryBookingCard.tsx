import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatDate, formatTimeRange, formatVnd } from '@/utils/format';

import { StatusBadge, type BadgeVariant } from './StatusBadge';

type StatusTone = 'success' | 'error' | 'info' | 'warning' | 'neutral';

const STATUS_TONE: Record<BookingStatus, StatusTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  CHECKED_IN: 'info',
  CHARGING: 'success',
  COMPLETED: 'success',
  CANCELLED: 'error',
  EXPIRED: 'neutral',
};

const STATUS_VARIANT: Record<StatusTone, BadgeVariant> = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
  neutral: 'neutral',
};

function statusLabelKey(booking: Booking): string {
  if (booking.status === 'CANCELLED' && booking.cancelReason === 'NO_SHOW') {
    return 'bookingStatus.NO_SHOW';
  }
  if (booking.status === 'CANCELLED' && booking.cancelReason === 'PAYMENT_TIMEOUT') {
    return 'bookingStatus.PAYMENT_TIMEOUT';
  }
  return `bookingStatus.${booking.status}`;
}

interface HistoryBookingCardProps {
  booking: Booking;
  onPress: () => void;
}

/** History-specific information hierarchy that leaves the active booking card untouched. */
export function HistoryBookingCard({ booking, onPress }: HistoryBookingCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const tone = STATUS_TONE[booking.status];
  const accent = {
    success: themeColors.success,
    error: themeColors.error,
    info: themeColors.info,
    warning: themeColors.warning,
    neutral: themeColors.textMuted,
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${booking.stationName}, ${t(statusLabelKey(booking))}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderLeftColor: accent,
          shadowColor: themeColors.textStrong,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.992 : 1 }],
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.stationIcon, { backgroundColor: `${accent}1A` }]}>
          <Ionicons name="flash" size={17} color={accent} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.stationName, { color: themeColors.textStrong }]} numberOfLines={1}>
            {booking.stationName}
          </Text>
          <Text style={[styles.code, { color: themeColors.textMuted }]}>
            {t('bookingCard.code', { code: booking.code })}
          </Text>
        </View>
        <StatusBadge
          variant={STATUS_VARIANT[tone]}
          label={t(statusLabelKey(booking))}
          dot
          style={styles.statusBadge}
        />
      </View>

      <View
        style={[
          styles.timePanel,
          { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
        ]}
      >
        <View style={[styles.timeIcon, { backgroundColor: `${themeColors.primary}18` }]}>
          <Ionicons name="calendar-clear-outline" size={17} color={themeColors.primaryDark} />
        </View>
        <View style={styles.timeCopy}>
          <Text style={[styles.dateText, { color: themeColors.textStrong }]}>
            {formatDate(booking.startAt)}
          </Text>
          <Text style={[styles.timeText, { color: themeColors.textMuted }]}>
            {formatTimeRange(booking.startAt, booking.endAt)}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={16} color={themeColors.textMuted} />
        <Text style={[styles.detailText, { color: themeColors.textBody }]} numberOfLines={1}>
          {booking.stationAddress}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="hardware-chip-outline" size={16} color={themeColors.textMuted} />
        <Text style={[styles.detailText, { color: themeColors.textBody }]} numberOfLines={1}>
          {booking.chargePointName} · {booking.connectorName} · {booking.connectorType} {booking.powerKw}kW
        </Text>
      </View>

      <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
        <View>
          <Text style={[styles.totalLabel, { color: themeColors.textMuted }]}>
            {t('bookingCard.total')}
          </Text>
          <Text style={[styles.total, { color: themeColors.textStrong }]}>
            {formatVnd(booking.totalPrice)}
          </Text>
        </View>
        <View style={styles.footerMeta}>
          <Text style={[styles.energy, { color: themeColors.textMuted }]}>
            {booking.energyKwh.toFixed(1)} kWh
          </Text>
          <View style={[styles.chevron, { backgroundColor: themeColors.surfaceAlt }]}>
            <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: spacing.lg,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stationIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, minWidth: 0 },
  stationName: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.body,
  },
  code: { fontSize: fontSizes.caption, marginTop: 1 },
  statusBadge: { paddingHorizontal: spacing.sm },
  timePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  timeIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCopy: { flex: 1 },
  dateText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  timeText: { fontSize: fontSizes.caption, marginTop: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  totalLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  total: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, marginTop: 2 },
  footerMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  energy: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
