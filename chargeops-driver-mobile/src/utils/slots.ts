import type { Slot } from '@/types';

/**
 * Client-side slot generation.
 *
 * Slots are a FRONTEND concern: we generate the date list and the hourly time
 * grid here, render it, and send the chosen slot's ISO timestamp to the backend
 * on booking. The backend owns final availability/price validation.
 *
 * NOW: availability/price are mocked deterministically so the grid looks real.
 * LATER: getAvailableSlots() (in bookingService) can merge real availability
 * from the backend onto this generated grid.
 */

const DAY_COUNT = 30; // allow booking up to ~a month ahead
const START_HOUR = 6; // first slot starts at 06:00
const END_HOUR = 22; // last slot starts at 21:00
const SLOT_MINUTES = 60;

/** The next `count` days starting today, each normalized to local midnight. */
export function getUpcomingDates(count = DAY_COUNT): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

/** Fixed per-slot price by time band (peak hours cost more). Info already snapshotted. */
function priceForHour(hour: number): number {
  if (hour >= 8 && hour < 10) return 55000; // morning peak
  if (hour >= 17 && hour < 21) return 60000; // evening peak
  if (hour >= 10 && hour < 16) return 50000; // daytime
  return 45000; // off-peak
}

/** Deterministic mock status so the grid shows a realistic mix of all four states. */
function mockStatus(date: Date, hour: number): Slot['status'] {
  const key = date.getDate() * 100 + hour;
  if (key % 7 === 0) return 'MINE'; // already booked by this driver
  if (key % 5 === 0) return 'OCCUPIED'; // booked by someone else
  if (key % 11 === 0) return 'UNAVAILABLE'; // maintenance / offline
  return 'AVAILABLE';
}

/** Build the hourly slot grid for one charger on one day. Past slots are dropped. */
export function generateDaySlots(chargerId: string, date: Date): Slot[] {
  const now = Date.now();
  const slots: Slot[] = [];

  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);
    if (start.getTime() <= now) continue; // skip past slots

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + SLOT_MINUTES);

    slots.push({
      id: `${chargerId}-${start.toISOString()}`,
      chargerId,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      price: priceForHour(hour),
      status: mockStatus(date, hour),
    });
  }

  return slots;
}
