/**
 * Domain model shared by every console app.
 * Mirrors the SRS entities and the backend's (future) REST DTOs — the mock and
 * REST service implementations both return these exact shapes, so swapping the
 * data source never touches UI code.
 */

/* ---------- shared ---------- */

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ConnectorType = 'CCS2' | 'CHAdeMO' | 'Type2AC' | 'GBT';
export type PaymentMethod = 'VNPAY' | 'MOMO' | 'ATM';

/* ---------- bookings ---------- */

export type BookingStatus =
  | 'pending'      // Chờ thanh toán (held max 10 min — POL-05)
  | 'confirmed'    // Đã xác nhận (payment captured)
  | 'checkedin'    // Đã check-in (QR scanned within 15-min window — POL-03)
  | 'charging'     // Đang sạc
  | 'completed'    // Hoàn tất
  | 'cancelled';   // Đã hủy (refund per BR-PAY-03)

export type RateKind = 'peak' | 'standard' | 'offpeak';

/**
 * One TOU rate segment of a booking's window, snapshotted at booking time
 * (SRS BookingPriceLine). A booking that crosses a rate boundary — say
 * 16:30–18:30 spanning standard into peak — carries one line per band, which is
 * why the total cannot be re-derived from a single rate. Never recalculated:
 * later pricing edits apply to new bookings only (BR-STA-03).
 */
export interface BookingPriceLine {
  /** ISO datetimes bounding this segment within the booking window. */
  fromAt: string;
  toAt: string;
  rateKind: RateKind;
  rateVndPerKwh: number;
  energyKwh: number;
  amountVnd: number;
}

/** Fat/denormalized on purpose: price + names are snapshots taken at booking time (BookingPriceLine). */
export interface Booking {
  id: string;
  stationId: string;
  stationName: string;
  ownerName: string;
  /** The Connector booked (legacy "Charger ID" glossary term — see Connector.id). */
  connectorId: string;
  connector: ConnectorType;
  powerKw: number;
  driverName: string;
  driverPhone: string;
  /** ISO datetime the booking was created — anchors the FR08 grace-period window. */
  createdAt: string;
  /**
   * ISO datetime the unpaid reservation lapses (createdAt + 10 min, BR-BOK-02).
   * Null once the booking leaves Pending Payment — the hold no longer applies.
   */
  expiresAt: string | null;
  /** ISO datetimes. */
  startAt: string;
  endAt: string;
  durationMin: number;
  /** Dominant band, kept for list/filter display; `priceLines` is authoritative for the total. */
  rateKind: RateKind;
  rateVndPerKwh: number;
  energyKwh: number;
  amountVnd: number;
  /** Per-band snapshots; one entry unless the window crosses a TOU boundary. */
  priceLines: BookingPriceLine[];
  /**
   * BR-PAY-03 refund tiers, evaluated at cancel moment: 100 if cancelled within 5 min of
   * `createdAt` (grace period, FR08 override — takes priority regardless of time-before-start),
   * else 100 / 50 / 0 by time remaining before slot start (>=60min / 15-60min / <15min).
   * Null unless cancelled.
   */
  refundPct: number | null;
  refundVnd: number;
  method: PaymentMethod;
  status: BookingStatus;
}

/** Which field a booking search matches against. */
export type BookingSearchField = 'all' | 'id' | 'driver' | 'connector' | 'station';

export interface BookingListParams {
  /** Owner console is implicitly scoped server-side by token; admin sees all. */
  status?: BookingStatus | 'all';
  search?: string;
  /** Restrict the search to one field (default: all). */
  searchIn?: BookingSearchField;
  page?: number;
  pageSize?: number;
}

export interface BookingSummary {
  total: number;
  byStatus: Record<BookingStatus, number>;
  grossVnd: number;
  refundedVnd: number;
}

/* ---------- charge points & connectors (FR10, FR14) ---------- */

/**
 * Charge Point lifecycle (FR14 provisioning table). Admin owns UNCLAIMED→ACTIVE and
 * SUSPENDED; owner/staff may toggle ACTIVE<->OFFLINE (e.g. for maintenance — a reason,
 * not a separate stored state).
 */
