import { bookingsMock } from '@/mock/bookings.mock';
import type { Booking, CreateBookingRequest, Slot } from '@/types';
import { generateDaySlots } from '@/utils/slots';

/**
 * Booking data layer.
 *
 * Same contract as stationService: UI calls these async functions only.
 * NOW returns mock; LATER swap bodies for real REST calls without changing
 * signatures or calling UI.
 */

function simulateNetwork<T>(data: T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}

export async function getBookingHistory(): Promise<Booking[]> {
  // NOW: return mock. LATER: GET /bookings (current user)
  return simulateNetwork(bookingsMock);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  // NOW: return mock. LATER: GET /bookings/:id
  const booking = bookingsMock.find((b) => b.id === id) ?? null;
  return simulateNetwork(booking);
}

export async function getAvailableSlots(chargerId: string, dateISO: string): Promise<Slot[]> {
  // NOW: frontend-generated grid (see utils/slots).
  // LATER: GET /chargers/:chargerId/availability?date=  and merge onto the grid.
  return simulateNetwork(generateDaySlots(chargerId, new Date(dateISO)));
}

export async function createBooking(req: CreateBookingRequest): Promise<Booking> {
  // NOW: fake a PENDING booking. LATER: POST /bookings with the slots payload (req).
  const first = req.slots[0];
  const booking: Booking = {
    id: `bk-${Date.now()}`,
    slotId: first ? `${req.chargerId}-${first.startAt}` : '',
    status: 'PENDING',
  };
  return simulateNetwork(booking);
}
