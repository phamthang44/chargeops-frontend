import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, CancelBookingSheet, GlassButton, StatusBadge, type BadgeVariant } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import {
  CHECK_IN_WINDOW_MIN,
  computeRefund,
  getBookingById,
  GRACE_PERIOD_MIN,
} from '@/services/bookingService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
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

  const isActive = booking ? ACTIVE_STATUSES.includes(booking.status) : false;
  const isAwaitingPayment = booking?.status === 'PENDING';

  // Tick once per second while any countdown is on screen: the check-in window,
  // the unpaid hold, or the grace period.
  useEffect(() => {
    if (!isActive && !isAwaitingPayment) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isActive, isAwaitingPayment]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header onBack={() => navigation.goBack()} />
        <Text style={styles.notFound}>{t('bookingDetail.notFound')}</Text>
      </SafeAreaView>
    );
  }

  const deadline = new Date(booking.startAt).getTime() + CHECK_IN_WINDOW_MS;
  const remaining = deadline - now;

  // FR05 reconsideration window: for five minutes after booking, cancelling is
  // free whatever the time-based tier would say. Surfaced as a live countdown so
  // the driver knows the undo exists and when it runs out.
  const refund = computeRefund(booking, now);
  const cancellable = booking.status === 'CONFIRMED' || booking.status === 'PENDING';
  const inGrace = cancellable && refund.graceRemainingMs > 0;
  const graceEndsAt = new Date(booking.createdAt).getTime() + GRACE_PERIOD_MIN * 60_000;

  // BR-BOK-02: an unpaid booking only holds its range for ten minutes.
  const holdRemaining = booking.expiresAt ? new Date(booking.expiresAt).getTime() - now : 0;

  const { hours: durH, minutes: durM } = splitDuration(booking.durationMin);
  const durationText =
    durH === 0
      ? t('timeRangePicker.durationMin', { minutes: durM })
      : durM === 0
        ? t('timeRangePicker.durationHour', { hours: durH })
        : t('timeRangePicker.durationHourMin', { hours: durH, minutes: durM });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Code + status */}
        <View style={styles.codeRow}>
          <View>
            <Text style={styles.codeLabel}>{t('bookingDetail.code')}</Text>
            <Text style={styles.code}>#{booking.code}</Text>
          </View>
          <StatusBadge
            variant={STATUS_VARIANT[booking.status]}
            label={t(`bookingStatus.${booking.status}`)}
          />
        </View>

        {/* Countdown (active) or status note (past) */}
        {isActive ? (
          <>
            <View style={styles.countdownCard}>
              <View style={styles.countdownLabelRow}>
                <Ionicons name="time-outline" size={16} color={colors.primaryDark} />
                <Text style={styles.countdownLabel}>{t('bookingDetail.countdownTitle')}</Text>
              </View>
              <Text style={styles.countdown}>{formatCountdown(remaining)}</Text>
            </View>
            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={18} color={colors.info} />
              <Text style={styles.infoNoteText}>{t('bookingDetail.countdownNote')}</Text>
            </View>
          </>
        ) : isAwaitingPayment ? (
          // The range is only held, not booked, until payment lands (BR-BOK-02).
          <View style={styles.holdNote}>
            <Ionicons name="hourglass-outline" size={18} color={colors.warning} />
            <Text style={styles.holdText}>
              {t('bookingDetail.holdNote', { time: formatMmSs(holdRemaining) })}
            </Text>
          </View>
        ) : (
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoNoteText}>{statusNote(booking, t)}</Text>
          </View>
        )}

        {/* Grace period — free cancellation for five minutes after booking (FR05) */}
        {inGrace && (
          <View style={styles.graceCard}>
            <Ionicons name="arrow-undo-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.graceText}>
              {t('bookingDetail.graceHint', { time: formatTime(new Date(graceEndsAt).toISOString()) })}
            </Text>
            <Text style={styles.graceTimer}>{formatMmSs(refund.graceRemainingMs)}</Text>
          </View>
        )}

        {/* Station info */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="flash" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('bookingDetail.stationTitle')}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.hero}>
            <Ionicons name="image-outline" size={36} color={colors.textMuted} />
          </View>
          <Text style={styles.stationName}>{booking.stationName}</Text>
          <View style={styles.addrRow}>
            <Ionicons name="location-outline" size={15} color={colors.textMuted} />
            <Text style={styles.addr}>{booking.stationAddress}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>{t('bookingDetail.chargePoint')}</Text>
              <Text style={styles.gridValue}>
                {booking.chargePointName} · {booking.connectorName}
              </Text>
              {booking.zoneLabel && <Text style={styles.gridSub}>{booking.zoneLabel}</Text>}
            </View>
            <View style={[styles.gridCell, styles.gridCellRight]}>
              <Text style={styles.gridLabel}>{t('bookingDetail.connector')}</Text>
              <StatusBadge
                variant="info"
                label={`${booking.connectorType} (${booking.powerKw}kW)`}
                style={styles.connectorBadge}
              />
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>{t('bookingDetail.date')}</Text>
              <Text style={styles.gridValue}>{formatDate(booking.startAt)}</Text>
            </View>
            <View style={[styles.gridCell, styles.gridCellRight]}>
              <Text style={styles.gridLabel}>{t('bookingDetail.timeRange')}</Text>
              <Text style={styles.gridValue}>{formatTimeRange(booking.startAt, booking.endAt)}</Text>
              <Text style={styles.gridSub}>{durationText}</Text>
            </View>
          </View>
          {/* The Charger ID is what the QR on the port encodes (BR-CHG-02). */}
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>{t('bookingDetail.chargerId')}</Text>
              <Text style={styles.gridMono}>{booking.connectorId}</Text>
            </View>
          </View>
        </View>

        {/* Payment details */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('bookingDetail.paymentTitle')}</Text>
        </View>
        <View style={styles.card}>
          {/* One line per TOU band crossed — the price the booking locked in */}
          {booking.priceLines.map((line, i) => (
            <View key={i} style={styles.invoiceRow}>
              <View style={styles.flex1}>
                <Text style={styles.invoiceLabel}>
                  {formatTimeRange(line.fromAt, line.toAt)} ·{' '}
                  {t(`timeRangePicker.band.${line.rateKind}`)}
                </Text>
                <Text style={styles.invoiceSub}>
                  {t('bookingConfirm.lineDetail', {
                    kwh: line.energyKwh,
                    rate: formatVnd(line.rateVndPerKwh),
                  })}
                </Text>
              </View>
              <Text style={styles.invoiceValue}>{formatVnd(line.amount)}</Text>
            </View>
          ))}
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>{t('bookingDetail.serviceFee')}</Text>
            <Text style={styles.invoiceValue}>{formatVnd(booking.serviceFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.invoiceRow}>
            <Text style={styles.totalLabel}>{t('bookingDetail.total')}</Text>
            <Text style={styles.totalValue}>{formatVnd(booking.totalPrice)}</Text>
          </View>
          <View style={styles.paidViaRow}>
            <Ionicons name="card-outline" size={15} color={colors.textMuted} />
            <Text style={styles.paidVia}>
              {t('payment.paidVia', { method: t(`payment.${booking.paymentMethod}`) })}
            </Text>
          </View>
        </View>

        {/* Refund policy (active only) — what cancelling right now would return */}
        {isActive && (
          <View style={styles.refundCard}>
            <View style={styles.refundHeader}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <Text style={styles.refundTitle}>{t('bookingDetail.refundTitle')}</Text>
            </View>
            <Text style={styles.refundText}>{t('bookingDetail.refundBody')}</Text>
            <View style={styles.refundNowRow}>
              <Text style={styles.refundNowLabel}>{t('bookingDetail.refundNow')}</Text>
              <Text style={styles.refundNowValue}>
                {formatVnd(refund.refundAmount)} ({refund.percent}%)
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer actions (active only) */}
      {isActive && (
        <View style={styles.footer}>
          <AppButton
            label={t('bookingDetail.cta')}
            onPress={() => navigation.navigate('QRCheckIn', { bookingId: booking.id })}
          />
          <AppButton
            label={t('bookingDetail.cancel')}
            variant="secondary"
            onPress={() => setShowCancel(true)}
          />
        </View>
      )}

      {isActive && (
        <CancelBookingSheet
          visible={showCancel}
          booking={booking}
          onClose={() => setShowCancel(false)}
          onConfirmed={(updated) => {
            setBooking(updated);
            setShowCancel(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

/** Status note for non-active bookings (checked-in / completed / cancelled). */
function statusNote(booking: Booking, t: (k: string, o?: Record<string, unknown>) => string): string {
  if (booking.status === 'CHECKED_IN' && booking.checkedInAt) {
    return t('bookingDetail.checkedInNote', { time: formatTime(booking.checkedInAt) });
  }
  if (booking.status === 'CANCELLED') {
    return booking.refundAmount && booking.refundAmount > 0
      ? t('bookingDetail.refundedNote', { amount: formatVnd(booking.refundAmount) })
      : t('bookingDetail.noRefundNote');
  }
  return t('bookingDetail.completedNote');
}

function Header({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <GlassButton
        size={40}
        glassEffectStyle="regular"
        fallbackColor={colors.surfaceAlt}
        accessibilityLabel={t('common.back')}
        onPress={onBack}
      >
        <Ionicons name="chevron-back" size={22} color={colors.textStrong} />
      </GlassButton>
      <View style={styles.headerTitleBlock}>
        <Text style={styles.headerTitle}>{t('bookingDetail.title')}</Text>
        <Text style={styles.headerRole}>{t('bookingDetail.role')}</Text>
      </View>
      <View style={styles.headerBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  loader: { flex: 1 },
  notFound: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitleBlock: { alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textStrong },
  headerRole: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.primary, letterSpacing: 1 },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  // Code + status
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textMuted, letterSpacing: 0.5 },
  code: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong },

  // Countdown
  countdownCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  countdownLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  countdownLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.primaryDark },
  countdown: { fontSize: 40, fontWeight: fontWeights.bold, color: colors.primaryDark, letterSpacing: 2 },

  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoNoteText: { flex: 1, fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },

  // Unpaid hold (amber) — the range lapses when this runs out
  holdNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.warning}1A`,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  holdText: { flex: 1, fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },

  // Grace period (green) — free-cancel countdown
  graceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  graceText: { flex: 1, fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.primaryDark },
  graceTimer: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.primaryDark },

  // Sections
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    height: 140,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationName: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  addr: { flex: 1, fontSize: fontSizes.caption, color: colors.textMuted, lineHeight: lineHeights.caption },
  divider: { height: 1, backgroundColor: colors.border },

  gridRow: { flexDirection: 'row' },
  gridCell: { flex: 1, gap: spacing.xs },
  gridCellRight: { alignItems: 'flex-end' },
  gridLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textMuted, letterSpacing: 0.5 },
  gridValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  gridSub: { fontSize: fontSizes.caption, color: colors.textMuted },
  gridMono: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textBody, letterSpacing: 0.5 },
  connectorBadge: { alignSelf: 'flex-end' },

  // Invoice
  invoiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  invoiceLabel: { fontSize: fontSizes.body, color: colors.textBody },
  invoiceSub: { fontSize: fontSizes.caption, color: colors.textMuted },
  invoiceValue: { fontSize: fontSizes.body, color: colors.textStrong, fontWeight: fontWeights.medium },
  totalLabel: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  totalValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.primary },
  paidViaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  paidVia: { fontSize: fontSizes.caption, color: colors.textMuted },

  // Refund (red tint)
  refundCard: {
    backgroundColor: `${colors.error}14`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  refundHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refundTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.error },
  refundText: { fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },
  refundNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  refundNowLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textBody },
  refundNowValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
});
