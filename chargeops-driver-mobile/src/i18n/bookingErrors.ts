import type { TFunction } from 'i18next';

/** Booking error codes thrown by bookingService (see BookingErrorCode there). */
const BOOKING_ERROR_CODES = ['RANGE_TAKEN', 'NETWORK_ERROR', 'GENERIC'] as const;

/**
 * Map an error thrown by the booking service (whose message is a stable CODE) to
 * a localized message via the `booking.errors.<CODE>` keys. Unknown errors fall
 * back to GENERIC. Mirrors authErrorMessage.
 */
export function bookingErrorMessage(t: TFunction, error: unknown): string {
  const code =
    error instanceof Error && (BOOKING_ERROR_CODES as readonly string[]).includes(error.message)
      ? error.message
      : 'GENERIC';
  return t(`booking.errors.${code}`);
}
