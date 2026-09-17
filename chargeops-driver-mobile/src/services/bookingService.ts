import { bookingsMock } from '@/mock/bookings.mock';
import { occupancyMock } from '@/mock/occupancy.mock';
import { chargePointsMock, connectorsMock, stationsMock } from '@/mock/stations.mock';
import type {
  BackendCreateBookingResponse,
  Booking,
  BookingActions,
  BookingDetailItem,
  BookingPriceLine,
  BookingStatus,
  CancellationCapabilityReason,
  CheckInCapabilityReason,
  ChargePoint,
  Connector,
  CreateBookingRequest,
  DriverBookingListItem,
  PaymentMethod,
  RateKind,
  Station,
} from '@/types';
import { busyRangesForDay, isSameDay, rangesOverlap, type BusyRange } from '@/utils/availability';
import { quoteBooking, SERVICE_FEE, type Quote } from '@/utils/pricing';
import {
  resolveBookingOutcome,
  resolvePaymentOutcome,
  type PaymentResultStatus,
} from './simulation';
import {
  apiBaseUrl,
  isMockMode,
  resolveAccessToken,
  getConnectorById,
  getStationById,
} from './stationService';

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

export { SERVICE_FEE };

/**
 * Stable booking error codes (language-agnostic) thrown by the service. Screens
 * map them to localized copy via `bookingErrorMessage` (see @/i18n/bookingErrors),
 * mirroring the authService convention.
 */
export type BookingErrorCode =
  | 'RANGE_TAKEN'
  | 'NETWORK_ERROR'
  | 'PRICE_CHANGED'
  | 'CONNECTOR_BUSY'
  | 'CONNECTOR_LOCKED'
  | 'SLOT_UNAVAILABLE'
  | 'DRIVER_ACTIVE_BOOKING_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED'
  | 'GENERIC';

/**
 * Error thrown when backend booking API returns an error response.
 * Carries code, userMessage, and structured error details (e.g. validation errors).
 */
export class BookingApiError extends Error {
  code: string;
  details?: any;
  userMessage?: string;
  messageKey?: string;

  constructor(code: string, message?: string, details?: any, messageKey?: string) {
    super(message || code);
    this.name = 'BookingApiError';
    this.code = code;
    this.details = details;
    this.userMessage = message;
    this.messageKey = messageKey;
  }
}

/**
 * Specific error thrown when backend returns 409 PRICE_CHANGED (BKG-020).
 * Holds latestPricePreview so the screen can prompt driver for consent.
 */
export class PriceChangedError extends Error {
  latestPricePreview: BackendPricePreviewResponse;
  constructor(latestPricePreview: BackendPricePreviewResponse) {
    super('PRICE_CHANGED');
    this.name = 'PriceChangedError';
    this.latestPricePreview = latestPricePreview;
  }
}

/**
 * Generate RFC4122 v4 UUID for Idempotency-Key.
 */
export function generateIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // ignore
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Result of attempting to settle payment for a pending booking. */
export interface PaymentResult {
  status: PaymentResultStatus;
  booking: Booking | null;
}

/** How long an unpaid booking holds its time range (BR-BOK-02). */
export const PAYMENT_HOLD_MIN = 10;
/** Check-in opens at the start time and closes this many minutes later (BR-BOK-04). */
export const CHECK_IN_WINDOW_MIN = 15;

let bookingServerClockOffsetMs = 0;

/**
 * Current time aligned with the booking API clock. It falls back to the device
 * clock until a response containing ApiResult.meta.serverTime is received.
 */
export function getBookingNowMs(): number {
  return Date.now() + bookingServerClockOffsetMs;
}

/** Return a safe countdown value for an absolute ISO-8601 deadline. */
export function getBookingTimeRemainingMs(
  deadline: string | null | undefined,
  now: number = getBookingNowMs(),
): number {
  if (!deadline) return 0;
  const deadlineMs = Date.parse(deadline);
  return Number.isFinite(deadlineMs) ? Math.max(0, deadlineMs - now) : 0;
}

function syncBookingServerClock(
  serverTime: unknown,
  requestStartedAt: number,
  responseReceivedAt: number,
): void {
  const serverTimeMs = Number(serverTime);
  if (!Number.isFinite(serverTimeMs)) return;

  // Midpoint compensation avoids counting the whole network round-trip as
  // clock skew. Subsequent local ticks remain network-free.
  const clientMidpoint = requestStartedAt + (responseReceivedAt - requestStartedAt) / 2;
  bookingServerClockOffsetMs = serverTimeMs - clientMidpoint;
}

/** Refund tier per FR08 / BR-PAY-03 / Unpaid Hold. */
export type RefundTier = 'UNPAID' | 'GRACE' | 'FULL' | 'PARTIAL' | 'NONE';

export interface RefundBreakdown {
  tier: RefundTier;
  percent: number; // 100 | 50 | 0
  refundAmount: number; // VND credited back
  feeAmount: number; // VND withheld (totalPrice - refundAmount)
  minutesBefore: number; // whole minutes before start (negative once started)
  /** Milliseconds left in the grace window, or 0 once it has closed. */
  graceRemainingMs: number;
  /** Milliseconds left in the unpaid payment hold window, or 0 if expired/not unpaid. */
  holdRemainingMs?: number;
  /** Whether the booking is unpaid / still in payment hold */
  isUnpaid?: boolean;
}

/**
 * Compute the refund preview from server capabilities and the booking-specific
 * free-cancellation deadline. Never rebuild policy from createdAt: the server
 * may start the grace window at payment confirmation or apply another policy
 * version to this booking.
 */
