import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, GlassButton, StatusBadge, type BadgeVariant } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { cancelBooking, getBookingById } from '@/services/bookingService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatCountdown, formatDate, formatTime, formatTimeRange, formatVnd } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingDetail'>;
type Route = RouteProp<RootStackParamList, 'BookingDetail'>;

const STATUS_VARIANT: Record<BookingStatus, BadgeVariant> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CHECKED_IN: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'error',
  NO_SHOW: 'error',
};

/** Bookings that are still actionable (paid + can check in / cancel). */
const ACTIVE_STATUSES: BookingStatus[] = ['CONFIRMED'];

// Grace period after slot start before auto no-show (BR: ~15 min).
const GRACE_MS = 15 * 60_000;

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
  const [cancelling, setCancelling] = useState(false);
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

  // Tick the countdown once per second while the booking is still actionable.
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  function confirmCancel() {
    Alert.alert(t('bookingDetail.cancelTitle'), t('bookingDetail.cancelMessage'), [
      { text: t('bookingDetail.cancelDismiss'), style: 'cancel' },
      {
        text: t('bookingDetail.cancelConfirm'),
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const updated = await cancelBooking(params.bookingId);
            setBooking(updated);
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

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

  const deadline = new Date(booking.startAt).getTime() + GRACE_MS;
  const remaining = deadline - now;

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
        ) : (
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoNoteText}>
              {booking.status === 'CHECKED_IN' && booking.checkedInAt
                ? t('bookingDetail.checkedInNote', { time: formatTime(booking.checkedInAt) })
                : t('bookingDetail.completedNote')}
            </Text>
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
              <Text style={styles.gridLabel}>{t('bookingDetail.charger')}</Text>
              <Text style={styles.gridValue}>{booking.chargerName}</Text>
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
              <Text style={styles.gridLabel}>{t('bookingDetail.slot')}</Text>
              <Text style={styles.gridValue}>{formatTimeRange(booking.startAt, booking.endAt)}</Text>
            </View>
          </View>
        </View>

        {/* Payment details */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('bookingDetail.paymentTitle')}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>
              {t('bookingDetail.chargingFee', { count: booking.slotCount })}
            </Text>
            <Text style={styles.invoiceValue}>{formatVnd(booking.chargingFee)}</Text>
          </View>
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

        {/* Refund policy (active only) */}
        {isActive && (
          <View style={styles.refundCard}>
            <View style={styles.refundHeader}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <Text style={styles.refundTitle}>{t('bookingDetail.refundTitle')}</Text>
            </View>
            <Text style={styles.refundText}>
              {t('bookingDetail.refundBody', { amount: formatVnd(booking.totalPrice) })}
            </Text>
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
            loading={cancelling}
            onPress={confirmCancel}
          />
        </View>
      )}
    </SafeAreaView>
  );
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
  connectorBadge: { alignSelf: 'flex-end' },

  // Invoice
  invoiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  invoiceLabel: { fontSize: fontSizes.body, color: colors.textBody },
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
