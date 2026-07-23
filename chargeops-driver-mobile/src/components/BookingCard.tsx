import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatDate, formatTimeRange, formatVnd } from '@/utils/format';

import { StatusBadge, type BadgeVariant } from './StatusBadge';

const STATUS_VARIANT: Record<BookingStatus, BadgeVariant> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CHECKED_IN: 'info',
  CHARGING: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'error',
  EXPIRED: 'neutral',
};

/**
 * A no-show is stored as CANCELLED (there is no NO_SHOW state — BR-BOK-05), but
 * the driver still needs to see why it ended that way, so the reason overrides
 * the status label on the badge.
 */
function statusLabelKey(b: Booking): string {
  if (b.status === 'CANCELLED' && b.cancelReason === 'NO_SHOW') return 'bookingStatus.NO_SHOW';
  if (b.status === 'CANCELLED' && b.cancelReason === 'PAYMENT_TIMEOUT') {
    return 'bookingStatus.PAYMENT_TIMEOUT';
  }
  return `bookingStatus.${b.status}`;
}

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
  /** Optional element rendered at the footer's right (e.g. a status action button). */
  action?: ReactNode;
  /** Optional strip rendered at the very top of the card (e.g. a live-charging banner). */
  banner?: ReactNode;
  /** Optional left-edge accent color (e.g. emphasize an active session). */
  accentColor?: string;
}

/**
 * Shared booking summary card used by the Đặt chỗ (Bookings) and Lịch sử (History)
 * lists: station, code, time/place/charger meta, and a total + optional action footer.
 * An optional `banner` strip and left `accentColor` let callers flag special states.
 */
export function BookingCard({ booking: b, onPress, action, banner, accentColor }: BookingCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      style={[styles.card, accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : null]}
      onPress={onPress}
    >
      {banner ? <View style={styles.banner}>{banner}</View> : null}
      <View style={styles.cardTop}>
        <Text style={styles.stationName} numberOfLines={1}>
          {b.stationName}
        </Text>
        <StatusBadge variant={STATUS_VARIANT[b.status]} label={t(statusLabelKey(b))} />
      </View>
      <Text style={styles.code}>{t('bookingCard.code', { code: b.code })}</Text>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={15} color={colors.primary} />
        <Text style={styles.metaText}>
          {formatDate(b.startAt)} • {formatTimeRange(b.startAt, b.endAt)}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={15} color={colors.primary} />
        <Text style={styles.metaText} numberOfLines={1}>
          {b.stationAddress}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="flash-outline" size={15} color={colors.primary} />
        <Text style={styles.metaText}>
          {b.chargePointName} • {b.connectorName} • {b.connectorType} ({b.powerKw}kW)
        </Text>
      </View>

      <View style={styles.dashDivider} />

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>{t('bookingCard.total')}</Text>
          <Text style={styles.total}>{formatVnd(b.totalPrice)}</Text>
        </View>
        {action}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  banner: { marginBottom: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  stationName: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  code: { fontSize: fontSizes.caption, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { flex: 1, fontSize: fontSizes.body, color: colors.textBody, lineHeight: lineHeights.body },
  dashDivider: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.border, marginVertical: spacing.xs },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSizes.caption, color: colors.textMuted, letterSpacing: 0.5 },
  total: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
});