export function computeRefund(booking: Booking, now: number = getBookingNowMs()): RefundBreakdown {
  const serverReason = booking.actions?.cancellationReason;
  const isUnpaid = booking.status === 'PENDING' || serverReason === 'UNPAID';
  const minutesBefore = Math.floor((new Date(booking.startAt).getTime() - now) / 60_000);

  if (isUnpaid) {
    const holdRemainingMs = getBookingTimeRemainingMs(
      booking.paymentHoldExpiresAt ?? booking.expiresAt,
      now,
    );
    return {
      tier: 'UNPAID',
      percent: 0,
      refundAmount: 0,
      feeAmount: 0,
      minutesBefore,
      graceRemainingMs: 0,
      holdRemainingMs,
      isUnpaid: true,
    };
  }

  const graceRemainingMs = getBookingTimeRemainingMs(booking.freeCancellationDeadline, now);
  const serverRefundAmount = booking.actions?.refundableAmount;

  // Under Platform Policy v4.9 / BR-PAY-02, BR-PAY-03:
  // 100% refund is ONLY applicable during the 10-minute grace period from payment confirmation.
  // After grace period, cancellation has 0% refund (NONE).
  const isGrace =
    serverReason !== undefined
      ? serverReason === 'WITHIN_GRACE'
      : graceRemainingMs > 0;

  let percent: number;
  let tier: RefundTier;

  if (isGrace) {
    percent = 100;
    tier = 'GRACE';
  } else {
    percent = 0;
    tier = 'NONE';
  }

  const refundAmount =
    serverRefundAmount !== undefined && serverRefundAmount !== null
      ? serverRefundAmount
      : Math.round((booking.totalPrice * percent) / 100);

  const feeAmount = Math.max(0, booking.totalPrice - refundAmount);

  return {
    tier,
    percent,
    refundAmount,
    feeAmount,
    minutesBefore,
    graceRemainingMs: isGrace ? graceRemainingMs : 0,
    isUnpaid: false,
  };
}

// In-memory store (newest first). Seeded from the mock only in mock mode.
const store: Booking[] = isMockMode() ? [...bookingsMock] : [];

function simulateNetwork<T>(data: T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}

/**
 * Release unpaid bookings whose 10-minute hold has lapsed (BR-BOK-02), and
 * auto-cancel confirmed bookings nobody checked into within 15 minutes of the
 * start (BR-BOK-05, 0% refund). Runs on every read so the store never serves a
 * booking in a state the clock has already invalidated.
 */
function reconcileLapsed(now = Date.now()): void {
  for (const b of store) {
    if (b.status === 'PENDING' && b.expiresAt && new Date(b.expiresAt).getTime() <= now) {
      b.status = 'EXPIRED';
      b.expiresAt = null;
    }
    if (
      b.status === 'CONFIRMED' &&
      now > new Date(b.startAt).getTime() + CHECK_IN_WINDOW_MIN * 60_000
    ) {
      b.status = 'CANCELLED';
      b.cancelReason = 'NO_SHOW';
      b.refundPercent = 0;
      b.refundAmount = 0;
    }
  }
}

/** Bookings that are still live — the Đặt chỗ tab. Never many, so never paged. */
const ACTIVE_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHARGING'];
/** Bookings that are over — the Lịch sử tab. Grows without bound, so always paged. */
const ENDED_STATUSES: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'EXPIRED'];

/**
 * Active bookings for the driver (FR09). A driver holds a handful of these at
 * most, so this deliberately returns the whole set with no paging.
 * LATER: GET /bookings?state=active
 */
/**
 * Normalize booking with server-driven actions & deadlines for local store / mock fallback.
 */
export function normalizeBookingWithCapabilities(b: Booking): Booking {
  const now = getBookingNowMs();
  const startMs = new Date(b.startAt).getTime();
  const checkInOpensAt = b.checkInOpensAt ?? b.startAt;
  const checkInDeadline = b.checkInDeadline;
  const checkInDeadlineMs = checkInDeadline ? new Date(checkInDeadline).getTime() : Number.NaN;
  const paymentHoldExpiresAt =
    b.paymentHoldExpiresAt ??
    b.expiresAt ??
    undefined;
  const freeCancellationDeadline = b.freeCancellationDeadline;
  const isGrace = getBookingTimeRemainingMs(freeCancellationDeadline, now) > 0;

  let canCancel = false;
  let refundableAmount = 0;
  let cancellationReason: CancellationCapabilityReason = 'NOT_CANCELLABLE';

  if (b.status === 'PENDING') {
    canCancel = true;
    refundableAmount = 0;
    cancellationReason = 'UNPAID';
  } else if (b.status === 'CONFIRMED') {
    canCancel = true;
    if (isGrace) {
      refundableAmount = b.totalPrice;
      cancellationReason = 'WITHIN_GRACE';
    } else {
      refundableAmount = 0;
      cancellationReason = 'GRACE_ENDED';
    }
  }

  let canCheckIn = false;
  let checkInReason: CheckInCapabilityReason = 'AVAILABLE';
  if (b.status === 'CONFIRMED') {
    if (now < startMs) {
      canCheckIn = false;
      checkInReason = 'TOO_EARLY';
    } else if (!Number.isFinite(checkInDeadlineMs) || now > checkInDeadlineMs) {
      canCheckIn = false;
      checkInReason = 'WINDOW_CLOSED';
    } else {
      canCheckIn = true;
      checkInReason = 'AVAILABLE';
    }
  } else {
    checkInReason = 'WRONG_STATE';
  }

  const actions: BookingActions = b.actions ?? {
    canCancel,
    refundableAmount,
    cancellationReason,
    canCheckIn,
    checkInReason,
    canStartCharging: b.status === 'CHECKED_IN',
    canComplete: b.status === 'CHARGING',
    canReportIssue: true,
  };

  return {
    ...b,
    paymentHoldExpiresAt,
    freeCancellationDeadline,
    checkInOpensAt,
    checkInDeadline,
    actions,
  };
}

