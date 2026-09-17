import type { TFunction } from 'i18next';
import { BookingApiError } from '@/services/bookingService';

/** Booking error codes thrown by bookingService (see BookingErrorCode there). */
export const BOOKING_ERROR_CODES = [
  'RANGE_TAKEN',
  'NETWORK_ERROR',
  'PRICE_CHANGED',
  'CONNECTOR_BUSY',
  'CONNECTOR_LOCKED',
  'SLOT_UNAVAILABLE',
  'DRIVER_ACTIVE_BOOKING_LIMIT_EXCEEDED',
  'UNAUTHORIZED',
  'GENERIC',
  'TIME_INVALID',
  'SYS_003',
  'PRICE_PREVIEW_FAILED',
  'BKG_PENDING_LIMIT_EXCEEDED',
  'PENDING_LIMIT_EXCEEDED',
  'BKG_SLOT_UNAVAILABLE',
  'BKG_TIME_INVALID',
  'BKG_PRICE_CHANGED',
  'BKG_PRICING_NOT_CONFIGURED',
  'BKG_CANCELLATION_CHANGED',
  'BKG_STATE_CONFLICT',
  'BKG_HOLD_EXPIRED',
  'BKG_CHECK_IN_TOO_EARLY',
  'BKG_CHECK_IN_CLOSED',
  'BKG_QR_INVALID',
  'BKG_CONNECTOR_MISMATCH',
  'BKG_STATION_UNAVAILABLE',
  'BKG_NOT_ACCESS',
] as const;

/**
 * Extract canonical error code from an unknown booking error.
 */
export function extractBookingErrorCode(error: unknown): string | null {
  if (error instanceof BookingApiError) {
    return error.code;
  }
  if (error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string') {
    return (error as any).code;
  }
  return null;
}

/**
 * Map an error thrown by the booking service to a localized message.
 * Extracts structured validation errors and reasons when available.
 */
export function bookingErrorMessage(t: TFunction, error: unknown): string {
  if (error instanceof BookingApiError) {
    if (error.code === 'SYS_003' && error.details && typeof error.details === 'object') {
      const fieldNames = Object.keys(error.details).join(', ');
      return t('booking.errors.SYS_003', {
        defaultValue: `Dữ liệu đặt chỗ không hợp lệ (${fieldNames}). Vui lòng chọn lại khung giờ.`,
        fields: fieldNames,
      });
    }

    if (error.code === 'TIME_INVALID' || error.code === 'BKG_TIME_INVALID') {
      const reason = error.details?.reason;
      if (reason === 'START_NOT_ON_GRID') {
        return t('booking.errors.START_NOT_ON_GRID', {
          defaultValue: 'Giờ bắt đầu phải tròn theo bước nhảy 30 phút (ví dụ: 08:00, 08:30).',
        });
      }
      if (reason === 'MINIMUM_ADVANCE_NOT_MET') {
        return t('booking.errors.MINIMUM_ADVANCE_NOT_MET', {
          defaultValue: 'Phải đặt trước tối thiểu 60 phút so với thời điểm hiện tại.',
        });
      }
      if (reason === 'OUTSIDE_OPERATING_HOURS') {
        return t('booking.errors.OUTSIDE_OPERATING_HOURS', {
          defaultValue: 'Khung giờ nằm ngoài thời gian hoạt động của trạm.',
        });
      }
      return t('booking.errors.BKG_TIME_INVALID', {
        defaultValue: 'Khung giờ đặt chỗ không hợp lệ. Vui lòng chọn lại.',
      });
    }

    if (error.code === 'BKG_PENDING_LIMIT_EXCEEDED' || error.code === 'PENDING_LIMIT_EXCEEDED') {
      return t('booking.errors.BKG_PENDING_LIMIT_EXCEEDED', {
        defaultValue: 'Bạn đang có lượt đặt chỗ chưa thanh toán hoặc chưa hoàn thành. Không thể đặt thêm.',
      });
    }

    // 1. Try exact code key (e.g. booking.errors.BKG_SLOT_UNAVAILABLE)
    const key = `booking.errors.${error.code}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;

    // 2. Try stripped code if prefixed with BKG_ (e.g. booking.errors.SLOT_UNAVAILABLE)
    if (error.code.startsWith('BKG_')) {
      const strippedCode = error.code.replace(/^BKG_/, '');
      const strippedKey = `booking.errors.${strippedCode}`;
      const strippedTranslated = t(strippedKey);
      if (strippedTranslated && strippedTranslated !== strippedKey) return strippedTranslated;
    }

    // 3. Try backend messageKey if available (e.g. error.booking.pendingLimitExceeded)
    if (error.messageKey) {
      const msgKeyTranslated = t(error.messageKey);
      if (msgKeyTranslated && msgKeyTranslated !== error.messageKey) return msgKeyTranslated;
    }

    if (error.userMessage) return error.userMessage;
  }

  if (error instanceof Error) {
    const key = `booking.errors.${error.message}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
    if (error.message && error.message !== 'GENERIC') return error.message;
  }

  return t('booking.errors.GENERIC', {
    defaultValue: 'Không thể hoàn tất đặt chỗ. Vui lòng thử lại.',
  });
}