export type ProvisioningStatus = 'unclaimed' | 'active' | 'offline' | 'suspended';

/**
 * Connector runtime status (FR07). AVAILABLE<->IN_USE is system-driven by check-in /
 * session-complete; owner/staff may independently toggle a specific connector to OFFLINE
 * (BR-CHG-05) even while its Charge Point is ACTIVE.
 */
export type ConnectorRuntimeStatus = 'available' | 'inuse' | 'offline';

/** The physical device. Bookings never attach here directly — only to its Connectors. */
export interface ChargePoint {
  id: string;
  stationId: string;
  /** Owner-editable display name. */
  name: string;
  /** Free-text location hint shown to drivers, e.g. "near the entrance, row B" (FR10). */
  zoneLabel: string | null;
  /** Display-only aggregate; not an enforced booking constraint (BR-CHG-06). */
  maxPowerKw: number;
  status: ProvisioningStatus;
}

/**
 * The bookable unit (FR05, FR07). Hardware attributes (connectorType, powerKw) are
 * admin-provisioned and locked after provisioning (BR-CHG-03) — read-only for owners.
 * `id` is what the SRS glossary calls "Charger ID": encoded in this Connector's printed
 * QR code, despite the legacy name.
 */
export interface Connector {
  id: string;
  chargePointId: string;
  name: string;
  connectorType: ConnectorType;
  powerKw: number;
  runtimeStatus: ConnectorRuntimeStatus;
  /** Static QR payload — never changes after provisioning (BR-CHG-04). */
  qrToken: string;
  utilizationPct: number;
  sessionsToday: number;
  uptime30dPct: number;
  kwhToday: number;
  faultCount: number;
  lastSeen: string;
}

/* ---------- location (administrative units) ---------- */

export interface AdministrativeProvince {
  code: string;
  name: string;
  fullName: string;
}

export interface AdministrativeWard {
  code: string;
  provinceCode: string;
  name: string;
  fullName: string;
}

/* ---------- stations ---------- */

export type StationStatus =
  | 'active'
  | 'pending'
  | 'rejected'
  | 'suspended'
  | 'withdrawn'
  | 'ACTIVE'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'WITHDRAWN';

export interface LicenseSummary {
  id?: string;
  plan: 'MONTHLY' | 'YEARLY' | string;
  status?: LicenseStatus;
  startAt?: string | null;
  expiresAt?: string | null;
  daysLeft?: number;
}

export type DriverEligibilityReason =
  | 'STATION_NOT_ACTIVE'
  | 'LICENSE_MISSING'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_SUSPENDED'
  | 'LICENSE_CANCELLED'
  | 'LICENSE_NOT_STARTED';

