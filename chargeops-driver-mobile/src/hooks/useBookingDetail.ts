import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/context/PreferencesContext';
import {
  createCheckout,
  getBookingById,
  getBookingNowMs,
  getBookingTimeRemainingMs,
  BookingApiError,
} from '@/services/bookingService';
import type { Booking, BookingStatus } from '@/types';
import { copyText } from '@/utils/clipboard';
import {
  formatCountdown,
  formatTime,
  formatVnd,
  splitDuration,
} from '@/utils/format';

export type StatusTone = 'success' | 'error' | 'info' | 'warning' | 'neutral';

export const STATUS_TONE: Record<BookingStatus, StatusTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  CHECKED_IN: 'info',
  CHARGING: 'success',
  COMPLETED: 'success',
  CANCELLED: 'error',
  EXPIRED: 'neutral',
};

export function statusLabelKey(booking: Booking): string {
  if (booking.status === 'CANCELLED' && booking.cancelReason === 'NO_SHOW') {
    return 'bookingStatus.NO_SHOW';
  }
  if (booking.status === 'CANCELLED' && booking.cancelReason === 'PAYMENT_TIMEOUT') {
    return 'bookingStatus.PAYMENT_TIMEOUT';
  }
  if (booking.status === 'CANCELLED' && booking.cancelReason === 'STATION_FAILURE') {
    return 'bookingStatus.STATION_FAILURE';
  }
  return `bookingStatus.${booking.status}`;
}

