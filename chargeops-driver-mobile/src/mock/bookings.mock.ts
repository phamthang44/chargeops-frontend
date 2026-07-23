import { chargePointsMock, connectorsMock, stationsMock } from '@/mock/stations.mock';
import type { Booking, BookingStatus, CancelReason, PaymentMethod } from '@/types';
import { quoteBooking } from '@/utils/pricing';

/**
 * Mock bookings covering a spread of statuses, denormalized for the
 * history / detail screens.
 *
 * Live bookings use timestamps relative to "now" so the countdowns on
 * BookingDetail (check-in, 5-minute grace window, 10-minute payment hold) always
 * show a meaningful value during a demo, regardless of the device clock. Past
 * bookings use fixed dates.
 *
 * Prices are not hand-written: every booking is run through `quoteBooking`, the
 * same TOU pricing used at booking time, so the snapshotted price lines always
 * agree with what the picker would have quoted for that window.
 */
const NOW = Date.now();
const minutesFromNow = (m: number) => new Date(NOW + m * 60_000).toISOString();

/** How long an unpaid booking holds its range before the reservation lapses (BR-BOK-02). */
const PAYMENT_HOLD_MIN = 10;

interface BookingSeed {
  id: string;
  code: string;
  connectorId: string;
  startAt: string;
  durationMin: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  createdAt: string;
  checkedInAt?: string;
  cancelReason?: CancelReason;
  refundPercent?: number;
}

function build(seed: BookingSeed): Booking {
  const connector = connectorsMock.find((c) => c.id === seed.connectorId)!;
  const chargePoint = chargePointsMock.find((cp) => cp.id === connector.chargePointId)!;
  const station = stationsMock.find((s) => s.id === connector.stationId)!;
  const quote = quoteBooking(connector, seed.startAt, seed.durationMin);
  const endAt = new Date(new Date(seed.startAt).getTime() + seed.durationMin * 60_000).toISOString();

  return {
    id: seed.id,
    code: seed.code,
    stationId: station.id,
    stationName: station.name,
    stationAddress: station.address,
    stationImageUrl: station.imageUrl,
    connectorId: connector.id,
    connectorName: connector.name,
    chargePointName: chargePoint.name,
    zoneLabel: chargePoint.zoneLabel,
    connectorType: connector.connectorType,
    powerKw: connector.powerKw,
    startAt: seed.startAt,
    endAt,
    durationMin: seed.durationMin,
    priceLines: quote.priceLines,
    energyKwh: quote.energyKwh,
    chargingFee: quote.chargingFee,
    serviceFee: quote.serviceFee,
    totalPrice: quote.totalPrice,
    paymentMethod: seed.paymentMethod,
    status: seed.status,
    cancelReason: seed.cancelReason,
    checkedInAt: seed.checkedInAt,
    createdAt: seed.createdAt,
    expiresAt:
      seed.status === 'PENDING'
        ? new Date(new Date(seed.createdAt).getTime() + PAYMENT_HOLD_MIN * 60_000).toISOString()
        : null,
    refundPercent: seed.refundPercent,
    refundAmount:
      seed.refundPercent === undefined
        ? undefined
        : Math.round((quote.totalPrice * seed.refundPercent) / 100),
  };
}

export const bookingsMock: Booking[] = [
  // Just booked — inside the 5-minute grace window, so the detail screen shows
  // the "free cancellation until …" countdown (FR05).
  build({
    id: 'bk-009',
    code: 'CHG-8902',
    connectorId: 'cn-1012',
    startAt: minutesFromNow(60 * 3),
    durationMin: 60,
    paymentMethod: 'MOMO',
    status: 'CONFIRMED',
    createdAt: minutesFromNow(-1),
  }),
  // Starts soon — drives the check-in countdown.
  build({
    id: 'bk-001',
    code: 'CHG-8829',
    connectorId: 'cn-1011',
    startAt: minutesFromNow(35),
    durationMin: 60,
    paymentMethod: 'WALLET',
    status: 'CONFIRMED',
    createdAt: minutesFromNow(-120),
  }),
  // Crosses the 17:00 standard→peak boundary, so it carries two price lines.
  build({
    id: 'bk-002',
    code: 'CHG-8814',
    connectorId: 'cn-3011',
    startAt: (() => {
      const d = new Date(NOW);
      d.setDate(d.getDate() + 1);
      d.setHours(16, 15, 0, 0);
      return d.toISOString();
    })(),
    durationMin: 90,
    paymentMethod: 'MOMO',
    status: 'CONFIRMED',
    createdAt: minutesFromNow(-60),
  }),
  // Session under way.
  build({
    id: 'bk-007',
    code: 'CHG-8830',
    connectorId: 'cn-1021',
    startAt: minutesFromNow(-10),
    durationMin: 60,
    paymentMethod: 'WALLET',
    status: 'CHECKED_IN',
    createdAt: minutesFromNow(-180),
    checkedInAt: minutesFromNow(-9),
  }),
  // Awaiting payment — the 10-minute hold has ~7 minutes left (BR-BOK-02).
  build({
    id: 'bk-008',
    code: 'CHG-8841',
    connectorId: 'cn-2011',
    startAt: minutesFromNow(60 * 4),
    durationMin: 60,
    paymentMethod: 'MOMO',
    status: 'PENDING',
    createdAt: minutesFromNow(-3),
  }),
  // --- history ---
  build({
    id: 'bk-003',
    code: 'CHG-8721',
    connectorId: 'cn-2011',
    startAt: '2026-06-18T09:00:00+07:00',
    durationMin: 60,
    paymentMethod: 'ZALOPAY',
    status: 'COMPLETED',
    createdAt: '2026-06-17T20:10:00+07:00',
    checkedInAt: '2026-06-18T08:58:00+07:00',
  }),
  build({
    id: 'bk-004',
    code: 'CHG-8650',
    connectorId: 'cn-1012',
    startAt: '2026-06-15T14:00:00+07:00',
    durationMin: 60,
    paymentMethod: 'VISA',
    status: 'COMPLETED',
    createdAt: '2026-06-14T19:30:00+07:00',
    checkedInAt: '2026-06-15T13:55:00+07:00',
  }),
  // Cancelled ~40 min before start → the 50% tier.
  build({
    id: 'bk-005',
    code: 'CHG-8533',
    connectorId: 'cn-3012',
    startAt: '2026-06-12T18:00:00+07:00',
    durationMin: 60,
    paymentMethod: 'MOMO',
    status: 'CANCELLED',
    createdAt: '2026-06-11T08:00:00+07:00',
    cancelReason: 'DRIVER',
    refundPercent: 50,
  }),
  // Never checked in → auto-cancelled at 0% (BR-BOK-05).
  build({
    id: 'bk-006',
    code: 'CHG-8402',
    connectorId: 'cn-2011',
    startAt: '2026-06-10T07:00:00+07:00',
    durationMin: 60,
    paymentMethod: 'ATM',
    status: 'CANCELLED',
    createdAt: '2026-06-09T22:15:00+07:00',
    cancelReason: 'NO_SHOW',
    refundPercent: 0,
  }),
];