export interface StationDriverEligibility {
  isEligible: boolean;
  reason?: DriverEligibilityReason;
  label: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

export interface StationAsset {
  assetType: 'IMAGE' | 'DOCUMENT' | string;
  assetUrl: string;
  isPrimary?: boolean;
  storageKey?: string;
  displayOrder?: number;
  altText?: string;
}

export interface Station {
  id: string;
  stationCode?: string;
  name: string;
  city?: string;
  provinceName?: string;
  wardName?: string;
  address?: string;
  addressLine?: string;
  ownerName?: string;
  ownerDisplayName?: string;
  chargerCount?: number;
  plannedChargePointCount?: number;
  onlineCount?: number;
  status: StationStatus;
  /** e.g. "Năm · hết hạn 12/09/2026", or object { plan, expiresAt }; null while pending/rejected. */
  licenseSummary?: string | LicenseSummary | null;
  licenseSubmitted?: boolean;
  rejectionReason?: string | null;
  bookingsToday?: number;
  revenueWeekVnd?: number;
  utilizationPct?: number;
  /** ISO date the registration was submitted (approval queue). */
  submittedAt?: string | null;
  /** Owner-advertised amenities shown to drivers (FR10-adjacent, owner self-service). */
  amenities?: Amenity[];
  assets?: StationAsset[];
}

export interface OwnerStationSummary {
  id: string;
  stationCode: string;
  name: string;
  addressLine: string;
  provinceName: string;
  wardName: string;
  plannedChargePointCount: number;
  status: StationStatus;
  licenseSummary?: string | LicenseSummary | null;
}

export interface StationApprovalSummary {
  id: string;
  stationCode: string;
  name: string;
  ownerDisplayName: string;
  provinceName: string;
  plannedChargePointCount: number;
  submittedAt: string;
  ownerName?: string;
  city?: string;
  chargerCount?: number;
}

export type StationStatusEventType =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMITTED'
  | 'SUSPENDED'
  | 'REACTIVATED'
  | 'WITHDRAWN';

export interface StationStatusHistory {
  id: string;
  stationId: string;
  stationCode?: string;
  stationName?: string;
  eventType: StationStatusEventType;
  fromStatus?: StationStatus | null;
  toStatus: StationStatus;
  reason?: string | null;
  performedById?: string;
  performedByName: string;
  performedByEmail?: string;
  performedByRole?: string;
  performedAt: string;
}

export interface StationApprovalDetail {
  id: string;
  stationCode: string;
  name: string;
  ownerDisplayName: string;
  provinceName: string;
  wardName?: string;
  addressLine?: string;
  plannedChargePointCount: number;
  status: StationStatus;
  submittedAt: string;
  licenseSubmitted?: boolean;
  assets?: StationAsset[];
  ownerName?: string;
  city?: string;
  address?: string;
  chargerCount?: number;
}

export interface StationCreatedResponse {
  id: string;
  stationCode: string;
  name: string;
  status: StationStatus;
  submittedAt: string;
}

/* ---------- amenities (owner-managed) ---------- */

/**
 * Amenities an owner can advertise on their station. Owners toggle these
 * themselves — they don't ask an admin — and the set flows to the driver app's
 * station detail page.
 */
export type Amenity =
  | 'wifi'
  | 'food'
  | 'coffee'
  | 'parking'
  | 'security'
  | 'restroom'
  | 'lounge'
  | 'atm'
  | 'carwash'
  | 'shop';

/** The full catalogue an owner can pick from, in display order. */
export const AMENITY_CATALOG: readonly Amenity[] = [
  'wifi',
  'food',
  'coffee',
  'parking',
  'security',
  'restroom',
  'lounge',
  'atm',
  'carwash',
  'shop',
];

/** Emoji glyph per amenity — the UI kit has no amenity-specific icons. */
export const AMENITY_EMOJI: Record<Amenity, string> = {
  wifi: '📶',
  food: '🍜',
  coffee: '☕',
  parking: '🅿️',
  security: '🛡️',
  restroom: '🚻',
  lounge: '🛋️',
  atm: '🏧',
  carwash: '🚿',
  shop: '🛍️',
};

export interface RegisterStationRequest {
  name: string;
  addressLine: string;
  description?: string;
  provinceCode: string;
  wardCode: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  plannedChargePointCount: number;
  /** @deprecated Backward-compatible alias for addressLine */
  address?: string;
  /** @deprecated Backward-compatible alias for provinceName / city */
  city?: string;
  /** @deprecated Backward-compatible alias for plannedChargePointCount */
  plannedChargers?: number;
}

export interface StationRegistration extends RegisterStationRequest {}

/* ---------- licenses ---------- */

export type LicenseStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'active'
  | 'expiring'
  | 'expired';

export type LicensePlan = 'MONTHLY' | 'YEARLY' | 'monthly' | 'yearly';

export interface License {
  id: string;
  stationId: string;
  stationName?: string;
  ownerName?: string;
  plan: LicensePlan;
  feeAmount: number;
  startAt: string;
  expiresAt: string;
  status: LicenseStatus;
  createdAt?: string;
  recordedByName?: string;
  daysLeft?: number;
  expiringSoon?: boolean;
  startDate?: string;
  expiryDate?: string;
  priceVnd?: number;
}

export interface IssueLicenseRequest {
  plan: 'MONTHLY' | 'YEARLY';
  feeAmount: number;
}

export interface RenewLicenseRequest {
  plan: 'MONTHLY' | 'YEARLY';
  feeAmount: number;
}

/* ---------- users ---------- */

export type UserRole = 'DRIVER' | 'OWNER' | 'ADMIN';
export type UserStatus = 'active' | 'suspended';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joined: string;
  bookingCount: number;
  status: UserStatus;
}

