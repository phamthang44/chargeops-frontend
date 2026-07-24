import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, CancelBookingSheet, GlassButton, StatusBadge, type BadgeVariant } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  CHECK_IN_WINDOW_MIN,
  computeRefund,
  getBookingById,
} from '@/services/bookingService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import {
  formatCountdown,
  formatDate,
  formatMmSs,
  formatTime,
  formatTimeRange,
  formatVnd,
  splitDuration,
} from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingDetail'>;
type Route = RouteProp<RootStackParamList, 'BookingDetail'>;

const STATUS_VARIANT: Record<BookingStatus, BadgeVariant> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CHECKED_IN: 'info',
  CHARGING: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'error',
  EXPIRED: 'neutral',
};

/** Bookings that are still actionable (paid + can check in / cancel). */
const ACTIVE_STATUSES: BookingStatus[] = ['CONFIRMED'];

/** Check-in closes this long after the start time; after that it's a no-show (BR-BOK-04/05). */
const CHECK_IN_WINDOW_MS = CHECK_IN_WINDOW_MIN * 60_000;

/**
 * "Chi tiết đặt chỗ" — a single booking. For upcoming bookings it shows a live
 * check-in countdown (to auto-cancel) and the Scan-QR / Cancel actions; for past
 * bookings it shows a status note instead.
 */
