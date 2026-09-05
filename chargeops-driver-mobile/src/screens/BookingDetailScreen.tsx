import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
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
type StatusTone = 'success' | 'error' | 'info' | 'warning' | 'neutral';
type IconName = keyof typeof Ionicons.glyphMap;

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

const STATUS_ICON: Record<StatusTone, IconName> = {
  success: 'checkmark-circle-outline',
  error: 'close-circle-outline',
  info: 'flash-outline',
  warning: 'time-outline',
  neutral: 'remove-circle-outline',
};

/** Check-in closes this long after the start time; after that it is a no-show. */
const CHECK_IN_WINDOW_MS = CHECK_IN_WINDOW_MIN * 60_000;

function statusLabelKey(booking: Booking): string {
  if (booking.status === 'CANCELLED' && booking.cancelReason === 'NO_SHOW') {
    return 'bookingStatus.NO_SHOW';
  }
  if (booking.status === 'CANCELLED' && booking.cancelReason === 'PAYMENT_TIMEOUT') {
    return 'bookingStatus.PAYMENT_TIMEOUT';
  }
  return `bookingStatus.${booking.status}`;
}

function getToneColor(
  tone: StatusTone,
  themeColors: ReturnType<typeof usePreferences>['themeColors'],
): string {
  return {
    success: themeColors.success,
    error: themeColors.error,
    info: themeColors.info,
    warning: themeColors.warning,
    neutral: themeColors.textMuted,
  }[tone];
}

interface SectionHeadingProps {
  icon: IconName;
  title: string;
  color: string;
  textColor: string;
}

function SectionHeading({ icon, title, color, textColor }: SectionHeadingProps) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
    </View>
  );
}

interface DetailCellProps {
  label: string;
  value: string;
  subValue?: string;
  alignRight?: boolean;
  mutedColor: string;
  textColor: string;
}

function DetailCell({ label, value, subValue, alignRight, mutedColor, textColor }: DetailCellProps) {
  return (
    <View style={[styles.detailCell, alignRight && styles.detailCellRight]}>
      <Text style={[styles.detailLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: textColor }]} numberOfLines={2}>
        {value}
      </Text>
      {subValue ? <Text style={[styles.detailSub, { color: mutedColor }]}>{subValue}</Text> : null}
    </View>
  );
}