/* ---------- station staff (FR17) ---------- */

/**
 * A STATION_STAFF grant, scoped to one station. Mirrors the SRS StationStaff
 * join entity (user_id + station_id composite key) with the display fields the
 * console needs denormalized onto it.
 *
 * Roles are additive (BR-ACC-01): `primaryRole` is what the account registered
 * as — usually DRIVER — and STATION_STAFF sits on top of it. Revoking deletes
 * this assignment only, never the account or any other role it holds.
 */
export interface StationStaffMember {
  userId: string;
  stationId: string;
  stationName: string;
  name: string;
  email: string;
  primaryRole: UserRole;
  /** True when the invite provisioned a brand-new account rather than granting to an existing one. */
  provisioned: boolean;
  /** ISO date the assignment was created. */
  createdAt: string;
}

/* ---------- transactions ---------- */

export type TransactionType = 'payment' | 'refund';

export interface Transaction {
  id: string;
  bookingId: string;
  stationName: string;
  type: TransactionType;
  method: PaymentMethod;
  amountVnd: number;
  date: string;
}

export interface MethodBreakdown {
  method: PaymentMethod;
  totalVnd: number;
  pct: number;
}

export interface DailyRevenuePoint {
  /** Day-of-month label. */
  day: number;
  vnd: number;
}

export interface TransactionSummary {
  grossVnd: number;
  refundedVnd: number;
  netVnd: number;
  avgVnd: number;
  payCount: number;
  refundCount: number;
  methodBreakdown: MethodBreakdown[];
  dailyTrend: DailyRevenuePoint[];
}

/* ---------- pricing & hours (FR11) ---------- */

/** One day's operating window. open/close are "HH:mm"; ignored when closed. */
export interface OperatingHour {
  day: string; // T2..CN
  open: string;
  close: string;
  open24: boolean; // false ⇒ closed that day
}

export type TouDays = 'daily' | 'weekdays' | 'weekends';

/** Time-of-use pricing window whose rate a booking snapshots at booking time. */
export interface TouRule {
  id: string;
  name: string;
  days: TouDays;
  from: string; // "HH:mm"
  to: string;
  rateVnd: number; // per kWh
}

export interface AvailabilityRules {
  /** Auto-lock a slot 15 min after start if the driver hasn't checked in (POL-04). */
  autoLock: boolean;
  /** How many days ahead a driver may book. */
  maxAdvanceDays: number;
  /** −10% for the 00:00–05:00 window. */
  nightDiscount: boolean;
}

export interface PricingConfig {
  /**
   * Shortest window a driver may book, and the increment they step in
   * (30 | 60 | 90). Not a pre-generated slot: FR05 has the driver pick a start
   * time plus a duration, and the booking stores that range itself — the system
   * never materialises fixed slots to hand out.
   */
  minBookingDurationMin: number;
  basePriceVnd: number; // per kWh, applies to any window without a TOU rule
  hours: OperatingHour[];
  touRules: TouRule[];
  availability: AvailabilityRules;
}

/* ---------- policy KB (FR15) ---------- */

export interface PolicyDoc {
  id: string;
  category: string;
  content: string;
  updatedAt: string;
}

export interface AssistantAnswer {
  text: string;
  /** Policy doc ids the RAG answer was grounded on. */
  sources: string[];
}

/* ---------- support tickets (FR-cross-cutting) ---------- */

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/**
 * FR16 categories. Also the routing key (BR-TKT-01): CHARGING_ISSUE and
 * station-linked BOOKING tickets go to that station's Owner/Staff; PAYMENT,
 * ACCOUNT and OTHER go to Admin.
 */