export function BookingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    getBookingById(params.bookingId).then((b) => {
      if (active) {
        setBooking(b);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [params.bookingId]);

  useEffect(() => {
    if (!booking) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [booking]);

  if (loading || !booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <GlassButton
            size={40}
            glassEffectStyle="regular"
            fallbackColor={themeColors.surfaceAlt}
            accessibilityLabel={t('common.back')}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={themeColors.textStrong} />
          </GlassButton>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingDetail.title')}</Text>
          <View style={styles.headerBtn} />
        </View>
        {loading ? (
          <ActivityIndicator color={themeColors.primary} style={styles.loader} />
        ) : (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{t('bookingDetail.notFound')}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const startMs = new Date(booking.startAt).getTime();
  const endMs = new Date(booking.endAt).getTime();
  const checkInDeadlineMs = startMs + CHECK_IN_WINDOW_MS;
  const isConfirmed = booking.status === 'CONFIRMED';
  const isPending = booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED';
  const isCompleted = booking.status === 'COMPLETED';

  const windowStarted = now >= startMs;
  const windowPassed = now > checkInDeadlineMs;
  const msToCheckInClose = Math.max(0, checkInDeadlineMs - now);

  const canCheckIn = isConfirmed && windowStarted && !windowPassed;
  const refund = computeRefund(booking, now);

  const durationMin = Math.round((endMs - startMs) / 60_000);
  const { hours, minutes } = splitDuration(durationMin);
  const durationText =
    hours === 0
      ? t('timeRangePicker.durationMin', { minutes })
      : minutes === 0
        ? t('timeRangePicker.durationHour', { hours })
        : t('timeRangePicker.durationHourMin', { hours, minutes });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={themeColors.surfaceAlt}
          accessibilityLabel={t('common.back')}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={themeColors.textStrong} />
        </GlassButton>
        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingDetail.title')}</Text>
          <Text style={[styles.headerRole, { color: themeColors.primary }]}>{t('bookingDetail.role')}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Code & Status */}
        <View style={styles.codeRow}>
          <View>
            <Text style={[styles.codeLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.code')}</Text>
            <Text style={[styles.code, { color: themeColors.textStrong }]}>{booking.code}</Text>
          </View>
          <StatusBadge
            variant={STATUS_VARIANT[booking.status]}
            label={t(`bookingStatus.${booking.status}`)}
          />
        </View>

        {/* Check-in countdown banner */}
        {isConfirmed && (
          <View style={[styles.countdownCard, { backgroundColor: themeColors.primarySoft }]}>
            <View style={styles.countdownLabelRow}>
              <Ionicons name="timer-outline" size={18} color={themeColors.primaryDark} />
              <Text style={[styles.countdownLabel, { color: themeColors.primaryDark }]}>{t('bookingDetail.countdownTitle')}</Text>
            </View>

            <Text style={[styles.countdown, { color: themeColors.primaryDark }]}>{formatCountdown(msToCheckInClose)}</Text>

            <Text style={[styles.infoNoteText, { color: themeColors.textBody, textAlign: 'center' }]}>
              {t('bookingDetail.countdownNote')}
            </Text>
          </View>
        )}

        {/* Unpaid pending hold notice */}
        {isPending && booking.expiresAt && (
          <View style={[styles.holdNote, { backgroundColor: `${themeColors.warning}1A` }]}>
            <Ionicons name="time-outline" size={18} color={themeColors.warning} />
            <Text style={[styles.holdText, { color: themeColors.textBody }]}>
              {t('bookingDetail.holdNote', {
                time: formatCountdown(Math.max(0, new Date(booking.expiresAt).getTime() - now)),
              })}
            </Text>
          </View>
        )}

        {/* Grace period banner */}
        {isConfirmed && refund.tier === 'GRACE' && (
          <View style={[styles.graceCard, { backgroundColor: themeColors.primarySoft }]}>
            <Ionicons name="arrow-undo-outline" size={18} color={themeColors.primaryDark} />
            <Text style={[styles.graceText, { color: themeColors.primaryDark }]}>
              {t('bookingDetail.graceHint', { time: formatMmSs(refund.graceRemainingMs) })}
            </Text>
          </View>
        )}

        {/* Station Info */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="business-outline" size={18} color={themeColors.primary} />
          <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>{t('bookingDetail.stationTitle')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.stationName, { color: themeColors.textStrong }]}>{booking.stationName}</Text>
          <View style={styles.addrRow}>
            <Ionicons name="location-outline" size={14} color={themeColors.textMuted} />
            <Text style={[styles.addr, { color: themeColors.textMuted }]}>{booking.stationAddress}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={[styles.gridLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.chargePoint')}</Text>
              <Text style={[styles.gridValue, { color: themeColors.textStrong }]}>{booking.chargePointName}</Text>
              {booking.zoneLabel && <Text style={[styles.gridSub, { color: themeColors.textMuted }]}>{booking.zoneLabel}</Text>}
            </View>
            <View style={[styles.gridCell, styles.gridCellRight]}>
              <Text style={[styles.gridLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.connector')}</Text>
              <Text style={[styles.gridValue, { color: themeColors.textStrong }]}>{booking.connectorName}</Text>
              <View style={styles.connectorBadge}>
                <StatusBadge variant="neutral" label={`${booking.connectorType} · ${booking.powerKw}kW`} />
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={[styles.gridLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.date')}</Text>
              <Text style={[styles.gridValue, { color: themeColors.textStrong }]}>{formatDate(booking.startAt)}</Text>
            </View>
            <View style={[styles.gridCell, styles.gridCellRight]}>
              <Text style={[styles.gridLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.timeRange')}</Text>
              <Text style={[styles.gridValue, { color: themeColors.textStrong }]}>
                {formatTimeRange(booking.startAt, booking.endAt)}
              </Text>
              <Text style={[styles.gridSub, { color: themeColors.textMuted }]}>{durationText}</Text>
            </View>
          </View>
        </View>

        {/* Invoice details */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="receipt-outline" size={18} color={themeColors.primary} />
          <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>{t('bookingDetail.paymentTitle')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          {booking.priceLines.map((line, i) => (
            <View key={i} style={styles.invoiceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.invoiceLabel, { color: themeColors.textBody }]}>
                  {t(`timeRangePicker.band.${line.rateKind}`)} ({formatTime(line.fromAt)}–{formatTime(line.toAt)})
                </Text>
                <Text style={[styles.invoiceSub, { color: themeColors.textMuted }]}>
                  {line.energyKwh} kWh × {formatVnd(line.rateVndPerKwh)}
                </Text>
              </View>
              <Text style={[styles.invoiceValue, { color: themeColors.textStrong }]}>{formatVnd(line.amount)}</Text>
            </View>
          ))}

          <View style={styles.invoiceRow}>
            <Text style={[styles.invoiceSub, { color: themeColors.textMuted }]}>{t('bookingDetail.serviceFee')}</Text>
            <Text style={[styles.invoiceValue, { color: themeColors.textStrong }]}>{formatVnd(booking.serviceFee)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <View style={styles.invoiceRow}>
            <Text style={[styles.totalLabel, { color: themeColors.textStrong }]}>{t('bookingDetail.total')}</Text>
            <Text style={[styles.totalValue, { color: themeColors.primary }]}>{formatVnd(booking.totalPrice)}</Text>
          </View>

          <View style={styles.paidViaRow}>
            <Ionicons name="wallet-outline" size={14} color={themeColors.textMuted} />
            <Text style={[styles.paidVia, { color: themeColors.textMuted }]}>
              {t('payment.paidVia', { method: t(`payment.${booking.paymentMethod}`) })}
            </Text>
          </View>
        </View>

        {/* Refund Policy */}
        <View style={[styles.refundCard, { backgroundColor: `${themeColors.error}14` }]}>
          <View style={styles.refundHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={themeColors.error} />
            <Text style={[styles.refundTitle, { color: themeColors.error }]}>{t('bookingDetail.refundTitle')}</Text>
          </View>
          <Text style={[styles.refundText, { color: themeColors.textBody }]}>{t('bookingDetail.refundBody')}</Text>
          {isConfirmed && (
            <View style={styles.refundNowRow}>
              <Text style={[styles.refundNowLabel, { color: themeColors.textBody }]}>{t('bookingDetail.refundNow')}</Text>
              <Text style={[styles.refundNowValue, { color: themeColors.textStrong }]}>{formatVnd(refund.refundAmount)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer CTAs */}
      {isConfirmed && (
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <AppButton
            label={t('bookingDetail.cta')}
            disabled={!canCheckIn}
            onPress={() => navigation.navigate('QRCheckIn', { bookingId: booking.id })}
          />
          <AppButton
            label={t('bookingDetail.cancel')}
            variant="secondary"
            onPress={() => setShowCancel(true)}
          />
        </View>
      )}

      {/* Cancel sheet */}
      <CancelBookingSheet
        visible={showCancel}
        booking={booking}
        onClose={() => setShowCancel(false)}
        onConfirmed={(updated) => {
          setBooking(updated);
          setShowCancel(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: fontSizes.body },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitleBlock: { alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  headerRole: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 1 },

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, letterSpacing: 0.5 },
  code: { fontSize: fontSizes.title, fontWeight: fontWeights.bold },

  countdownCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  countdownLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  countdownLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  countdown: { fontSize: 40, fontWeight: fontWeights.bold, letterSpacing: 2 },

  infoNoteText: { fontSize: fontSizes.caption, lineHeight: lineHeights.body },

  holdNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  holdText: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.body },

  graceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  graceText: { flex: 1, fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stationName: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  addr: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  divider: { height: 1 },

  gridRow: { flexDirection: 'row' },
  gridCell: { flex: 1, gap: spacing.xs },
  gridCellRight: { alignItems: 'flex-end' },
  gridLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, letterSpacing: 0.5 },
  gridValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  gridSub: { fontSize: fontSizes.caption },
  connectorBadge: { alignSelf: 'flex-end' },

  invoiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  invoiceLabel: { fontSize: fontSizes.body },
  invoiceSub: { fontSize: fontSizes.caption },
  invoiceValue: { fontSize: fontSizes.body, fontWeight: fontWeights.medium },
  totalLabel: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  totalValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  paidViaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  paidVia: { fontSize: fontSizes.caption },

  refundCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  refundHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refundTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  refundText: { fontSize: fontSizes.caption, lineHeight: lineHeights.body },
  refundNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  refundNowLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  refundNowValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
});
