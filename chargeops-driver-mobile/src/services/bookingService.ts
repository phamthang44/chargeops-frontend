import { bookingsMock } from '@/mock/bookings.mock';
import type { Booking } from '@/types';

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
