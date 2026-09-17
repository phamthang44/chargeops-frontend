import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppButton,
  BookingTimelineStepper,
  CancelBookingSheet,
  CheckoutQRCard,
  GlassButton,
  RefundStatusCard,
  StatusBadge,
  type BadgeVariant,
} from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  getBookingById,
  getBookingNowMs,
  getBookingTimeRemainingMs,
  BookingApiError,
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
  const { themeColors, isDark } = usePreferences();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BookingApiError | Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [now, setNow] = useState(getBookingNowMs());

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const b = await getBookingById(params.bookingId);
      setBooking(b);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getBookingById(params.bookingId)
      .then((b) => {
        if (active) {
          setBooking(b);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [params.bookingId]);

  useEffect(() => {
    if (!booking) return;
    setNow(getBookingNowMs());
    const id = setInterval(() => setNow(getBookingNowMs()), 1000);
    return () => clearInterval(id);
  }, [booking]);

  if (loading) {
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
          </View>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    const isForbidden =
      (error instanceof BookingApiError &&
        (error.code === 'BKG_NOT_ACCESS' || error.messageKey === 'error.booking.notAccess')) ||
      (error && typeof error === 'object' && (error as any).code === 'BKG_NOT_ACCESS');

    const isNetworkError =
      (error instanceof BookingApiError && error.code === 'NETWORK_ERROR') ||
      (error && typeof error === 'object' && (error as any).code === 'NETWORK_ERROR');

    const title = isForbidden
      ? t('bookingDetail.notAccessTitle', 'Không có quyền truy cập')
      : isNetworkError
      ? t('bookingDetail.networkErrorTitle', 'Lỗi kết nối mạng')
      : t('bookingDetail.notFoundTitle', 'Không tìm thấy đơn đặt chỗ');

    const desc = isForbidden
      ? t(
          'bookingDetail.notAccessSubtitle',
          'Lượt đặt chỗ này thuộc về tài xế khác hoặc tài khoản của bạn không được phép xem thông tin chi tiết. Vui lòng kiểm tra lại hoặc quay lại danh sách của bạn.',
        )
      : isNetworkError
      ? t(
          'bookingDetail.networkErrorDesc',
          'Không thể tải dữ liệu đặt chỗ. Vui lòng kiểm tra lại kết nối mạng.',
        )
      : t(
          'bookingDetail.notFoundDesc',
          'Đơn đặt chỗ này không tồn tại trên hệ thống hoặc đã bị xóa.',
        );

    const badgeLabel = isForbidden
      ? `${t('bookingDetail.notAccessBadge', 'TRUY CẬP BỊ TỪ CHỐI')} · 403`
      : isNetworkError
      ? 'LỖI KẾT NỐI'
      : '404 · KHÔNG TÌM THẤY';

    const toneColor = isForbidden
      ? themeColors.error
      : isNetworkError
      ? themeColors.warning
      : themeColors.textMuted;

    const iconName: IconName = isForbidden
      ? 'shield-half-outline'
      : isNetworkError
      ? 'cloud-offline-outline'
      : 'search-outline';

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
          </View>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.errorContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={themeColors.primary}
              colors={[themeColors.primary]}
            />
          }
        >
          <View
            style={[
              styles.errorOuterShell,
              {
                backgroundColor: `${toneColor}08`,
                borderColor: `${toneColor}28`,
              },
            ]}
          >
            <View
              style={[
                styles.errorInnerCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: `${toneColor}20`,
                },
              ]}
            >
              {/* Concentric Halo Icon */}
              <View style={[styles.errorConcentricOuter, { backgroundColor: `${toneColor}12` }]}>
                <View style={[styles.errorConcentricInner, { backgroundColor: `${toneColor}22` }]}>
                  <Ionicons name={iconName} size={36} color={toneColor} />
                </View>
              </View>

              {/* Status Pill */}
              <View
                style={[
                  styles.errorStatusPill,
                  {
                    backgroundColor: `${toneColor}15`,
                    borderColor: `${toneColor}35`,
                  },
                ]}
              >
                <Ionicons
                  name={isForbidden ? 'lock-closed' : isNetworkError ? 'cloud-offline' : 'help-circle'}
                  size={12}
                  color={toneColor}
                />
                <Text style={[styles.errorStatusPillText, { color: toneColor }]}>{badgeLabel}</Text>
              </View>

              {/* Title & Desc */}
              <Text style={[styles.errorCardTitle, { color: themeColors.textStrong }]}>{title}</Text>
              <Text style={[styles.errorCardDesc, { color: themeColors.textMuted }]}>{desc}</Text>

              {/* Monospace UUID Chip */}
              {params.bookingId ? (
                <View
                  style={[
                    styles.errorParamChip,
                    {
                      backgroundColor: themeColors.surfaceAlt,
                      borderColor: copiedField === 'errorParamId' ? `${themeColors.success}60` : themeColors.border,
                    },
                  ]}
                >
                  <View style={styles.errorParamChipHeader}>
                    <Text style={[styles.errorParamLabel, { color: themeColors.textMuted }]}>
                      {t('bookingDetail.queryBookingId', { id: '' }).replace(': ', '').trim() || 'MÃ TRUY VẤN'}
                    </Text>
                    {copiedField === 'errorParamId' ? (
                      <Text style={[styles.errorCopiedBadge, { color: themeColors.success }]}>
                        {t('common.copied', 'Đã sao chép')}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.errorParamRow}
                    onPress={() => handleCopy(params.bookingId, 'errorParamId')}
                  >
                    <Text
                      style={[
                        styles.errorParamValue,
                        {
                          color: themeColors.textStrong,
                          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {params.bookingId}
                    </Text>
                    <Ionicons
                      name={copiedField === 'errorParamId' ? 'checkmark-circle' : 'copy-outline'}
                      size={15}
                      color={copiedField === 'errorParamId' ? themeColors.success : themeColors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.errorActionsGroup}>
                {isNetworkError ? (
                  <AppButton
                    label={t('bookingDetail.retry', 'Thử lại')}
                    onPress={handleRefresh}
                    variant="primary"
                    style={styles.errorActionBtn}
                  />
                ) : (
                  <AppButton
                    label={t('bookingDetail.backToMyBookings', 'Danh sách đặt chỗ của tôi')}
                    onPress={() => navigation.navigate('Tabs', { screen: 'Bookings' })}
                    variant="primary"
                    style={styles.errorActionBtn}
                  />
                )}
                <AppButton
                  label={t('bookingDetail.backToHome', 'Về trang chủ')}
                  onPress={() => navigation.navigate('Tabs', { screen: 'StationList' })}
                  variant="secondary"
                  style={styles.errorActionBtn}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const startMs = new Date(booking.startAt).getTime();
  const endMs = new Date(booking.endAt).getTime();
  const checkInOpensMs = new Date(booking.checkInOpensAt ?? booking.startAt).getTime();
  const checkInDeadlineMs = booking.checkInDeadline
    ? new Date(booking.checkInDeadline).getTime()
    : Number.NaN;
  const isConfirmed = booking.status === 'CONFIRMED';
  const isPending = booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED';
  const isCompleted = booking.status === 'COMPLETED';
  const isCheckedIn = booking.status === 'CHECKED_IN';
  const isCharging = booking.status === 'CHARGING';
  const isExpired = booking.status === 'EXPIRED';

  const hasCheckInDeadline = Number.isFinite(checkInDeadlineMs);
  const windowStarted = now >= checkInOpensMs;
  const windowPassed = hasCheckInDeadline && now > checkInDeadlineMs;
  const msToCheckInClose = getBookingTimeRemainingMs(booking.checkInDeadline, now);

  const canCheckIn = booking.actions
    ? booking.actions.canCheckIn
    : (isConfirmed && windowStarted && hasCheckInDeadline && !windowPassed);
  const checkInReason = booking.actions?.checkInReason ?? (windowPassed ? 'WINDOW_CLOSED' : !windowStarted ? 'TOO_EARLY' : 'AVAILABLE');
  const canCancel = booking.actions ? booking.actions.canCancel : (isPending || isConfirmed);
  const refundableAmount = booking.actions ? booking.actions.refundableAmount : (booking.refundAmount ?? 0);
  const cancellationReason = booking.actions?.cancellationReason;
  const canReportIssue = booking.actions?.canReportIssue ?? true;

  const graceRemainingMs = getBookingTimeRemainingMs(booking.freeCancellationDeadline, now);
  const isWithinGrace = cancellationReason === 'WITHIN_GRACE' || (isConfirmed && graceRemainingMs > 0);

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
    if (isConfirmed) {
      if (canCheckIn) {
        return t('bookings.readyToCheckIn', 'Đã đến giờ — check-in ngay trước khi hết hạn.');
      }
      if (checkInReason === 'TOO_EARLY') {
        return t('bookingDetail.checkInOpensIn', { time: formatTime(booking.checkInOpensAt ?? booking.startAt) });
      }
      if (checkInReason === 'WINDOW_CLOSED') {
        return t('bookingDetail.checkInClosed', 'Cửa sổ check-in đã đóng.');
      }
      return t('bookingDetail.countdownNote');
    }
    if (isPending) {
      const holdLeft = getBookingTimeRemainingMs(
        booking.paymentHoldExpiresAt ?? booking.expiresAt,
        now,
      );
      return t('bookingDetail.holdNote', { time: formatCountdown(holdLeft) });
    }
    if (isCheckedIn && booking.checkedInAt) {
      return t('bookingDetail.checkedInNote', { time: formatTime(booking.checkedInAt) });
    }
    if (isCharging) return t('chargingSession.autoNote', 'Sạc sẽ tự động ngắt khi đầy pin.');
    if (isCompleted) return t('bookingDetail.completedNote');
    if (isCancelled) {
      if (booking.cancelReason === 'NO_SHOW') return t('bookingDetail.reasonNoShow');
      if (booking.cancelReason === 'PAYMENT_TIMEOUT') return t('bookingDetail.reasonTimeout');
      if ((booking.refundAmount ?? refundableAmount) > 0) {
        return t('bookingDetail.refundedNote', { amount: formatVnd(booking.refundAmount ?? refundableAmount) });
      }
      return t('bookingDetail.reasonUserCancelled');
    }
    if (isExpired) return t('bookingDetail.reasonTimeout');
    return t(`bookingStatus.${booking.status}`);
  })();

  const paymentDetail = booking.paymentDetail;
  const hasAccountingDiscrepancy =
    Boolean(paymentDetail) &&
    ((paymentDetail?.unallocatedAmount ?? 0) > 0 ||
      (paymentDetail?.collectedAmount ?? 0) > (paymentDetail?.expectedAmount ?? 0));

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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
      >
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
              <View style={styles.codeLabelRow}>
                <Text style={[styles.codeLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.code')}</Text>
                {copiedField === 'bookingCode' && (
                  <Text style={[styles.copiedBadge, { color: themeColors.success }]}>
                    {t('common.copied', 'Đã chép')}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.codePill,
                  {
                    backgroundColor: themeColors.surfaceAlt,
                    borderColor: copiedField === 'bookingCode' ? `${themeColors.success}60` : themeColors.border,
                  },
                ]}
                onPress={() => handleCopy(booking.code, 'bookingCode')}
              >
                <Text
                  style={[styles.code, { color: themeColors.textStrong }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {booking.code}
                </Text>
                <Ionicons
                  name={copiedField === 'bookingCode' ? 'checkmark-circle' : 'copy-outline'}
                  size={13}
                  color={copiedField === 'bookingCode' ? themeColors.success : themeColors.textMuted}
                />
              </TouchableOpacity>
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
                <Text style={[styles.countdownLabel, { color: accent }]}>
                  {windowStarted
                    ? t('bookingDetail.checkInWindowActive')
                    : t('bookingDetail.countdownTitle')}
                </Text>
              </View>
              <Text style={[styles.countdown, { color: accent }]}>{formatCountdown(msToCheckInClose)}</Text>
              <Text style={[styles.countdownSub, { color: themeColors.textBody }]}>{statusNote}</Text>
            </View>
          )}

          {isConfirmed && (
            <View
              style={[
                styles.graceCard,
                {
                  backgroundColor: isWithinGrace ? `${themeColors.primary}10` : themeColors.surfaceAlt,
                  borderColor: isWithinGrace ? `${themeColors.primary}33` : themeColors.border,
                },
              ]}
            >
              <View style={styles.graceCardHeader}>
                <View
                  style={[
                    styles.graceCardIconWrap,
                    { backgroundColor: isWithinGrace ? `${themeColors.primary}20` : `${themeColors.textMuted}1A` },
                  ]}
                >
                  <Ionicons
                    name={isWithinGrace ? 'shield-checkmark-outline' : 'shield-outline'}
                    size={16}
                    color={isWithinGrace ? themeColors.primary : themeColors.textMuted}
                  />
                </View>
                <View style={styles.graceCardCopy}>
                  <Text style={[styles.graceCardTitle, { color: themeColors.textStrong }]}>
                    {t('bookingDetail.graceCardTitle')}
                  </Text>
                  <Text
                    style={[
                      styles.graceCardDesc,
                      { color: isWithinGrace ? themeColors.primaryDark : themeColors.textMuted },
                    ]}
                  >
                    {isWithinGrace
                      ? t('bookingDetail.graceCardRemaining', { time: formatMmSs(graceRemainingMs) })
                      : t('bookingDetail.graceCardExpired')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {isCharging && (
            <View
              style={[
                styles.chargingCard,
                { backgroundColor: `${themeColors.success}12`, borderColor: `${themeColors.success}33` },
              ]}
            >
              <View style={styles.chargingHeader}>
                <View style={[styles.chargingIconWrap, { backgroundColor: `${themeColors.success}25` }]}>
                  <Ionicons name="flash" size={18} color={themeColors.success} />
                </View>
                <View style={styles.chargingCopy}>
                  <Text style={[styles.chargingTitle, { color: themeColors.textStrong }]}>
                    {t('bookingDetail.chargingLiveTitle')}
                  </Text>
                  <Text style={[styles.chargingNote, { color: themeColors.textBody }]}>
                    {t('bookingDetail.chargingLiveNote')}
                  </Text>
                </View>
              </View>
              {Boolean(booking.chargingStartedAt) && (
                <View style={[styles.chargingMetaRow, { borderTopColor: `${themeColors.success}20` }]}>
                  <Text style={[styles.chargingMetaLabel, { color: themeColors.textMuted }]}>
                    {t('bookingDetail.chargingStartedAtLabel', { time: formatTime(booking.chargingStartedAt!) })}
                  </Text>
                  <Text style={[styles.chargingMetaLabel, { color: themeColors.textMuted }]}>
                    {t('bookingDetail.chargingExpectedEndLabel', { time: formatTime(booking.endAt) })}
                  </Text>
                </View>
              )}
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
          icon="git-commit-outline"
          title={t('bookingDetail.timelineTitle', 'Tiến trình đặt chỗ')}
          color={themeColors.primary}
          textColor={themeColors.textStrong}
        />
        <BookingTimelineStepper booking={booking} />

        {isPending && (
          <CheckoutQRCard
            booking={booking}
            onPayNow={() => navigation.navigate('PaymentProcessing', { bookingId: booking.id })}
          />
        )}

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

          <View
            style={[
              styles.connectorRibbon,
              {
                backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : themeColors.surfaceAlt,
                borderColor: `${themeColors.primary}25`,
              },
            ]}
          >
            <View style={[styles.ribbonIcon, { backgroundColor: `${themeColors.primary}18` }]}>
              <Ionicons name="hardware-chip-outline" size={18} color={themeColors.primaryDark} />
            </View>
            <View style={styles.ribbonCopy}>
              <Text style={[styles.ribbonLabel, { color: themeColors.textMuted }]}>
                {t('bookingDetail.connectorCodeLabel', 'Mã cổng sạc trên trụ')}
              </Text>
              <Text style={[styles.ribbonValue, { color: themeColors.textStrong }]}>
                {booking.connectorCode || booking.connectorName}
              </Text>
              {Boolean(booking.connectorId && booking.connectorId !== (booking.connectorCode || booking.connectorName)) && (
                <Text style={[styles.ribbonSubId, { color: themeColors.textMuted }]} numberOfLines={1}>
                  ID: {booking.connectorId}
                </Text>
              )}
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.copyIconBtn,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: copiedField === 'connector' ? themeColors.success : themeColors.border,
                },
              ]}
              onPress={() => handleCopy(booking.connectorCode || booking.connectorName, 'connector')}
            >
              <Ionicons
                name={copiedField === 'connector' ? 'checkmark-circle' : 'copy-outline'}
                size={15}
                color={copiedField === 'connector' ? themeColors.success : themeColors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

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

        {(isCancelled || (booking.refunds && booking.refunds.length > 0)) && (
          <RefundStatusCard booking={booking} />
        )}

        {!isCancelled && (
          <View
            style={[
              styles.refundCard,
              {
                backgroundColor: themeColors.surfaceAlt,
                borderColor: themeColors.border,
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
                <Text style={[styles.refundNowValue, { color: themeColors.textStrong }]}>{formatVnd(refundableAmount)}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {isConfirmed && (
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <AppButton
            label={
              canCheckIn
                ? t('bookingDetail.cta')
                : checkInReason === 'TOO_EARLY'
                ? t('bookingDetail.checkInOpensIn', { time: formatTime(booking.checkInOpensAt ?? booking.startAt) })
                : checkInReason === 'WINDOW_CLOSED'
                ? t('bookingDetail.checkInClosed')
                : t('bookingDetail.cta')
            }
            disabled={!canCheckIn}
            onPress={() => navigation.navigate('QRCheckIn', { bookingId: booking.id })}
          />
          <AppButton
            label={t('bookingDetail.cancel')}
            variant="secondary"
            disabled={!canCancel}
            onPress={() => setShowCancel(true)}
          />
        </View>
      )}

      {isPending && (
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <AppButton
            label={t('bookingDetail.payNow', 'Thanh toán ngay')}
            onPress={() => navigation.navigate('PaymentProcessing', { bookingId: booking.id })}
          />
          <AppButton
            label={t('bookingDetail.cancel', 'Hủy đặt chỗ')}
            variant="secondary"
            disabled={!canCancel}
            onPress={() => setShowCancel(true)}
          />
        </View>
      )}

      {isCharging && (
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <AppButton
            label={t('chargingSession.title', 'Xem phiên sạc trực tiếp')}
            onPress={() => navigation.navigate('ChargingSession', { bookingId: booking.id })}
          />
        </View>
      )}

      {(isCompleted || isCancelled || isExpired) && canReportIssue && (
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <AppButton
            label={t('bookingDetail.reportIssue', 'Báo cáo sự cố trạm sạc')}
            variant="secondary"
            onPress={() => {
              navigation.goBack();
            }}
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

  errorContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorOuterShell: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 6,
  },
  errorInnerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorConcentricOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errorConcentricInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  errorStatusPillText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  errorCardTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  errorCardDesc: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.body,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  errorParamChip: {
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 4,
    marginTop: spacing.xs,
  },
  errorParamChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorParamLabel: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  errorCopiedBadge: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  errorParamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorParamValue: {
    flex: 1,
    fontSize: 12,
  },
  errorActionsGroup: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  errorActionBtn: {
    width: '100%',
  },

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
  codeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codeLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  copiedBadge: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  code: { fontSize: 15, lineHeight: 18, fontWeight: fontWeights.bold, letterSpacing: 0.6 },
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  countdownLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  countdownLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  countdown: { fontSize: 34, lineHeight: 40, fontWeight: fontWeights.bold, letterSpacing: 1.2 },
  countdownSub: {
    marginTop: spacing.xs,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.body,
    textAlign: 'center',
  },
  graceCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  graceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  graceCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graceCardCopy: { flex: 1, minWidth: 0 },
  graceCardTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  graceCardDesc: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium, marginTop: 2 },
  chargingCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chargingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chargingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargingCopy: { flex: 1, minWidth: 0 },
  chargingTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  chargingNote: { fontSize: fontSizes.caption, marginTop: 2 },
  chargingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  chargingMetaLabel: { fontSize: fontSizes.caption },
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
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
  ribbonLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  ribbonValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, marginTop: 1 },
  ribbonSubId: { fontSize: 11, marginTop: 2, letterSpacing: 0.3 },
  copyIconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