export function mapListItemToBooking(item: DriverBookingListItem): Booking {
  return {
    id: item.bookingId,
    code: item.bookingCode,
    stationId: item.station.stationId,
    stationName: item.station.stationName,
    stationAddress: item.station.stationAddress,
    stationImageUrl: item.station.stationImageUrl ?? undefined,
    connectorId: item.station.connectorId,
    connectorCode: item.station.connectorCode,
    connectorName: item.station.connectorCode ?? 'Connector',
    chargePointCode: item.station.chargePointCode,
    chargePointName: item.station.chargePointCode ?? 'Trụ sạc',
    zoneLabel: null,
    connectorType: 'CCS2',
    powerKw: 60,
    startAt: item.startAt,
    endAt: item.endAt,
    durationMin: item.durationMin,
    priceLines: [],
    energyKwh: item.totalAmount > 0 ? +(item.totalAmount / 3850).toFixed(1) : 0,
    chargingFee: item.totalAmount,
    serviceFee: 0,
    totalPrice: item.totalAmount,
    paymentMethod: 'VNPAY',
    status: item.status,
    cancelReason: item.cancellationReason,
    checkedInAt: item.checkedInAt,
    createdAt: item.createdAt,
    expiresAt: item.paymentHoldExpiresAt ?? null,
    paymentHoldExpiresAt: item.paymentHoldExpiresAt,
    freeCancellationDeadline: item.freeCancellationDeadline,
    checkInOpensAt: item.checkInOpensAt,
    checkInDeadline: item.checkInDeadline,
    chargingStartedAt: item.chargingStartedAt,
    actions: item.actions,
    refundAmount: item.actions?.refundableAmount,
  };
}

export function mapDetailItemToBooking(item: BookingDetailItem): Booking {
  const base = mapListItemToBooking(item);
  const rawPriceLines: any[] = item.priceLines ?? [];
  const normalizedPriceLines: BookingPriceLine[] = rawPriceLines.length > 0
    ? rawPriceLines.map((line) => ({
        fromAt: line.fromAt ?? line.startAt ?? item.startAt,
        toAt: line.toAt ?? line.endAt ?? item.endAt,
        rateKind: (line.rateKind ?? line.periodCode ?? 'STANDARD') as RateKind,
        rateVndPerKwh: Number(line.rateVndPerKwh ?? 0),
        energyKwh: Number(line.energyKwh ?? line.estimatedEnergyKwh ?? (line.amount && line.rateVndPerKwh ? +(line.amount / line.rateVndPerKwh).toFixed(1) : 0)),
        amount: Number(line.amount ?? 0),
      }))
    : [
        {
          fromAt: item.startAt,
          toAt: item.endAt,
          rateKind: 'STANDARD' as RateKind,
          rateVndPerKwh: 3850,
          energyKwh: item.totalAmount > 0 ? +(item.totalAmount / 3850).toFixed(1) : 0,
          amount: item.totalAmount,
        },
      ];

  const totalKwh = normalizedPriceLines.reduce((acc, l) => acc + l.energyKwh, 0);

  return {
    ...base,
    createdAt: item.createdAt,
    priceLines: normalizedPriceLines,
    energyKwh: totalKwh > 0 ? +totalKwh.toFixed(1) : base.energyKwh,
    paymentMethod: item.payment?.method ?? (item.checkout?.method as any) ?? 'VNPAY',
    paymentConfirmedAt: item.paymentConfirmedAt,
    completedAt: item.completedAt,
    refundAmount: item.refunds?.[0]?.amount ?? item.actions?.refundableAmount ?? 0,
    checkout: item.checkout,
    paymentDetail: item.payment,
    refunds: item.refunds ?? [],
    policyVersion: item.policyVersion,
    stateReconciliationPending: item.stateReconciliationPending,
    persistedStatus: item.persistedStatus,
  };
}

/**
 * Active bookings for the driver (FR09 / BKG-021).
 * Calls GET /api/v1/bookings/active when connected to backend,
 * falls back to local reactive store with server-like capabilities.
 */
export async function getActiveBookings(accessToken?: string | null): Promise<Booking[]> {
  if (!isMockMode()) {
    try {
      const token = resolveAccessToken(accessToken);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const requestStartedAt = Date.now();
      const res = await fetch(`${apiBaseUrl}/api/v1/bookings/active`, { headers });
      if (res.ok) {
        const json = await res.json();
        syncBookingServerClock(json?.meta?.serverTime, requestStartedAt, Date.now());
        const content: DriverBookingListItem[] =
          json?.data?.content ?? json?.data ?? json?.content ?? json;
        if (Array.isArray(content)) {
          return content.map(mapListItemToBooking);
        }
      }
    } catch (err) {
      console.warn('Network error fetching active bookings, falling back to local store:', err);
    }
  }

  reconcileLapsed();
  const items = store
    .filter((b) => ACTIVE_STATUSES.includes(b.status))
    .sort((a, b) => (a.startAt < b.startAt ? -1 : 1))
    .map(normalizeBookingWithCapabilities);
  return simulateNetwork(items);
}

/**
 * Retrieve the driver's current active pending booking, if one exists.
 * Used when handling BKG_PENDING_LIMIT_EXCEEDED to navigate driver directly
 * to the pending booking's detail or payment screen.
 */
export async function getLatestPendingBooking(): Promise<Booking | null> {
  reconcileLapsed();
  const pending = store.find((b) => b.status === 'PENDING');
  return simulateNetwork(pending ? normalizeBookingWithCapabilities(pending) : null, 100);
}

/** Which ended bookings the history screen is asking for. */
export type HistoryStatusFilter = 'all' | 'completed' | 'cancelled';

