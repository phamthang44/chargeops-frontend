import { bookingsMock } from '@/mock/bookings.mock';
import { chargersMock, stationsMock } from '@/mock/stations.mock';
import type { Booking, CreateBookingRequest, Slot } from '@/types';
import { generateDaySlots } from '@/utils/slots';
import {
  resolveBookingOutcome,
  resolvePaymentOutcome,
  type PaymentResultStatus,
} from './simulation';

/**
 * Stable booking error codes (language-agnostic) thrown by the service. Screens
 * map them to localized copy via `bookingErrorMessage` (see @/i18n/bookingErrors),
 * mirroring the authService convention.
 */
export type BookingErrorCode = 'SLOT_TAKEN' | 'NETWORK_ERROR';

/** Result of attempting to settle payment for a pending booking. */
export interface PaymentResult {
  status: PaymentResultStatus;
  booking: Booking | null;
}

/**
 * Booking data layer.
 *
 * Same contract as stationService: UI calls these async functions only.
 * NOW returns mock; LATER swap bodies for real REST calls without changing
 * signatures or calling UI.
 *
 * Created/cancelled bookings mutate an in-memory store seeded from the mock so
 * BookingSuccess / BookingDetail / BookingHistory stay consistent within a
 * session. The store disappears on reload (no persistence yet).
 */

/** Flat platform fee added on top of the snapshotted slot prices (VND). */
export const SERVICE_FEE = 5000;

// In-memory store (newest first). Seeded from the mock once at module load.
const store: Booking[] = [...bookingsMock];

function simulateNetwork<T>(data: T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}

export async function getBookingHistory(): Promise<Booking[]> {
  // NOW: return the in-memory store. LATER: GET /bookings (current user)
  return simulateNetwork([...store]);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  // NOW: look up in the store. LATER: GET /bookings/:id
  const booking = store.find((b) => b.id === id) ?? null;
  return simulateNetwork(booking);
}

export async function getAvailableSlots(chargerId: string, dateISO: string): Promise<Slot[]> {
  // NOW: frontend-generated grid (see utils/slots).
  // LATER: GET /chargers/:chargerId/availability?date=  and merge onto the grid.
  return simulateNetwork(generateDaySlots(chargerId, new Date(dateISO)));
}

export async function createBooking(req: CreateBookingRequest): Promise<Booking> {
  // Simulated edge cases first (mock only): the slot was taken by someone else
  // between picking and paying, or the request failed to reach the server.
  // LATER: these become real 409 / network errors from POST /bookings.
  const outcome = resolveBookingOutcome();
  if (outcome === 'SLOT_TAKEN') {
    await simulateNetwork(null, 600);
    throw new Error('SLOT_TAKEN' satisfies BookingErrorCode);
  }
  if (outcome === 'NETWORK_ERROR') {
    await simulateNetwork(null, 600);
    throw new Error('NETWORK_ERROR' satisfies BookingErrorCode);
  }

  // NOW: build a PENDING booking (payment not settled yet), snapshotting
  // station/charger details, and push it to the store. The booking only becomes
  // CONFIRMED once the payment gateway confirms — see confirmPayment().
  // LATER: POST /bookings with the slots payload (req) -> server returns PENDING.
  const station = stationsMock.find((s) => s.id === req.stationId);
  const charger = chargersMock.find((c) => c.id === req.chargerId);
  const sorted = [...req.slots].sort((a, b) => (a.startAt < b.startAt ? -1 : 1));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const chargingFee = sorted.reduce((sum, s) => sum + s.price, 0);

  const booking: Booking = {
    id: `bk-${Date.now()}`,
    code: `CHG-${String(Date.now()).slice(-4)}`,
    stationId: req.stationId,
    stationName: station?.name ?? '',
    stationAddress: station?.address ?? '',
    stationImageUrl: station?.imageUrl,
    chargerId: req.chargerId,
    chargerName: charger?.name ?? '',
    connectorType: charger?.connectorType ?? 'CCS2',
    powerKw: charger?.powerKw ?? 0,
    startAt: first?.startAt ?? new Date().toISOString(),
    endAt: last?.endAt ?? new Date().toISOString(),
    slotCount: sorted.length,
    chargingFee,
    serviceFee: SERVICE_FEE,
    totalPrice: chargingFee + SERVICE_FEE,
    paymentMethod: req.paymentMethod,
    status: 'PENDING', // awaiting payment confirmation
    createdAt: new Date().toISOString(),
  };

  store.unshift(booking);
  return simulateNetwork(booking);
}

/**
 * Settle the payment for a pending booking. Resolves to a PaymentResult whose
 * `status` covers every gateway outcome:
 *  - SUCCESS   -> booking becomes CONFIRMED
 *  - FAILED    -> declined / insufficient funds; booking stays PENDING (retryable)
 *  - TIMEOUT   -> no gateway response; booking stays PENDING (retryable)
 *  - CANCELLED -> user aborted at the gateway; booking becomes CANCELLED
 * NOW: outcome is driven by the demo simulator. LATER: poll GET /bookings/:id or
 * handle the gateway webhook / return URL — same PaymentResult shape.
 */
export async function confirmPayment(id: string): Promise<PaymentResult> {
  const status = resolvePaymentOutcome();
  const booking = store.find((b) => b.id === id) ?? null;

  if (booking && booking.status === 'PENDING') {
    if (status === 'SUCCESS') booking.status = 'CONFIRMED';
    else if (status === 'CANCELLED') booking.status = 'CANCELLED';
    // FAILED / TIMEOUT leave it PENDING so the user can retry.
  }

  return simulateNetwork({ status, booking }, 2200);
}

export async function cancelBooking(id: string): Promise<Booking | null> {
  // NOW: flip the status in the store. LATER: POST /bookings/:id/cancel
  const booking = store.find((b) => b.id === id);
  if (booking) booking.status = 'CANCELLED';
  return simulateNetwork(booking ?? null);
}

export async function checkInBooking(id: string): Promise<Booking | null> {
  // NOW: mark CHECKED_IN. LATER: POST /bookings/:id/check-in (after QR scan)
  const booking = store.find((b) => b.id === id);
  if (booking) {
    booking.status = 'CHECKED_IN';
    booking.checkedInAt = new Date().toISOString();
  }
  return simulateNetwork(booking ?? null);
}

export async function completeBooking(id: string): Promise<Booking | null> {
  // NOW: mark COMPLETED at the end of a charging session.
  // LATER: the backend closes the session (charging auto-stops when full).
  const booking = store.find((b) => b.id === id);
  if (booking) booking.status = 'COMPLETED';
  return simulateNetwork(booking ?? null);
}