export type TicketCategory =
  | 'charging_issue'
  | 'booking'
  | 'payment'
  | 'account'
  | 'other';

/** Categories an Owner/Staff console may see, provided the ticket is station-linked. */
export const STATION_SCOPED_CATEGORIES: readonly TicketCategory[] = ['charging_issue', 'booking'];

export type TicketAuthorRole = 'driver' | 'station_staff' | 'station_owner' | 'platform_admin';

/** Append-only — no edit/delete once posted. */
export interface TicketMessage {
  id: string;
  ticketId: string;
  authorName: string;
  authorRole: TicketAuthorRole;
  body: string;
  createdAt: string; // ISO
}

/** Linked context (station/booking) is shown in the detail header when present. */
export interface Ticket {
  id: string;
  /** Human-readable reference quoted to the reporter, alongside the system id (FR16). */
  ticketNo: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  stationId: string | null;
  stationName: string | null;
  bookingId: string | null;
  reporterName: string;
  reporterPhone: string | null;
  /** null = unassigned. */
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
  messageCount: number;
}

export interface TicketListParams {
  /** Owner/staff console is implicitly scoped server-side by token; admin sees all. */
  status?: TicketStatus | 'all';
  category?: TicketCategory | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TicketSummary {
  total: number;
  byStatus: Record<TicketStatus, number>;
}

/* ---------- dashboards ---------- */

/**
 * Ops-only — deliberately has NO revenue/license/analytics fields. Station
 * staff hit a separate endpoint with a separate DTO from OwnerDashboard so
 * there is nothing financial in the payload to leak via devtools, regardless
 * of what the UI chooses to render (see RoleRouter / RequireRole notes).
 */
/** A Connector joined with its Charge Point's zoneLabel — dashboards show connectors (the runtime unit), scoped by location hint. */
export interface DashboardConnectorRow {
  id: string;
  name: string;
  zoneLabel: string | null;
  runtimeStatus: ConnectorRuntimeStatus;
}

export interface StaffDashboard {
  kpis: {
    bookingsToday: number;
    bookingsDelta: number;
    chargersOnline: number;
    chargersTotal: number;
    offlineChargerNote: string | null;
    openTickets: number;
    pendingCheckins: number;
  };
  chargers: DashboardConnectorRow[];
  upcomingBookings: { id: string; startTime: string; driverName: string; connectorId: string }[];
  recentTickets: Pick<Ticket, 'id' | 'subject' | 'status' | 'updatedAt'>[];
}

export interface OwnerDashboard {
  license: { status: LicenseStatus; expiryDate: string; daysLeft: number };
  kpis: {
    bookingsToday: number;
    bookingsDelta: number;
    revenueTodayVnd: number;
    revenueDeltaPct: number;
    chargersOnline: number;
    chargersTotal: number;
    offlineChargerNote: string | null;
    avgUtilizationPct: number;
    utilizationDeltaPts: number;
  };
  chargers: (DashboardConnectorRow & Pick<Connector, 'utilizationPct'>)[];
  upcomingBookings: { id: string; startTime: string; driverName: string }[];
}

export interface AnalyticsKpi {
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
}

export interface AnalyticsOverview {
  kpis: AnalyticsKpi[];
  /** 12 monthly revenue points (oldest first). */
  revenueTrend: { month: string; vnd: number }[];
  topStations: { name: string; revenueVnd: number; pct: number }[];
  /** Average sessions per hour of day, 0..23. */
  peakHours: { hour: number; sessions: number }[];
  connectorMix: { connector: ConnectorType; pct: number }[];
}

export interface AdminDashboard {
  kpis: {
    activeStations: number;
    stationsDeltaWeek: number;
    pendingApprovals: number;
    newApprovalsToday: number;
    bookingsToday: number;
    bookingsDeltaPct: number;
    revenueMonthVnd: number;
    revenueDeltaPct: number;
  };
  actionQueue: {
    pendingStations: number;
    expiringLicenses: number;
    expiringDaysMin: number;
    expiredLicenses: number;
    reportedFaults: number;
  };
  topStations: { name: string; revenueVnd: number }[];
}