const HISTORY_STATUS_MATCH: Record<HistoryStatusFilter, BookingStatus[]> = {
  all: ENDED_STATUSES,
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED', 'EXPIRED'],
};

export interface BookingHistoryFilter {
  /** Free-text match against station, address, booking code and connector. */
  query?: string;
  status?: HistoryStatusFilter;
}

/**
 * One page of history plus the counts the UI needs but cannot derive from a
 * page. `nextCursor` is the last item's id (keyset paging, same contract as
 * StationPage): stable while older rows are appended below.
 */
export interface BookingHistoryPage {
  items: Booking[];
  nextCursor: string | null;
  /** Rows matching the *whole* filter, not just this page. */
  total: number;
  /** Per-status totals under the current query — drives the chip counters. */
  counts: Record<HistoryStatusFilter, number>;
}

/** Lifetime totals across every completed session — an aggregate, never a page scan. */
export interface BookingStats {
  sessions: number;
  hours: number;
  spent: number;
}

export const BOOKING_PAGE_SIZE = 15;

/**
 * Free-text match over the fields a driver would actually recall about a past
 * booking. Lives in the service, not the screen: this is the predicate the
 * backend will run, and the UI must never see the rows it excludes.
 */
function matchesBookingQuery(b: Booking, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    b.stationName,
    b.stationAddress,
    b.code,
    b.chargePointName,
    b.connectorName,
    b.connectorType,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

/**
 * Search, filter and page the driver's ended bookings (FR09 / BKG-021).
 * Calls GET /api/v1/bookings/history when connected to backend.
 */
export async function getBookingHistory(
  filter: BookingHistoryFilter = {},
  page: { cursor?: string | null; limit?: number; pageIndex?: number } = {},
  accessToken?: string | null,
): Promise<BookingHistoryPage> {
  const { cursor = null, limit = BOOKING_PAGE_SIZE, pageIndex = 1 } = page;
  const { query = '', status = 'all' } = filter;

  if (!isMockMode()) {
    try {
      const token = resolveAccessToken(accessToken);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      let url = `${apiBaseUrl}/api/v1/bookings/history?page=${pageIndex}&size=${limit}`;
      if (status === 'completed') url += '&status=COMPLETED';
      if (status === 'cancelled') url += '&status=CANCELLED';

      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const pageData = json?.data ?? json;
        const metaData = json?.meta;
        const rawItems: DriverBookingListItem[] = pageData?.content ?? pageData?.items ?? (Array.isArray(pageData) ? pageData : []);
        const items = rawItems.map(mapListItemToBooking);
        const total = pageData?.totalElements ?? pageData?.total ?? items.length;
        const nextCursor = items.length === limit ? String(pageIndex + 1) : null;
        const serverCounts = metaData?.counts;
        const counts: Record<HistoryStatusFilter, number> = {
          all: Number(serverCounts?.all ?? (status === 'all' ? total : -1)),
          completed: Number(serverCounts?.completed ?? (status === 'completed' ? total : -1)),
          cancelled: Number(serverCounts?.cancelled ?? (status === 'cancelled' ? total : -1)),
        };
        return { items, nextCursor, total, counts };
      }
    } catch (err) {
      console.warn('Network error fetching booking history, falling back to local store:', err);
    }
  }

  reconcileLapsed();
  const matched = store
    .filter((b) => ENDED_STATUSES.includes(b.status) && matchesBookingQuery(b, query))
    .sort((a, b) => (a.startAt < b.startAt ? 1 : -1))
    .map(normalizeBookingWithCapabilities);

  const counts = {
    all: matched.length,
    completed: matched.filter((b) => HISTORY_STATUS_MATCH.completed.includes(b.status)).length,
    cancelled: matched.filter((b) => HISTORY_STATUS_MATCH.cancelled.includes(b.status)).length,
  };

  const filtered = matched.filter((b) => HISTORY_STATUS_MATCH[status].includes(b.status));
  const start = cursor ? filtered.findIndex((b) => b.id === cursor) + 1 : 0;
  const items = filtered.slice(start, start + limit);
  const nextCursor =
    start + limit < filtered.length && items.length > 0 ? items[items.length - 1].id : null;

  return simulateNetwork({ items, nextCursor, total: filtered.length, counts });
}

/**
 * Lifetime charging totals (Modular aggregate).
 * Can be fetched from GET /api/v1/bookings/stats in future, or aggregated from completed sessions.
 */
