import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
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

/** Dynamic theme-aware booking summary card. */
export function BookingCard({ booking: b, onPress, action, banner, accentColor }: BookingCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          ...(Platform.OS !== 'web' ? { shadowColor: themeColors.textStrong } : {}),
        },
        accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : null,
      ]}
      onPress={onPress}
    >
      {banner ? <View style={styles.banner}>{banner}</View> : null}
      <View style={styles.cardTop}>
        <Text style={[styles.stationName, { color: themeColors.textStrong }]} numberOfLines={1}>
          {b.stationName}
        </Text>
        <StatusBadge variant={STATUS_VARIANT[b.status]} label={t(statusLabelKey(b))} />
      </View>
      <Text style={[styles.code, { color: themeColors.textMuted }]}>{t('bookingCard.code', { code: b.code })}</Text>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={15} color={themeColors.primary} />
        <Text style={[styles.metaText, { color: themeColors.textBody }]}>
          {formatDate(b.startAt)} • {formatTimeRange(b.startAt, b.endAt)}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={15} color={themeColors.primary} />
        <Text style={[styles.metaText, { color: themeColors.textBody }]} numberOfLines={1}>
          {b.stationAddress}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="flash-outline" size={15} color={themeColors.primary} />
        <Text style={[styles.metaText, { color: themeColors.textBody }]}>
          {b.chargePointName} • {b.connectorName} • {b.connectorType} ({b.powerKw}kW)
        </Text>
      </View>

      <View style={[styles.dashDivider, { borderColor: themeColors.border }]} />

      <View style={styles.cardFooter}>
        <View>
          <Text style={[styles.totalLabel, { color: themeColors.textMuted }]}>{t('bookingCard.total')}</Text>
          <Text style={[styles.total, { color: themeColors.textStrong }]}>{formatVnd(b.totalPrice)}</Text>
        </View>
        {action}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  banner: { marginBottom: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  stationName: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  code: { fontSize: fontSizes.caption },
  divider: { height: 1, marginVertical: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { flex: 1, fontSize: fontSizes.body, lineHeight: lineHeights.body },
  dashDivider: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', marginVertical: spacing.xs },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSizes.caption, letterSpacing: 0.5 },
  total: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
});
