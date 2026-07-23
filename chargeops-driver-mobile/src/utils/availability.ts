import type { Booking } from '@/types';

/**
 * Bookable-time derivation (FR11).
 *
 * The system does not pre-generate or store time slots. Bookable time is
 * derived from the station's operating hours minus the ranges already booked on
 * that connector, and the driver picks a start time + duration inside what's
 * left. Everything here is pure and client-side for responsiveness; the backend
 * re-checks the range atomically at booking time (BR-BOK-01).
 */

/** Start times snap to a quarter hour. */
export const STEP_MIN = 15;

/** Durations the driver can pick, in minutes. */
export const DURATION_OPTIONS = [30, 60, 90, 120, 180] as const;

export const MIN_DURATION_MIN = DURATION_OPTIONS[0];

/** How far ahead a driver may book. */
export const BOOKING_HORIZON_DAYS = 30;

/**
 * A stretch of the day already spoken for on this connector.
 * `MINE` is the current driver's own booking — shown differently so they
 * recognize it rather than reading it as someone else's.
 */
export interface BusyRange {
  fromMin: number; // minutes from local midnight of the viewed day
  toMin: number;
  kind: 'OTHER' | 'MINE';
}

/** The next `count` days starting today, each normalized to local midnight. */
export function getUpcomingDates(count = BOOKING_HORIZON_DAYS): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Project the bookings on one connector onto the viewed day as busy ranges.
 * Only live bookings block time — cancelled/expired/completed ones released
 * their range (BR-BOK-07).
 */
const BLOCKING_STATUSES = new Set(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHARGING']);

export function busyRangesForDay(
  bookings: Booking[],
  connectorId: string,
  day: Date,
  myBookingIds: ReadonlySet<string> = new Set(),
): BusyRange[] {
  return bookings
    .filter((b) => b.connectorId === connectorId && BLOCKING_STATUSES.has(b.status))
    .filter((b) => isSameDay(new Date(b.startAt), day))
    .map((b) => ({
      fromMin: minutesOfDay(b.startAt),
      toMin: minutesOfDay(b.endAt),
      kind: myBookingIds.has(b.id) ? ('MINE' as const) : ('OTHER' as const),
    }))
    .sort((a, b) => a.fromMin - b.fromMin);
}

function overlaps(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  return aFrom < bTo && bFrom < aTo;
}

/** Do two ISO ranges intersect? Used for the BR-BOK-08 overlap warning. */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime()
  );
}

/**
 * The earliest minute of `day` a booking may start: the station's opening time,
 * and — for today — never in the past. Rounded up to the next step so the
 * driver isn't offered a start time that has already slipped by.
 */
export function earliestStartMin(day: Date, opensAtMin: number, now = new Date()): number {
  if (!isSameDay(day, now)) return opensAtMin;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.ceil(nowMin / STEP_MIN) * STEP_MIN;
  return Math.max(opensAtMin, rounded);
}

/**
 * How long a booking starting at `startMin` may run before it hits the next
 * booking or closing time. Returns 0 when the start itself is unavailable —
 * which is what makes an occupied start un-selectable rather than merely
 * clamped to a useless duration.
 */
export function maxDurationFrom(
  startMin: number,
  busy: BusyRange[],
  closesAtMin: number,
): number {
  if (busy.some((r) => overlaps(startMin, startMin + 1, r.fromMin, r.toMin))) return 0;
  const nextBusyStart = busy
    .filter((r) => r.fromMin >= startMin)
    .reduce((min, r) => Math.min(min, r.fromMin), Number.POSITIVE_INFINITY);
  return Math.max(0, Math.min(closesAtMin, nextBusyStart) - startMin);
}

/** Every selectable start time on `day`, each with the longest booking it allows. */
export function startOptions(
  day: Date,
  opensAtMin: number,
  closesAtMin: number,
  busy: BusyRange[],
  now = new Date(),
): { startMin: number; maxDurationMin: number }[] {
  const first = earliestStartMin(day, opensAtMin, now);
  const options: { startMin: number; maxDurationMin: number }[] = [];
  for (let m = first; m + MIN_DURATION_MIN <= closesAtMin; m += STEP_MIN) {
    options.push({ startMin: m, maxDurationMin: maxDurationFrom(m, busy, closesAtMin) });
  }
  return options;
}

/** `HH:MM` for a minutes-from-midnight value. */
export function formatMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Combine a day and a minutes-from-midnight offset into an ISO datetime. */
export function isoAtMinutes(day: Date, totalMin: number): string {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(totalMin);
  return d.toISOString();
}