export async function getBookingStats(accessToken?: string | null): Promise<BookingStats> {
  if (!isMockMode()) {
    try {
      const token = resolveAccessToken(accessToken);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${apiBaseUrl}/api/v1/bookings/stats`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data ?? json;
        if (data) {
          const sessions = data.sessions ?? data.totalChargingSessions ?? data.totalCompletedBookings;
          if (typeof sessions === 'number') {
            return {
              sessions,
              hours: Number(data.hours ?? data.totalHours ?? 0),
              spent: Number(data.spent ?? data.totalSpending ?? 0),
            };
          }
        }
      }
    } catch {
      // Future endpoint not yet ready; fall through to store calculation
    }
  }

  reconcileLapsed();
  const done = store.filter((b) => b.status === 'COMPLETED');
  return simulateNetwork({
    sessions: done.length,
    hours: Math.round(done.reduce((sum, b) => sum + b.durationMin, 0) / 60),
    spent: done.reduce((sum, b) => sum + b.totalPrice, 0),
  });
}

/**
 * Fetch booking detail (BKG-021).
 * Calls GET /api/v1/bookings/:id when connected to backend.
 */
export async function getBookingById(id: string, accessToken?: string | null): Promise<Booking | null> {
  if (!isMockMode()) {
    try {
      const token = resolveAccessToken(accessToken);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const requestStartedAt = Date.now();
      const res = await fetch(`${apiBaseUrl}/api/v1/bookings/${id}`, { headers });
      if (res.ok) {
        const json = await res.json();
        syncBookingServerClock(json?.meta?.serverTime, requestStartedAt, Date.now());
        const data: BookingDetailItem = json?.data ?? json;
        if (data && (data.bookingId || (data as any).id)) {
          return mapDetailItemToBooking(data);
        }
      } else {
        const errJson = await res.json().catch(() => null);
        const code =
          errJson?.error?.code ??
          errJson?.code ??
          (res.status === 403
            ? 'BKG_NOT_ACCESS'
            : res.status === 404
            ? 'RESOURCE_NOT_FOUND'
            : 'NETWORK_ERROR');
        const message =
          errJson?.error?.message ??
          errJson?.message ??
          (res.status === 403
            ? 'Bạn không có quyền truy cập lượt đặt chỗ này'
            : 'Không tìm thấy lượt đặt chỗ');
        const messageKey =
          errJson?.error?.messageKey ??
          (res.status === 403 ? 'error.booking.notAccess' : undefined);
        throw new BookingApiError(code, message, errJson?.error?.details, messageKey);
      }
    } catch (err) {
      if (err instanceof BookingApiError) {
        throw err;
      }
      console.warn('Network error fetching booking detail, falling back to local store:', err);
    }
  }

  reconcileLapsed();
  if (isMockMode()) {
    if (id === 'forbidden' || id.toLowerCase().includes('not_access') || id.toLowerCase().includes('other_driver')) {
      throw new BookingApiError(
        'BKG_NOT_ACCESS',
        'Bạn không có quyền truy cập lượt đặt chỗ này',
        null,
        'error.booking.notAccess',
      );
    }
  }

  const booking = store.find((b) => b.id === id) ?? null;
  return simulateNetwork(booking ? normalizeBookingWithCapabilities(booking) : null);
}

/**
 * Time already reserved on a connector for one day — the driver's own bookings
 * plus every other driver's. This is what the picker subtracts from operating
 * hours to derive bookable time (FR11); there is no stored slot list to read.
 * LATER: GET /connectors/:id/availability?date=
 */
export async function getBusyRanges(connectorId: string, dayISO: string): Promise<BusyRange[]> {
  reconcileLapsed();
  const day = new Date(dayISO);
  const mine = busyRangesForDay(
    store,
    connectorId,
    day,
    new Set(store.map((b) => b.id)), // every booking in the store belongs to this driver
  );
  const others: BusyRange[] = occupancyMock
    .filter((o) => o.connectorId === connectorId && isSameDay(new Date(o.startAt), day))
    .map((o) => {
      const s = new Date(o.startAt);
      const e = new Date(o.endAt);
      return {
        fromMin: s.getHours() * 60 + s.getMinutes(),
        toMin: e.getHours() * 60 + e.getMinutes(),
        kind: 'OTHER' as const,
      };
    });
  return simulateNetwork([...mine, ...others].sort((a, b) => a.fromMin - b.fromMin));
}

export interface BackendPriceLineResponse {
  sequence: number;
  startAt: string;
  endAt: string;
  durationMin: number;
  label: string;
  periodCode: string;
  rateVndPerKwh: number;
  estimatedEnergyKwh: number;
  amount: number;
}

export interface BackendPricePreviewResponse {
  pricingVersion: string;
  connectorId: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  currency: string;
  totalAmount: number;
  priceLines: BackendPriceLineResponse[];
  pricingBasis?: {
    kind?: string;
    rateUnit?: string;
    formulaVersion?: string;
    energyFactor?: number;
    powerKw?: number;
  };
  policy?: any;
  overlapWarnings?: string[];
}

/**
 * Preview price directly from the backend (BKG-017).
 * Calls POST /api/v1/bookings/price-preview.
 * Falls back to local quote if network or mock mode is active.
 */
export async function getPricePreview(
  connectorId: string,
  startAt: string,
  durationMin: number,
  options?: {
    accessToken?: string | null;
    connector?: Connector | null;
    priceRanges?: { startAt: string; endAt: string; rateVndPerKwh: number; periodCode?: string }[];
  },
): Promise<BackendPricePreviewResponse | null> {
  if (!isMockMode()) {
    try {
      const token = resolveAccessToken(options?.accessToken);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/bookings/price-preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          connectorId,
          startAt,
          durationMin,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const data: BackendPricePreviewResponse | undefined = payload?.data ?? payload;
        if (data && data.pricingVersion) {
          return data;
        }
      } else {
        const errJson = await response.json().catch(() => null);
        const errObj = errJson?.error || errJson;
        console.warn('Backend price-preview error:', response.status, errObj);
        throw new BookingApiError(
          errObj?.code || 'PRICE_PREVIEW_FAILED',
          errObj?.message || 'Không thể lấy báo giá từ máy chủ',
          errObj?.details,
        );
      }
    } catch (err) {
      if (err instanceof BookingApiError) {
        throw err;
      }
      console.warn('Backend price-preview call failed:', err);
      throw new BookingApiError('NETWORK_ERROR', 'Không thể kết nối đến máy chủ tính giá');
    }
  }

  // Fallback to local computation
  const connector =
    options?.connector ??
    (await getConnectorById(connectorId)) ??
    connectorsMock.find((c) => c.id === connectorId);
  if (!connector) return null;
  const localQuote = quoteBooking(connector, startAt, durationMin, options?.priceRanges);
  const endAt = new Date(new Date(startAt).getTime() + durationMin * 60_000).toISOString();

  return {
    pricingVersion: `mock-pv-${String(Date.now()).slice(-8)}`,
    connectorId,
    startAt,
    endAt,
    durationMin,
    currency: 'VND',
    totalAmount: localQuote.totalPrice,
    priceLines: localQuote.priceLines.map((l, index) => ({
      sequence: index + 1,
      startAt: l.fromAt,
      endAt: l.toAt,
      durationMin: Math.round((new Date(l.toAt).getTime() - new Date(l.fromAt).getTime()) / 60_000),
      label: l.rateKind,
      periodCode: l.rateKind,
      rateVndPerKwh: l.rateVndPerKwh,
      estimatedEnergyKwh: l.energyKwh,
      amount: l.amount,
    })),
    pricingBasis: {
      kind: 'ESTIMATED_ENERGY_FIXED_PACKAGE',
      rateUnit: 'VND_PER_KWH',
      formulaVersion: 'booking-estimate-v1',
      energyFactor: 0.62,
      powerKw: connector.powerKw,
    },
    overlapWarnings: [],
  };
}

/**
 * Price a candidate window before the booking exists, so the picker and the
 * confirmation screen can show the same figures the booking will snapshot.
 */
export async function quoteRange(
  connectorId: string,
  startAt: string,
  durationMin: number,
): Promise<Quote | null> {
  const connector = connectorsMock.find((c) => c.id === connectorId);
  if (!connector) return simulateNetwork(null, 0);
  return simulateNetwork(quoteBooking(connector, startAt, durationMin), 0);
}

/**
 * Active bookings the driver already holds that overlap a candidate window.
 * Drives the non-blocking BR-BOK-08 warning — overlapping bookings on different
 * connectors are permitted, the driver just gets told before confirming.
 */
export async function findOverlappingBookings(
  startAt: string,
  endAt: string,
  excludeConnectorId?: string,
): Promise<Booking[]> {
  reconcileLapsed();
  const live = new Set(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHARGING']);
  const overlapping = store.filter(
    (b) =>
      live.has(b.status) &&
      b.connectorId !== excludeConnectorId &&
      rangesOverlap(startAt, endAt, b.startAt, b.endAt),
  );
  return simulateNetwork(overlapping, 0);
}

export interface CreateBookingOptions {
  idempotencyKey?: string;
  accessToken?: string | null;
  station?: Station | null;
  connector?: Connector | null;
  chargePoint?: ChargePoint | null;
  priceLines?: BookingPriceLine[];
}

export async function createBooking(
  req: CreateBookingRequest,
  options?: CreateBookingOptions,
): Promise<Booking> {
  if (!isMockMode()) {
    const token = resolveAccessToken(options?.accessToken);
    const key = options?.idempotencyKey || generateIdempotencyKey();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Idempotency-Key': key,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (typeof req.acceptedTotalAmount !== 'number' || isNaN(req.acceptedTotalAmount) || req.acceptedTotalAmount < 0) {
      throw new BookingApiError(
        'SYS_003',
        'Tổng tiền thanh toán không hợp lệ hoặc chưa được tính toán từ máy chủ',
        { acceptedTotalAmount: 'NotNull' },
      );
    }
    if (!req.acceptedPricingVersion || !/^[0-9a-f]{64}$/.test(req.acceptedPricingVersion)) {
      throw new BookingApiError(
        'SYS_003',
        'Phiên bản giá không hợp lệ từ máy chủ. Vui lòng tải lại báo giá.',
        { acceptedPricingVersion: 'Pattern' },
      );
    }

    const body = {
      connectorId: req.connectorId,
      startAt: req.startAt,
      durationMin: req.durationMin,
      acceptedTotalAmount: req.acceptedTotalAmount,
      acceptedPricingVersion: req.acceptedPricingVersion,
      acceptedPolicyVersion: req.acceptedPolicyVersion,
      paymentMethod: req.paymentMethod,
    };

    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}/api/v1/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.warn('Network error calling POST /api/v1/bookings:', err);
      throw new BookingApiError('NETWORK_ERROR', 'Lỗi kết nối mạng khi tạo lượt đặt');
    }

    if (response.status === 409) {
      const errJson = await response.json().catch(() => null);
      const errObj = errJson?.error || errJson;
      const code = errObj?.code || errObj?.errorCode || 'PRICE_CHANGED';
      const message = errObj?.message;
      const details = errObj?.details;
      const messageKey = errObj?.messageKey;
      const latestPricePreview: BackendPricePreviewResponse | undefined =
        errJson?.data?.latestPricePreview ||
        errJson?.details?.latestPricePreview ||
        errJson?.error?.details?.latestPricePreview;

      if ((code === 'PRICE_CHANGED' || code === 'BKG_PRICE_CHANGED') && latestPricePreview) {
        throw new PriceChangedError(latestPricePreview);
      }
      throw new BookingApiError(code, message, details, messageKey);
    }

    if (response.status === 401 || response.status === 403) {
      throw new BookingApiError('UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn hoặc không có quyền thực hiện');
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const errObj = errJson?.error || errJson;
      const code = errObj?.code || errObj?.errorCode || 'GENERIC';
      const message = errObj?.message;
      const details = errObj?.details;
      const messageKey = errObj?.messageKey;
      throw new BookingApiError(code, message, details, messageKey);
    }

    const payload = await response.json();
    const data: BackendCreateBookingResponse = payload?.data ?? payload;

    const connector =
      options?.connector ??
      (await getConnectorById(req.connectorId)) ??
      connectorsMock.find((c) => c.id === req.connectorId);
    const chargePoint =
      options?.chargePoint ??
      chargePointsMock.find((cp) => cp.id === connector?.chargePointId);
    const station =
      options?.station ??
      (await getStationById(req.stationId)) ??
      stationsMock.find((s) => s.id === req.stationId);

    const endAt =
      data.endAt ??
      new Date(new Date(req.startAt).getTime() + req.durationMin * 60_000).toISOString();

    const createdBooking: Booking = {
      id: data.bookingId,
      code: data.bookingCode ?? `CHG-${data.bookingId.slice(0, 4).toUpperCase()}`,
      stationId: req.stationId,
      stationName: station?.name ?? '',
      stationAddress: station?.address ?? '',
      stationImageUrl: station?.imageUrl,
      connectorId: req.connectorId,
      connectorName: connector?.name ?? '',
      chargePointName: chargePoint?.name ?? '',
      zoneLabel: chargePoint?.zoneLabel ?? null,
      connectorType: connector?.connectorType ?? 'CCS2',
      powerKw: connector?.powerKw ?? 0,
      startAt: data.startAt ?? req.startAt,
      endAt,
      durationMin: data.durationMin ?? req.durationMin,
      priceLines: options?.priceLines ?? [],
      energyKwh: options?.priceLines?.reduce((sum, l) => sum + (l.energyKwh || 0), 0) ?? 0,
      chargingFee: data.totalAmount,
      serviceFee: 0,
      totalPrice: data.totalAmount,
      paymentMethod: (data.payment?.method as PaymentMethod) ?? req.paymentMethod,
      status: data.status ?? 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: data.paymentHoldExpiresAt ?? null,
    };

    const existingIdx = store.findIndex((b) => b.id === createdBooking.id);
    if (existingIdx >= 0) {
      store[existingIdx] = createdBooking;
    } else {
      store.unshift(createdBooking);
    }

    return createdBooking;
  }

  // Simulated edge cases first (mock only): the range was taken by someone else
  // between picking and paying, or the request failed to reach the server.
  // LATER: these become real 409 / network errors from POST /bookings.
  const outcome = resolveBookingOutcome();
  if (outcome === 'RANGE_TAKEN') {
    await simulateNetwork(null, 600);
    throw new Error('RANGE_TAKEN' satisfies BookingErrorCode);
  }
  if (outcome === 'NETWORK_ERROR') {
    await simulateNetwork(null, 600);
    throw new Error('NETWORK_ERROR' satisfies BookingErrorCode);
  }

  // NOW: build a PENDING booking (payment not settled yet), snapshotting the
  // station/connector details and the TOU price lines, and push it to the store.
  // The booking only becomes CONFIRMED once the payment gateway confirms — see
  // confirmPayment(). LATER: POST /bookings -> server returns PENDING.
  const connector = connectorsMock.find((c) => c.id === req.connectorId);
  const chargePoint = chargePointsMock.find((cp) => cp.id === connector?.chargePointId);
  const station = stationsMock.find((s) => s.id === req.stationId);
  const quote = connector
    ? quoteBooking(connector, req.startAt, req.durationMin, req.backendPriceRanges)
    : null;
  const now = Date.now();
  const endAt = new Date(new Date(req.startAt).getTime() + req.durationMin * 60_000).toISOString();

  const booking: Booking = {
    id: `bk-${now}`,
    code: `CHG-${String(now).slice(-4)}`,
    stationId: req.stationId,
    stationName: station?.name ?? '',
    stationAddress: station?.address ?? '',
    stationImageUrl: station?.imageUrl,
    connectorId: req.connectorId,
    connectorName: connector?.name ?? '',
    chargePointName: chargePoint?.name ?? '',
    zoneLabel: chargePoint?.zoneLabel ?? null,
    connectorType: connector?.connectorType ?? 'CCS2',
    powerKw: connector?.powerKw ?? 0,
    startAt: req.startAt,
    endAt,
    durationMin: req.durationMin,
    priceLines: quote?.priceLines ?? [],
    energyKwh: quote?.energyKwh ?? 0,
    chargingFee: quote?.chargingFee ?? 0,
    serviceFee: SERVICE_FEE,
    totalPrice: quote?.totalPrice ?? SERVICE_FEE,
    paymentMethod: req.paymentMethod,
    status: 'PENDING', // awaiting payment confirmation
    createdAt: new Date(now).toISOString(),
    // The range is held, not booked, until payment lands (BR-BOK-02).
    expiresAt: new Date(now + PAYMENT_HOLD_MIN * 60_000).toISOString(),
  };

  store.unshift(booking);
  return simulateNetwork(booking);
}

/**
 * Settle the payment for a pending booking. Resolves to a PaymentResult whose
 * `status` covers every gateway outcome:
 *  - SUCCESS   -> booking becomes CONFIRMED and the hold is lifted
 *  - FAILED    -> declined / insufficient funds; booking stays PENDING (retryable
 *                 within the hold window — BR-PAY-04)
 *  - TIMEOUT   -> no gateway response; booking stays PENDING (retryable)
 *  - CANCELLED -> user aborted at the gateway; booking becomes CANCELLED
 * NOW: outcome is driven by the demo simulator. LATER: poll GET /bookings/:id or
 * handle the gateway webhook / return URL — same PaymentResult shape.
 */
export async function confirmPayment(id: string): Promise<PaymentResult> {
  const status = resolvePaymentOutcome();
  reconcileLapsed();
  const booking = store.find((b) => b.id === id) ?? null;

  if (booking && booking.status === 'PENDING') {
    if (status === 'SUCCESS') {
      booking.status = 'CONFIRMED';
      booking.expiresAt = null; // paid: the range is now firmly the driver's
    } else if (status === 'CANCELLED') {
      booking.status = 'CANCELLED';
      booking.cancelReason = 'DRIVER';
      booking.refundPercent = 0;
      booking.refundAmount = 0;
      booking.expiresAt = null;
    }
    // FAILED / TIMEOUT leave it PENDING so the user can retry before expiry.
  }

  return simulateNetwork({ status, booking }, 2200);
}

export async function cancelBooking(id: string): Promise<Booking | null> {
  // NOW: compute the refund (FR08 tiers incl. the grace-period override) for
  // paid bookings, store it, flip the status. A still-unpaid (PENDING) booking
  // refunds nothing — no money moved.
  // LATER: POST /bookings/:id/cancel -> backend computes + disburses the refund.
  const booking = store.find((b) => b.id === id);
  if (booking) {
    const breakdown = computeRefund(booking);
    const paid = booking.status === 'CONFIRMED';
    booking.refundPercent = paid ? breakdown.percent : 0;
    booking.refundAmount = paid ? breakdown.refundAmount : 0;
    booking.status = 'CANCELLED';
    booking.cancelReason = 'DRIVER';
    booking.expiresAt = null;
  }
  return simulateNetwork(booking ?? null);
}

// --- QR check-in (FR07) ---

/**
 * Why a scan did not produce a check-in. FR07 requires the app to tell these
 * apart rather than showing one generic failure — a driver who arrived early
 * needs different advice from one who scanned the wrong port.
 */
export type CheckInErrorCode =
  | 'UNKNOWN_QR' // the payload isn't one of our connectors
  | 'NO_BOOKING' // no booking of the driver's on this connector, now
  | 'WRONG_CONNECTOR' // they do have a booking now, but on a different port
  | 'TOO_EARLY' // scanned before the slot start time
  | 'WINDOW_EXPIRED'; // more than 15 minutes after the start

export type CheckInResolution =
  | { ok: true; booking: Booking; connector: Connector }
  | {
      ok: false;
      code: CheckInErrorCode;
      connector: Connector | null;
      /** The booking that explains the failure, when there is one (early / expired / wrong port). */
      booking?: Booking;
      /** Minutes until check-in opens, for TOO_EARLY. */
      minutesUntilOpen?: number;
    };

/**
 * Validate a scanned QR without changing anything (FR07 step 1). The driver then
 * sees a confirmation screen and taps to commit — `confirmCheckIn` does the
 * state transition. Splitting it this way means a stray scan never silently
 * checks someone in.
 */
export async function resolveCheckIn(qrToken: string): Promise<CheckInResolution> {
  reconcileLapsed();
  const now = Date.now();
  const token = qrToken.trim();
  let connector =
    connectorsMock.find((c) => c.qrToken === token) ??
    connectorsMock.find((c) => c.id.toLowerCase() === token.toLowerCase()) ??
    null;

  // If token is a dynamic challenge token (UUID or chk_... generated by Simulator), resolve it to matching booking/connector
  if (!connector && (token.includes('-') || token.startsWith('chk_') || token.length >= 16)) {
    const activeBooking = store.find((b) => b.status === 'CONFIRMED');
    if (activeBooking) {
      connector = connectorsMock.find((c) => c.id === activeBooking.connectorId) ?? connectorsMock[0];
    } else {
      connector = connectorsMock[0];
    }
  }

  if (!connector) return simulateNetwork({ ok: false as const, code: 'UNKNOWN_QR' as const, connector: null }, 400);

  const inWindow = (b: Booking) => {
    const start = new Date(b.startAt).getTime();
    return now >= start && now <= start + CHECK_IN_WINDOW_MIN * 60_000;
  };

  const onThisConnector = store.filter(
    (b) => b.connectorId === connector.id && b.status === 'CONFIRMED',
  );
  const match = onThisConnector.find(inWindow);
  if (match) return simulateNetwork({ ok: true as const, booking: match, connector }, 400);

  // Same port, wrong time — say which way they got it wrong.
  const soonest = [...onThisConnector].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )[0];
  if (soonest) {
    const start = new Date(soonest.startAt).getTime();
    if (now < start) {
      return simulateNetwork(
        {
          ok: false as const,
          code: 'TOO_EARLY' as const,
          connector,
          booking: soonest,
          minutesUntilOpen: Math.ceil((start - now) / 60_000),
        },
        400,
      );
    }
    return simulateNetwork(
      { ok: false as const, code: 'WINDOW_EXPIRED' as const, connector, booking: soonest },
      400,
    );
  }

  // Right time, wrong port — point them at the one they actually booked.
  const elsewhere = store.find((b) => b.status === 'CONFIRMED' && inWindow(b));
  if (elsewhere) {
    return simulateNetwork(
      { ok: false as const, code: 'WRONG_CONNECTOR' as const, connector, booking: elsewhere },
      400,
    );
  }

  return simulateNetwork({ ok: false as const, code: 'NO_BOOKING' as const, connector }, 400);
}

/** Commit the check-in the driver just confirmed: CONFIRMED -> CHECKED_IN (FR07). */
export async function confirmCheckIn(bookingId: string): Promise<Booking | null> {
  // NOW: flip the status. LATER: POST /bookings/:id/check-in
  const booking = store.find((b) => b.id === bookingId);
  if (booking && booking.status === 'CONFIRMED') {
    booking.status = 'CHECKED_IN';
    booking.checkedInAt = new Date().toISOString();
  }
  return simulateNetwork(booking ?? null);
}

/** Driver started charging: CHECKED_IN -> CHARGING. */
export async function startCharging(id: string): Promise<Booking | null> {
  const booking = store.find((b) => b.id === id);
  if (booking && booking.status === 'CHECKED_IN') booking.status = 'CHARGING';
  return simulateNetwork(booking ?? null);
}

export async function completeBooking(id: string): Promise<Booking | null> {
  // NOW: mark COMPLETED at the end of a charging session; the remaining time is
  // released for new bookings (BR-BOK-07).
  // LATER: POST /bookings/:id/complete
  const booking = store.find((b) => b.id === id);
  if (booking) booking.status = 'COMPLETED';
  return simulateNetwork(booking ?? null);
}