export function getToneColor(
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

export function useBookingDetail(bookingId: string) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const isFocused = useIsFocused();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BookingApiError | Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const triggeredMilestonesRef = useRef<Set<string>>(new Set());
  const [now, setNow] = useState(getBookingNowMs());

  const handleCopy = (text: string, field: string) => {
    copyText(text).then((ok) => {
      if (!ok) return;
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      let b = await getBookingById(bookingId);
      if (
        b &&
        b.status === 'PENDING' &&
        (!b.checkout || b.checkout.status === 'NOT_CREATED' || b.checkout.status === 'UNAVAILABLE')
      ) {
        try {
          const checkout = await createCheckout(b.id);
          b = { ...b, checkout, paymentMethod: checkout.method || b.paymentMethod };
        } catch (checkoutErr) {
          console.warn('Refresh createCheckout failed:', checkoutErr);
        }
      }
      setBooking(b);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setRefreshing(false);
    }
  };

  const silentRefresh = useCallback(async () => {
    try {
      let b = await getBookingById(bookingId);
      if (b) {
        setBooking((prev) => {
          if (!prev) return b;
          if (!b.checkout && prev.checkout) {
            return { ...b, checkout: prev.checkout };
          }
          return b;
        });
      }
    } catch {
      // silent background refresh, ignore errors
    }
  }, [bookingId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getBookingById(bookingId)
      .then(async (b) => {
        if (!active) return;
        if (b && b.status === 'PENDING' && (!b.checkout || b.checkout.status === 'NOT_CREATED')) {
          try {
            const checkout = await createCheckout(b.id);
            b = { ...b, checkout, paymentMethod: checkout.method || b.paymentMethod };
          } catch (checkoutErr) {
            console.warn('Auto createCheckout in BookingDetail failed:', checkoutErr);
          }
        }
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
  }, [bookingId]);

  useEffect(() => {
    if (!booking) return;
    const id = setInterval(() => {
      const currentNow = getBookingNowMs();
      setNow(currentNow);

      // Auto-trigger refetch when 100% refund grace period expires
      if (booking.status === 'CONFIRMED' && booking.freeCancellationDeadline) {
        const remaining = getBookingTimeRemainingMs(booking.freeCancellationDeadline, currentNow);
        const key = `grace_${booking.id}`;
        if (remaining <= 0 && !triggeredMilestonesRef.current.has(key)) {
          triggeredMilestonesRef.current.add(key);
          silentRefresh();
        }
      }

      // Auto-trigger refetch when check-in opens
      if (booking.status === 'CONFIRMED' && booking.startAt) {
        const checkInOpensMs = new Date(booking.checkInOpensAt ?? booking.startAt).getTime();
        const key = `checkin_opened_${booking.id}`;
        if (currentNow >= checkInOpensMs && !triggeredMilestonesRef.current.has(key)) {
          triggeredMilestonesRef.current.add(key);
          silentRefresh();
        }
      }

      // Auto-trigger refetch when check-in window closes
      if (booking.status === 'CONFIRMED' && booking.checkInDeadline) {
        const checkInDeadlineMs = new Date(booking.checkInDeadline).getTime();
        const key = `checkin_closed_${booking.id}`;
        if (currentNow >= checkInDeadlineMs && !triggeredMilestonesRef.current.has(key)) {
          triggeredMilestonesRef.current.add(key);
          silentRefresh();
        }
      }

      // Auto-trigger refetch when unpaid hold expires
      if (booking.status === 'PENDING') {
        const holdExpiresAt = booking.paymentHoldExpiresAt ?? booking.expiresAt;
        if (holdExpiresAt) {
          const holdLeft = getBookingTimeRemainingMs(holdExpiresAt, currentNow);
          const key = `hold_expired_${booking.id}`;
          if (holdLeft <= 0 && !triggeredMilestonesRef.current.has(key)) {
            triggeredMilestonesRef.current.add(key);
            silentRefresh();
          }
        }
      }
    }, 1000);

    return () => clearInterval(id);
  }, [booking, silentRefresh]);

  // Smart Polling: auto-refresh based on lifecycle state
  useEffect(() => {
    if (!isFocused || !booking) return;

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      return;
    }

    const intervalMs =
      booking.status === 'PENDING'
        ? 4000
        : booking.status === 'CHARGING'
        ? 5000
        : 25000;

    const pollId = setInterval(() => {
      silentRefresh();
    }, intervalMs);

    return () => clearInterval(pollId);
  }, [isFocused, booking?.status, silentRefresh]);

  // Derived properties
  const startMs = booking ? new Date(booking.startAt).getTime() : 0;
  const endMs = booking ? new Date(booking.endAt).getTime() : 0;
  const checkInOpensMs = booking ? new Date(booking.checkInOpensAt ?? booking.startAt).getTime() : 0;
  const checkInDeadlineMs = booking?.checkInDeadline
    ? new Date(booking.checkInDeadline).getTime()
    : Number.NaN;

  const isConfirmed = booking?.status === 'CONFIRMED';
  const isPending = booking?.status === 'PENDING';
  const isCancelled = booking?.status === 'CANCELLED';
  const isCompleted = booking?.status === 'COMPLETED';
  const isCheckedIn = booking?.status === 'CHECKED_IN';
  const isCharging = booking?.status === 'CHARGING';
  const isExpired = booking?.status === 'EXPIRED';

  const hasCheckInDeadline = Number.isFinite(checkInDeadlineMs);
  const windowStarted = now >= checkInOpensMs;
  const windowPassed = hasCheckInDeadline && now > checkInDeadlineMs;
  const msToCheckInClose = booking ? getBookingTimeRemainingMs(booking.checkInDeadline, now) : 0;

  const canCheckIn = booking?.actions
    ? booking.actions.canCheckIn
    : (isConfirmed && windowStarted && hasCheckInDeadline && !windowPassed);
  const checkInReason = booking?.actions?.checkInReason ?? (windowPassed ? 'WINDOW_CLOSED' : !windowStarted ? 'TOO_EARLY' : 'AVAILABLE');
  const graceRemainingMs = booking ? getBookingTimeRemainingMs(booking.freeCancellationDeadline, now) : 0;
  const cancellationReason = booking?.actions?.cancellationReason;
  const isWithinGrace = isConfirmed && graceRemainingMs > 0 && cancellationReason !== 'GRACE_ENDED';

  const canCancel = booking?.actions ? booking.actions.canCancel : (isPending || isConfirmed);
  const refundableAmount = isConfirmed
    ? (isWithinGrace ? (booking?.actions?.refundableAmount ?? booking?.totalPrice ?? 0) : 0)
    : (booking?.refundAmount ?? 0);
  const canReportIssue = booking?.actions?.canReportIssue ?? true;

  const durationMin = Math.round((endMs - startMs) / 60_000);
  const { hours, minutes } = splitDuration(durationMin);
  const durationText =
    hours === 0
      ? t('timeRangePicker.durationMin', { minutes })
      : minutes === 0
        ? t('timeRangePicker.durationHour', { hours })
        : t('timeRangePicker.durationHourMin', { hours, minutes });

  const tone = booking ? STATUS_TONE[booking.status] : 'neutral';
  const accent = getToneColor(tone, themeColors);

  const statusNote = (() => {
    if (!booking) return '';
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
      if (booking.cancelReason === 'STATION_FAILURE') return t('bookingDetail.reasonStationFailure', 'Đã hủy do sự cố kỹ thuật tại trạm sạc (Hoàn đủ 100%)');
      if ((booking.refundAmount ?? refundableAmount) > 0) {
        return t('bookingDetail.refundedNote', { amount: formatVnd(booking.refundAmount ?? refundableAmount) });
      }
      return t('bookingDetail.reasonUserCancelled');
    }
    if (isExpired) return t('bookingDetail.reasonTimeout');
    return t(`bookingStatus.${booking.status}`);
  })();

  const paymentDetail = booking?.paymentDetail;
  const hasAccountingDiscrepancy =
    Boolean(paymentDetail) &&
    ((paymentDetail?.unallocatedAmount ?? 0) > 0 ||
      (paymentDetail?.collectedAmount ?? 0) > (paymentDetail?.expectedAmount ?? 0));

  return {
    booking,
    setBooking,
    loading,
    error,
    refreshing,
    showCancel,
    setShowCancel,
    copiedField,
    handleCopy,
    handleRefresh,
    silentRefresh,
    now,
    // Lifecycle states
    isConfirmed,
    isPending,
    isCancelled,
    isCompleted,
    isCheckedIn,
    isCharging,
    isExpired,
    windowStarted,
    windowPassed,
    canCheckIn,
    checkInReason,
    graceRemainingMs,
    isWithinGrace,
    canCancel,
    refundableAmount,
    canReportIssue,
    durationText,
    tone,
    accent,
    statusNote,
    hasAccountingDiscrepancy,
    msToCheckInClose,
  };
}