export function BookingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

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
  const isCheckedIn = booking.status === 'CHECKED_IN';
  const isCharging = booking.status === 'CHARGING';
  const isExpired = booking.status === 'EXPIRED';

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

  const tone = STATUS_TONE[booking.status];
  const accent = getToneColor(tone, themeColors);
  const statusNote = (() => {
    if (isConfirmed) return t('bookingDetail.countdownNote');
    if (isPending && booking.expiresAt) {
      return t('bookingDetail.holdNote', {
        time: formatCountdown(Math.max(0, new Date(booking.expiresAt).getTime() - now)),
      });
    }
    if (isCheckedIn && booking.checkedInAt) {
      return t('bookingDetail.checkedInNote', { time: formatTime(booking.checkedInAt) });
    }
    if (isCharging) return t('chargingSession.autoNote');
    if (isCompleted) return t('bookingDetail.completedNote');
    if (isCancelled && (booking.refundAmount ?? 0) > 0) {
      return t('bookingDetail.refundedNote', { amount: formatVnd(booking.refundAmount ?? 0) });
    }
    if (isCancelled || isExpired) return t('bookingDetail.noRefundNote');
    return t(`bookingStatus.${booking.status}`);
  })();

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
        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingDetail.title')}</Text>
          <Text style={[styles.headerRole, { color: themeColors.primary }]}>{t('bookingDetail.role')}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: `${accent}40`,
              shadowColor: themeColors.textStrong,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.codeBlock}>
              <Text style={[styles.codeLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.code')}</Text>
              <Text style={[styles.code, { color: themeColors.textStrong }]}>{booking.code}</Text>
            </View>
            <StatusBadge
              variant={STATUS_VARIANT[tone]}
              label={t(statusLabelKey(booking))}
              dot
              style={styles.statusBadge}
            />
          </View>

          <View style={styles.statusSummary}>
            <View style={[styles.statusIcon, { backgroundColor: `${accent}1A` }]}>
              <Ionicons name={STATUS_ICON[tone]} size={24} color={accent} />
            </View>
            <View style={styles.statusCopy}>
              <Text style={[styles.statusTitle, { color: themeColors.textStrong }]}>
                {t(statusLabelKey(booking))}
              </Text>
              <Text style={[styles.statusNote, { color: themeColors.textBody }]}>{statusNote}</Text>
            </View>
          </View>

          {isConfirmed && (
            <View style={[styles.countdownPanel, { backgroundColor: `${accent}12`, borderColor: `${accent}2E` }]}>
              <View style={styles.countdownLabelRow}>
                <Ionicons name="timer-outline" size={17} color={accent} />
                <Text style={[styles.countdownLabel, { color: accent }]}>{t('bookingDetail.countdownTitle')}</Text>
              </View>
              <Text style={[styles.countdown, { color: accent }]}>{formatCountdown(msToCheckInClose)}</Text>
            </View>
          )}

          {isConfirmed && refund.tier === 'GRACE' && (
            <View style={[styles.inlineNotice, { backgroundColor: themeColors.primarySoft }]}>
              <Ionicons name="arrow-undo-outline" size={17} color={themeColors.primaryDark} />
              <Text style={[styles.inlineNoticeText, { color: themeColors.primaryDark }]}>
                {t('bookingDetail.graceHint', { time: formatMmSs(refund.graceRemainingMs) })}
              </Text>
            </View>
          )}

          <View style={[styles.heroMetrics, { borderTopColor: themeColors.border }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.date')}</Text>
              <Text style={[styles.metricValue, { color: themeColors.textStrong }]}>{formatDate(booking.startAt)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.timeRange')}</Text>
              <Text style={[styles.metricValue, { color: themeColors.textStrong }]}>
                {formatTimeRange(booking.startAt, booking.endAt)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.total')}</Text>
              <Text style={[styles.metricValue, { color: accent }]}>{formatVnd(booking.totalPrice)}</Text>
            </View>
          </View>
        </View>

        <SectionHeading
          icon="business-outline"
          title={t('bookingDetail.stationTitle')}
          color={themeColors.primary}
          textColor={themeColors.textStrong}
        />

        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          {booking.stationImageUrl ? (
            <Image source={{ uri: booking.stationImageUrl }} style={styles.stationImage} resizeMode="cover" />
          ) : (
            <View style={[styles.stationImageFallback, { backgroundColor: themeColors.surfaceAlt }]}>
              <Ionicons name="flash" size={30} color={themeColors.primary} />
            </View>
          )}

          <View style={styles.stationCopy}>
            <Text style={[styles.stationName, { color: themeColors.textStrong }]}>{booking.stationName}</Text>
            <View style={styles.addrRow}>
              <Ionicons name="location-outline" size={15} color={themeColors.textMuted} />
              <Text style={[styles.addr, { color: themeColors.textMuted }]}>{booking.stationAddress}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <View style={styles.detailGrid}>
            <DetailCell
              label={t('bookingDetail.chargePoint')}
              value={booking.chargePointName}
              subValue={booking.zoneLabel ?? undefined}
              mutedColor={themeColors.textMuted}
              textColor={themeColors.textStrong}
            />
            <DetailCell
              label={t('bookingDetail.connector')}
              value={`${booking.connectorName}`}
              subValue={`${booking.connectorType} - ${booking.powerKw}kW`}
              alignRight
              mutedColor={themeColors.textMuted}
              textColor={themeColors.textStrong}
            />
          </View>

          <View style={[styles.connectorRibbon, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
            <View style={[styles.ribbonIcon, { backgroundColor: `${themeColors.primary}18` }]}>
              <Ionicons name="hardware-chip-outline" size={17} color={themeColors.primaryDark} />
            </View>
            <View style={styles.ribbonCopy}>
              <Text style={[styles.ribbonLabel, { color: themeColors.textMuted }]}>
                {t('bookingDetail.chargerId')}
              </Text>
              <Text style={[styles.ribbonValue, { color: themeColors.textStrong }]}>
                {booking.connectorId}
              </Text>
            </View>
          </View>
        </View>

        <SectionHeading
          icon="receipt-outline"
          title={t('bookingDetail.paymentTitle')}
          color={themeColors.primary}
          textColor={themeColors.textStrong}
        />

        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          {booking.priceLines.map((line, i) => (
            <View key={`${line.fromAt}-${line.toAt}-${i}`} style={styles.invoiceRow}>
              <View style={styles.invoiceCopy}>
                <Text style={[styles.invoiceLabel, { color: themeColors.textBody }]}>
                  {t(`timeRangePicker.band.${line.rateKind}`)} ({formatTime(line.fromAt)} - {formatTime(line.toAt)})
                </Text>
                <Text style={[styles.invoiceSub, { color: themeColors.textMuted }]}>
                  {line.energyKwh} kWh x {formatVnd(line.rateVndPerKwh)}
                </Text>
              </View>
              <Text style={[styles.invoiceValue, { color: themeColors.textStrong }]}>{formatVnd(line.amount)}</Text>
            </View>
          ))}

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

          <View style={styles.paidViaRow}>
            <Ionicons name="wallet-outline" size={14} color={themeColors.textMuted} />
            <Text style={[styles.paidVia, { color: themeColors.textMuted }]}>
              {t('payment.paidVia', { method: t(`payment.${booking.paymentMethod}`) })}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.refundCard,
            {
              backgroundColor: isCancelled ? `${themeColors.error}10` : themeColors.surfaceAlt,
              borderColor: isCancelled ? `${themeColors.error}26` : themeColors.border,
            },
          ]}
        >
          <View style={styles.refundHeader}>
            <View style={[styles.refundIcon, { backgroundColor: `${themeColors.error}14` }]}>
              <Ionicons name="shield-checkmark-outline" size={17} color={themeColors.error} />
            </View>
            <Text style={[styles.refundTitle, { color: themeColors.textStrong }]}>{t('bookingDetail.refundTitle')}</Text>
          </View>
          <Text style={[styles.refundText, { color: themeColors.textBody }]}>{t('bookingDetail.refundBody')}</Text>
          {isConfirmed && (
            <View style={[styles.refundNowRow, { borderTopColor: themeColors.border }]}>
              <Text style={[styles.refundNowLabel, { color: themeColors.textBody }]}>{t('bookingDetail.refundNow')}</Text>
              <Text style={[styles.refundNowValue, { color: themeColors.textStrong }]}>{formatVnd(refund.refundAmount)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

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

  heroCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  codeBlock: { flex: 1, minWidth: 0 },
  codeLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  code: { fontSize: fontSizes.title, lineHeight: lineHeights.title, fontWeight: fontWeights.bold, marginTop: 2 },
  statusBadge: { flexShrink: 1, paddingHorizontal: spacing.sm },
  statusSummary: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: { flex: 1, minWidth: 0 },
  statusTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  statusNote: { marginTop: spacing.xs, fontSize: fontSizes.caption, lineHeight: lineHeights.body },
  countdownPanel: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  countdownLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  countdownLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  countdown: { fontSize: 38, lineHeight: 44, fontWeight: fontWeights.bold, letterSpacing: 1 },
  inlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inlineNoticeText: { flex: 1, fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  heroMetrics: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  metricItem: { flex: 1, minWidth: 0 },
  metricLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: { marginTop: spacing.xs, fontSize: fontSizes.body, fontWeight: fontWeights.bold },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },

  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  stationImage: { width: '100%', height: 156, borderRadius: radius.md },
  stationImageFallback: {
    width: '100%',
    height: 132,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationCopy: { gap: spacing.xs },
  stationName: { fontSize: fontSizes.heading, lineHeight: lineHeights.heading, fontWeight: fontWeights.bold },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  addr: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  divider: { height: 1 },
  detailGrid: { flexDirection: 'row', gap: spacing.md },
  detailCell: { flex: 1, minWidth: 0, gap: spacing.xs },
  detailCellRight: { alignItems: 'flex-end' },
  detailLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, lineHeight: lineHeights.body },
  detailSub: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  connectorRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  ribbonIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonCopy: { flex: 1, minWidth: 0 },
  ribbonLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },
  ribbonValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, marginTop: 1 },

  invoiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  invoiceCopy: { flex: 1, minWidth: 0 },
  invoiceLabel: { fontSize: fontSizes.body, lineHeight: lineHeights.body },
  invoiceSub: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption, marginTop: 1 },
  invoiceValue: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  totalPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
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

  refundCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  refundHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refundIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  refundText: { fontSize: fontSizes.caption, lineHeight: lineHeights.body },
  refundNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.md,
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
