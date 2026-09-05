import type { BookingPriceLine, Connector, RateKind } from '@/types';

/**
 * Time-of-use pricing (FR11).
 *
 * The driver books a continuous time range, so a booking can straddle a rate
 * boundary — 16:15–17:45 is partly standard and partly peak. A single đ/kWh
 * figure cannot describe that, so the range is split into one BookingPriceLine
 * per band and the total is their sum. The lines are snapshotted onto the
 * booking and never recalculated: later pricing changes apply to new bookings
 * only (BR-STA-03).
 *
 * The band boundaries and the rate deltas mirror the owner console's mock
 * pricing, so both apps quote the same price for the same window.
 */

/** Minutes from midnight. standard 05:00–17:00 · peak 17:00–21:00 · off-peak 21:00–05:00 */
const PEAK_FROM = 17 * 60;
const PEAK_TO = 21 * 60;
const STANDARD_FROM = 5 * 60;
const BAND_BOUNDARIES = [STANDARD_FROM, PEAK_FROM, PEAK_TO, 24 * 60];

/**
 * Fraction of a connector's rated power actually drawn over the window — a
 * charging curve tapers well below the nameplate figure, so billing the full
 * rating for the whole hour would overstate the energy.
 */
const ENERGY_FACTOR = 0.62;

/** Flat platform fee added on top of the price lines (VND). Set to 0 (no booking service fee). */
export const SERVICE_FEE = 0;

export function bandOf(totalMin: number): RateKind {
  const m = ((totalMin % 1440) + 1440) % 1440;
  if (m >= PEAK_FROM && m < PEAK_TO) return 'PEAK';
  if (m >= STANDARD_FROM && m < PEAK_FROM) return 'STANDARD';
  return 'OFFPEAK';
}

/** The connector's đ/kWh for one band: peak costs more, off-peak less. */
export function rateFor(baseRatePerKwh: number, kind: RateKind): number {
  if (kind === 'PEAK') return baseRatePerKwh + 800;
  if (kind === 'OFFPEAK') return baseRatePerKwh - 600;
  return baseRatePerKwh;
}

/** Next band boundary strictly after `totalMin` (may land in the following day). */
function nextBoundary(totalMin: number): number {
  const dayStart = Math.floor(totalMin / 1440) * 1440;
  const inDay = totalMin - dayStart;
  for (const b of BAND_BOUNDARIES) if (b > inDay) return dayStart + b;
  return dayStart + 1440;
}

/** Cut [start, start+duration) at every band boundary it crosses. */
export function splitIntoBands(
  startTotalMin: number,
  durationMin: number,
): { from: number; to: number; kind: RateKind }[] {
  const end = startTotalMin + durationMin;
  const segments: { from: number; to: number; kind: RateKind }[] = [];
  let cursor = startTotalMin;
  while (cursor < end) {
    const to = Math.min(nextBoundary(cursor), end);
    segments.push({ from: cursor, to, kind: bandOf(cursor) });
    cursor = to;
  }
  return segments;
}

/** Minutes from local midnight of the date `d` falls on. */
function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function atMinutes(dayStart: Date, totalMin: number): string {
  const d = new Date(dayStart);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(totalMin);
  return d.toISOString();
}

export interface Quote {
  priceLines: BookingPriceLine[];
  energyKwh: number;
  chargingFee: number;
  serviceFee: number;
  totalPrice: number;
}

/**
 * Price a time range on a connector. Pure — the same connector/start/duration
 * always yields the same quote, which is what lets the confirmation screen and
 * the created booking agree without a round trip.
 * Supports optional backend priceRanges for exact rate alignment with backend availability.
 */
export function quoteBooking(
  connector: Connector,
  startAt: string,
  durationMin: number,
  backendPriceRanges?: { startAt: string; endAt: string; rateVndPerKwh: number; periodCode?: string }[],
): Quote {
  const start = new Date(startAt);

  if (backendPriceRanges && backendPriceRanges.length > 0) {
    const startMs = start.getTime();
    const endMs = startMs + durationMin * 60_000;

    const intersecting = backendPriceRanges
      .map((r) => {
        const rStartMs = new Date(r.startAt).getTime();
        const rEndMs = new Date(r.endAt).getTime();
        const overlapStart = Math.max(startMs, rStartMs);
        const overlapEnd = Math.min(endMs, rEndMs);
        const segMin = (overlapEnd - overlapStart) / 60_000;
        const kind: RateKind =
          r.periodCode === 'PEAK' ? 'PEAK' : r.periodCode === 'OFF_PEAK' || r.periodCode === 'OFFPEAK' ? 'OFFPEAK' : 'STANDARD';
        return {
          fromAt: new Date(overlapStart).toISOString(),
          toAt: new Date(overlapEnd).toISOString(),
          durationMin: segMin,
          rateKind: kind,
          rateVndPerKwh: r.rateVndPerKwh,
        };
      })
      .filter((r) => r.durationMin > 0);

    if (intersecting.length > 0) {
      const priceLines: BookingPriceLine[] = intersecting.map((seg) => {
        const energyKwh = +(connector.powerKw * (seg.durationMin / 60) * ENERGY_FACTOR).toFixed(1);
        return {
          fromAt: seg.fromAt,
          toAt: seg.toAt,
          rateKind: seg.rateKind,
          rateVndPerKwh: seg.rateVndPerKwh,
          energyKwh,
          amount: Math.round((energyKwh * seg.rateVndPerKwh) / 1000) * 1000,
        };
      });
      const energyKwh = +priceLines.reduce((sum, l) => sum + l.energyKwh, 0).toFixed(1);
      const chargingFee = priceLines.reduce((sum, l) => sum + l.amount, 0);
      return {
        priceLines,
        energyKwh,
        chargingFee,
        serviceFee: SERVICE_FEE,
        totalPrice: chargingFee + SERVICE_FEE,
      };
    }
  }

  const startTot = minutesOfDay(start);

  const priceLines: BookingPriceLine[] = splitIntoBands(startTot, durationMin).map((seg) => {
    const segMin = seg.to - seg.from;
    const energyKwh = +(connector.powerKw * (segMin / 60) * ENERGY_FACTOR).toFixed(1);
    const rateVndPerKwh = rateFor(connector.ratePerKwh, seg.kind);
    return {
      fromAt: atMinutes(start, seg.from),
      toAt: atMinutes(start, seg.to),
      rateKind: seg.kind,
      rateVndPerKwh,
      energyKwh,
      // Round to the nearest 1.000đ — Vietnamese pricing is never quoted finer.
      amount: Math.round((energyKwh * rateVndPerKwh) / 1000) * 1000,
    };
  });

  const energyKwh = +priceLines.reduce((sum, l) => sum + l.energyKwh, 0).toFixed(1);
  const chargingFee = priceLines.reduce((sum, l) => sum + l.amount, 0);

  return {
    priceLines,
    energyKwh,
    chargingFee,
    serviceFee: SERVICE_FEE,
    totalPrice: chargingFee + SERVICE_FEE,
  };
}

/** The band covering the largest share of the window — drives the summary chip. */
export function dominantBand(priceLines: BookingPriceLine[]): RateKind {
  const span = (l: BookingPriceLine) => new Date(l.toAt).getTime() - new Date(l.fromAt).getTime();
  return [...priceLines].sort((a, b) => span(b) - span(a))[0]?.rateKind ?? 'STANDARD';
}
