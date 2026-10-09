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

export type ConnectorType = 'CCS2' | 'CHADEMO' | 'TYPE2' | 'GBT';
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
  /** ISO datetime the booking was created. */
  createdAt: string;
  /** ISO datetime of the first server payment confirmation. */
  paymentConfirmedAt?: string | null;
  /**
   * ISO datetime of the snapshotted free cancellation deadline: min(paymentConfirmedAt + 10m, startAt).
   * Null while pending or if not eligible.
   */
  freeCancellationDeadline?: string | null;
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
   * BR-PAY-03 refund tiers (Booking v4.9): 100% within the 10-minute grace period from
   * payment confirmation (strictly before freeCancellationDeadline and not checked in),
   * else 0% (outside grace or no-show). Null unless cancelled.
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

/* ---------- BKG-047 / FE-15 Owner Bookings Contract ---------- */

export type ApiBookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHARGING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type CancellationReason =
  | 'DRIVER_CANCELLED'
  | 'NO_SHOW'
  | 'STATION_FAILURE';

export interface StationSnapshot {
  stationId: string;
  stationName: string;
  stationAddress: string;
  chargePointCode: string;
  connectorId: string;
  connectorCode: string;
}

export type PeriodCode = 'NORMAL' | 'PEAK' | 'OFF_PEAK';

export interface PriceLine {
  sequence: number;
  startAt: string;
  endAt: string;
  durationMin: number;
  label: string;
  periodCode: PeriodCode;
  rateVndPerKwh: number;
  estimatedEnergyKwh: number;
  amount: number;
}

export interface PriceBasis {
  kind: 'ESTIMATED_ENERGY_FIXED_PACKAGE';
  rateUnit: 'VND_PER_KWH';
  formulaVersion: string;
  energyFactor: number;
  powerKw: number;
  energyDecimalPlaces: number;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export interface Payment {
  paymentId: string;
  status: PaymentStatus;
  method: string;
  expectedAmount: number;
  collectedAmount: number;
  appliedToPackageAmount: number;
  packageRefundedAmount: number;
  excessAmount: number;
  unallocatedAmount: number;
  currency: 'VND';
}

export type CheckoutStatus =
  | 'NOT_CREATED'
  | 'READY'
  | 'UNAVAILABLE'
  | 'EXPIRED';

export interface Checkout {
  status: CheckoutStatus;
  method: string;
  expiresAt?: string;
  instruction?: string;
  checkoutReference?: string;
  checkoutUrl?: string;
}

export type RefundReason =
  | 'VOLUNTARY_GRACE'
  | 'STATION_FAILURE'
  | 'EXCESS_PAYMENT'
  | 'LATE_PAYMENT'
  | 'UNAPPLIED_PAYMENT';

export interface RefundSummary {
  refundId: string;
  amount: number;
  reason: RefundReason;
  status: RefundStatus;
  executionPolicy?: string;
  /** @deprecated Alias đồng giá trị với requiresOwnerAction; sẽ gỡ sau cutover. */
  requiresAdminAction?: boolean;
  requiresOwnerAction?: boolean;
}

export interface OwnerActions {
  canCancelForStationFailure: boolean;
  canAdmitStationFailure?: boolean;
  canViewFinancials: boolean;
  canReportIncident: boolean;
}

export interface OwnerBookingListItem {
  bookingId: string;
  bookingCode: string;
  status: ApiBookingStatus;
  persistedStatus: ApiBookingStatus;
  stateReconciliationPending: boolean;
  cancellationReason?: CancellationReason | null;
  stationId: string;
  stationName: string;
  connectorId: string;
  connectorCode: string;
  driverDisplayName: string;
  startAt: string;
  endAt: string;
  checkInDeadline?: string | null;
  checkedInAt?: string | null;
  totalAmount: number;
  currency: 'VND';
}

export interface OwnerBookingSummary {
  totalBookings: number;
  pending: number;
  confirmed: number;
  inSession: number;
  completed: number;
  cancelled: number;
  expired: number;
  noShow: number;
}

export interface OperationalBooking {
  bookingId: string;
  bookingCode: string;
  status: ApiBookingStatus;
  cancellationReason?: CancellationReason | null;
  stationId: string;
  connectorId: string;
  connectorCode: string;
  driverDisplayName: string;
  startAt: string;
  endAt: string;
  checkInDeadline: string;
  checkedInAt?: string | null;
}

export interface OwnerBookingDetail {
  bookingId: string;
  bookingCode: string;
  status: ApiBookingStatus;
  persistedStatus: ApiBookingStatus;
  stateReconciliationPending: boolean;
  cancellationReason?: CancellationReason | null;
  version: number;
  driverDisplayName: string;
  station: StationSnapshot;
  timezone: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  totalAmount: number;
  currency: 'VND';
  priceLines: PriceLine[];
  pricingBasis: PriceBasis;
  policyVersion: string;
  paymentHoldExpiresAt: string;
  paymentConfirmedAt?: string | null;
  freeCancellationDeadline?: string | null;
  checkInOpensAt: string;
  checkInDeadline: string;
  checkedInAt?: string | null;
  chargingStartedAt?: string | null;
  completedAt?: string | null;
  payment: Payment;
  checkout: Checkout;
  refunds: RefundSummary[];
  actions: OwnerActions;
  serviceFailureDecisions?: ServiceFailureDecisionSummary[];
}

export interface OwnerBookingFilter {
  stationId?: string;
  connectorId?: string;
  from?: string; // ISO Instant
  to?: string;   // ISO Instant
  status?: ApiBookingStatus;
}

export interface OwnerBookingListParams extends OwnerBookingFilter {
  page?: number;     // UI zero-based
  pageSize?: number; // UI page size
}

export interface OwnerActiveBookingParams {
  stationId: string;
  chargePointId?: string;
  connectorId?: string;
  page?: number;
  size?: number;
}


/* ---------- charge points & connectors (FR10, FR14) ---------- */

/**
 * Charge Point lifecycle (FR14 provisioning table). Admin owns PENDING_ACTIVATION→ACTIVE and
 * SUSPENDED; owner/staff may toggle AVAILABLE<->OFFLINE (e.g. for maintenance).
 */
export type ProvisioningStatus =
  | 'PENDING_ACTIVATION'
  | 'ACTIVE'
  | 'SUSPENDED';

export type OperationalChargePointStatus =
  | 'AVAILABLE'
  | 'OFFLINE'
  | 'MAINTENANCE';

export type ConnectorRuntimeStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'OFFLINE';

export type ChargerType = 'AC' | 'DC' | 'ac' | 'dc';

/** The physical device. Bookings never attach here directly — only to its Connectors. */
export interface ChargePoint {
  id: string;
  stationId: string;
  chargePointCode?: string;
  /** Neutral display label/location identifier; hardware facts belong to connectors. */
  name: string;
  /** Free-text location hint shown to drivers, e.g. "near the entrance, row B" (FR10). */
  zoneLabel: string | null;
  /** Derived as the highest connector power; not entered independently. */
  maxPowerKw: number;
  provisioningStatus: ProvisioningStatus;
  operationalStatus: OperationalChargePointStatus;
  createdAt?: string;
  connectors?: Connector[];
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
  connectorCode: string;
  chargePointCode?: string;
  chargePointName?: string;
  name?: string;
  connectorType: ConnectorType;
  powerKw: number;

  chargerType?: ChargerType;
  runtimeStatus: ConnectorRuntimeStatus;
  utilizationPct?: number;
  sessionsToday?: number;
  uptime30dPct?: number;
  kwhToday?: number;
  faultCount?: number;
  lastSeen?: string;
  createdAt?: string;
  activeIncidentId?: string | null;
}

export interface ConnectorProvisioningGroup {
  connectorType: ConnectorType;
  powerKw: number;
  quantity: number;
}

export type EquipmentStatusActorType = 'ADMIN' | 'OWNER' | 'SYSTEM';
export type ChargePointStatusDimension = 'PROVISIONING' | 'OPERATIONAL';

/**
 * Which incident action produced a `connector_status_events.reason` audit string
 * (`INCIDENT_REPORT:<id>`, `INCIDENT_RECOVER:<id>`, `INCIDENT_SESSION_STOP:<id>:<bookingId>`).
 */
export type IncidentAuditAction = 'INCIDENT_REPORT' | 'INCIDENT_RECOVER' | 'INCIDENT_SESSION_STOP';

/** Structured incident reference carried by status-history items. */
export interface IncidentReasonRef {
  incidentAction?: IncidentAuditAction | null;
  incidentId?: string | null;
  /** Full text resolved server-side from `connector_incidents` (not the 500-char audit copy). */
  incidentDetail?: string | null;
}

export interface ChargePointStatusEvent {
  id: string;
  statusDimension: ChargePointStatusDimension;
  fromStatus: string;
  toStatus: string;
  reason?: string | null;
  actorType: EquipmentStatusActorType;
  performedById?: string | null;
  performedByDisplayName?: string | null;
  performedAt: string;
}

export interface ConnectorStatusEvent {
  id: string;
  fromStatus: ConnectorRuntimeStatus | string;
  toStatus: ConnectorRuntimeStatus | string;
  reason?: string | null;
  incidentAction?: IncidentAuditAction | null;
  incidentId?: string | null;
  incidentDetail?: string | null;
  actorType: EquipmentStatusActorType;
  performedById?: string | null;
  performedByDisplayName?: string | null;
  performedAt: string;
}

/** Platform-wide booking boundary/increment. It is not a Connector attribute. */
export const BOOKING_INTERVAL_MINUTES = 30 as const;

/* ---------- dynamic QR check-in challenge (FR07) ---------- */

export interface CheckInChallengeResponse {
  challengeToken: string;
  expiresInSeconds: number;
  connectorId?: string;
  createdAt?: string;
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
  id?: string;
  assetType: 'IMAGE' | 'DOCUMENT' | string;
  assetUrl: string;
  isPrimary?: boolean;
  storageKey?: string;
  displayOrder?: number;
  altText?: string;
}

export interface RegisterStationAssetInput {
  assetUrl: string;
  storageKey?: string;
  assetType?: 'IMAGE' | 'DOCUMENT' | string;
  altText?: string;
  primary?: boolean;
}

export interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
  publicKey?: string;
  urlEndpoint?: string;
}

export type StationOperatingState =
  | 'OPEN'
  | 'CLOSED_BY_SCHEDULE'
  | 'PAUSED_BY_OWNER'
  | 'MAINTENANCE'
  | 'SCHEDULE_NOT_CONFIGURED'
  | 'UNAVAILABLE_BY_PLATFORM';

export type StationOperationalStatus = 'OPERATING' | 'PAUSED' | 'MAINTENANCE';

export interface ChangeStationOperationalStatusRequest {
  operationalStatus: StationOperationalStatus;
  reason?: string;
}

export interface StationOperationalStatusResponse {
  stationId: string;
  operationalStatus: StationOperationalStatus;
  reason?: string;
}

export interface Station {
  contactPhone?: string;
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
  actualChargePointCount?: number;
  onlineCount?: number;
  onlineChargePointCount?: number;
  onlineActualChargePointCount?: number;
  status: StationStatus;
  operationalStatus?: StationOperationalStatus;
  operationalStatusReason?: string | null;
  operatingState?: StationOperatingState;
  openNow?: boolean;
  scheduleConfigured?: boolean;
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

export interface StationRegistrationDetail extends Station {
  addressLine: string;
  description?: string;
  provinceCode: string;
  wardCode: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  plannedChargePointCount: number;
  version: number;
}

export interface OwnerStationSummary {
  contactPhone?: string;
  id: string;
  stationCode: string;
  name: string;
  addressLine: string;
  provinceName: string;
  wardName: string;
  plannedChargePointCount: number;
  actualChargePointCount?: number;
  chargerCount?: number;
  onlineCount?: number;
  onlineChargePointCount?: number;
  onlineActualChargePointCount?: number;
  status: StationStatus;
  operationalStatus?: StationOperationalStatus;
  operationalStatusReason?: string | null;
  operatingState?: StationOperatingState;
  openNow?: boolean;
  scheduleConfigured?: boolean;
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

export interface AdminStationListItem {
  id: string;
  stationCode: string;
  name: string;
  addressLine: string;
  provinceName: string;
  wardName: string;
  ownerId: string;
  ownerDisplayName: string;
  ownerEmail: string;
  contactPhone: string;
  plannedChargePointCount: number;
  status: StationStatus;
  createdAt: string;
  licenseSummary?: LicenseSummary | null;
}

export interface StationOperatingPeriod {
  id?: string;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
}

export interface AdminStationDetail {
  id: string;
  stationCode: string;
  name: string;
  description?: string;
  addressLine: string;
  provinceName: string;
  wardName: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  plannedChargePointCount: number;
  status: StationStatus;
  createdAt: string;
  ownerId: string;
  ownerDisplayName: string;
  ownerEmail: string;
  ownerPhoneNumber?: string;
  assets?: StationAsset[];
  operatingPeriods?: StationOperatingPeriod[];
  licenseSummary?: LicenseSummary | null;
}

export interface AdminStationFilterParams {
  search?: string;
  status?: StationStatus;
  provinceCode?: string;
  pageNo?: number;
  pageSize?: number;
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
  licenseCode?: string;
  stationId: string;
  stationCode?: string;
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

export type LicenseStatusEventType =
  | 'ISSUED'
  | 'ACTIVATED'
  | 'SUSPENDED'
  | 'REACTIVATED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface LicenseStatusEventDto {
  id: string;
  licenseId: string;
  eventType: LicenseStatusEventType;
  fromStatus?: LicenseStatus | null;
  toStatus: LicenseStatus;
  reason?: string | null;
  actorType: 'USER' | 'SYSTEM';
  performedByName?: string | null;
  performedAt: string;
}

export interface AdminLicenseListItem {
  id: string;
  licenseCode: string;
  stationId: string;
  stationCode?: string;
  stationName: string;
  ownerName: string;
  plan: 'MONTHLY' | 'YEARLY';
  expiresAt: string;
  status: LicenseStatus;
  daysLeft?: number;
  expiringSoon?: boolean;
  feeAmount?: number;
  startAt?: string;
}

export interface AdminLicenseDetail extends AdminLicenseListItem {
  feeAmount: number;
  startAt: string;
  createdAt: string;
  recordedByName?: string;
}

export interface IssueLicenseRequest {
  plan: 'MONTHLY' | 'YEARLY';
}

export interface RenewLicenseRequest {
  plan: 'MONTHLY' | 'YEARLY';
}

/* ---------- users ---------- */

export type UserRole = 'DRIVER' | 'OWNER' | 'ADMIN' | 'STAFF';
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

/* ---------- station staff (FR17 & V19) ---------- */

export type StaffAssignmentStatus = 'ACTIVE' | 'REVOKED';

export type StaffLookupStatus =
  | 'ELIGIBLE'
  | 'NOT_FOUND'
  | 'SELF_ASSIGNMENT'
  | 'ACCOUNT_INACTIVE'
  | 'ROLE_NOT_ALLOWED'
  | 'ALREADY_ASSIGNED';

export interface StaffStationSummary {
  id: string;
  stationCode: string;
  name: string;
}

export interface CurrentStaffContextResponse {
  staff: boolean;
  assignmentId: string | null;
  assignmentStatus: StaffAssignmentStatus | null;
  station: StaffStationSummary | null;
}

export interface StaffLookupResponse {
  exists: boolean;
  email?: string;
  displayName?: string;
  maskedPhone?: string;
  assignable: boolean;
  status: StaffLookupStatus;
}

export interface AssignStationStaffRequest {
  email: string;
  note?: string;
}

/**
 * Historical station-to-staff assignment record.
 * Mirrors backend StationStaffResponse.
 */
export interface StationStaffMember {
  assignmentId: string;
  stationId: string;
  stationName: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  maskedPhone?: string;
  status: StaffAssignmentStatus;
  note?: string;
  assignedBy: string;
  assignedAt: string;
  revokedBy?: string;
  revokedAt?: string;
  /** Compatibility fields */
  name?: string;
  primaryRole?: UserRole;
  createdAt?: string;
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
  /** Day-of-month label or date string. */
  day: number | string;
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

/* ---------- refunds (BKG-034 / FE-19) ---------- */

export type RefundStatus = 'PENDING' | 'SUCCEEDED';
export type TransferExecutionMode = 'SIMULATOR' | 'MANUAL_RECORD';
export type TransferAttemptStatus = 'STARTED' | 'SUCCEEDED' | 'FAILED';
export type RefundExecutionPolicy = 'AUTO_FIRST_ATTEMPT' | 'ADMIN_REQUIRED';
export type RefundExecutionTrigger = 'SYSTEM_POLICY' | 'ADMIN';

export interface RefundAttemptItem {
  id: string;
  attemptId?: string;
  sequenceNo: number;
  executionMode: TransferExecutionMode;
  executionTrigger?: RefundExecutionTrigger;
  requestKey?: string;
  status: TransferAttemptStatus;
  providerRefundId?: string;
  transferReference?: string;
  failureCode?: string;
  note?: string;
  startedAt: string;
  performedAt?: string;
  completedAt?: string;
  performedBy?: string;
}

export interface RefundDetail {
  id: string;
  refundId?: string;
  bookingId: string;
  bookingCode?: string;
  driverId?: string;
  driverName?: string;
  stationName?: string;
  ticketId?: string;
  amount: number;
  currency: string;
  reason: 'VOLUNTARY_GRACE' | 'STATION_FAILURE' | 'EXCESS_PAYMENT' | 'LATE_PAYMENT' | 'UNAPPLIED_PAYMENT' | string;
  basisType: string;
  basisId: string;
  status: RefundStatus;
  executionPolicy?: RefundExecutionPolicy;
  /** @deprecated Alias đồng giá trị với requiresOwnerAction; sẽ gỡ sau cutover. */
  requiresAdminAction?: boolean;
  requiresOwnerAction?: boolean;
  version: number;
  decisionAt: string;
  decidedBy: string;
  successfulAttemptId?: string;
  transferReference?: string;
  completedAt?: string;
  attempts?: RefundAttemptItem[];
}

export interface ExecuteRefundRequest {
  expectedVersion: number;
  executionMode: TransferExecutionMode;
  outcome: 'SUCCEEDED' | 'FAILED';
  transferReference?: string;
  performedAt?: string;
  note: string;
}

export interface RefundQueueSummary {
  totalPendingCount: number;
  totalPendingAmountVnd: number;
  totalSucceededCount: number;
  totalSucceededAmountVnd: number;
}

/* ---------- owner finance (BKG-056 refactor baseline) ---------- */

export interface OwnerFinanceReceipt {
  receiptId: string;
  transactionRef: string;
  amount: number;
  receivedAt: string;
}

export interface OwnerFinanceBooking {
  bookingId: string;
  bookingCode: string;
  stationId: string;
  stationName: string;
  paymentStatus: string;
  collectedAmount: number;
  refundedAmount: number;
  pendingRefundAmount: number;
  netRecordedAmount: number;
  refundStatus: RefundStatus | null;
  paidAt: string | null;
  receipts: OwnerFinanceReceipt[];
}

/* ---------- owner refunds (BKG-056 refactor baseline) ---------- */

export type OwnerRefundReason = 'VOLUNTARY_GRACE' | 'STATION_UNAVAILABLE' | 'OPERATIONAL_ISSUE' | string;
export type RefundAttemptStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export interface OwnerRefundAttempt {
  attemptId: string;
  sequenceNo: number;
  executionMode: 'SIMULATOR' | 'MANUAL_RECORD' | string;
  status: RefundAttemptStatus;
  startedAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

export interface OwnerRefund {
  refundId: string;
  bookingId: string;
  bookingCode: string;
  stationId: string;
  amount: number;
  currency: string;
  reason: OwnerRefundReason;
  status: RefundStatus;
  requiresOwnerAction: boolean;
  version: number;
  decisionAt: string;
  completedAt: string | null;
  attempts: OwnerRefundAttempt[];
}

export interface OwnerRefundRetryPayload {
  expectedVersion: number;
}

/* ---------- ticket dispute escalation (BKG-057 baseline) ---------- */

export interface TicketEscalation {
  escalationId?: string;
  ticketId: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  notes?: string;
  requestedByRole?: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionType?: 'RETURN_TO_STATION' | 'CLOSE_SUPPORT_CASE' | null;
  resolutionNote?: string | null;
  closureReason?: TicketEscalationClosureReason | null;
}

export type TicketEscalationClosureReason =
  | 'RESOLVED_EXTERNALLY'
  | 'INSUFFICIENT_INFORMATION'
  | 'NO_PLATFORM_ACTION_REQUIRED'
  | 'OUT_OF_SUPPORT_SCOPE'
  | 'OTHER';

export interface ReviewTicketEscalationPayload {
  expectedVersion: number;
  action: 'RETURN_TO_STATION' | 'CLOSE_SUPPORT_CASE';
  closureReason?: TicketEscalationClosureReason | null;
  note: string;
}

export interface EscalateTicketPayload {
  reason: string;
}

export interface OwnerFinanceSummary {
  grossVnd: number;
  refundedVnd: number;
  netVnd: number;
  pendingRefundVnd: number;
  totalBookings: number;
  paidBookings: number;
}

export interface OwnerRefundsSummary {
  totalPendingCount: number;
  totalSucceededCount: number;
  totalFailedAttemptsCount: number;
  requiresOwnerActionCount: number;
  totalRefundAmountVnd: number;
  pendingRefundAmountVnd: number;
}

export interface TicketEscalationsSummary {
  totalEscalated: number;
  pendingArbiter: number;
  unresponsive24hCount: number;
  disputedFindingCount: number;
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
  /** Auto-release a slot 15 min after start if the driver hasn't checked in (POL-04). */
  autoLock?: boolean;
  /** How many days ahead a driver may book (System standard: 2 days). */
  maxAdvanceDays?: number;
  /** Safe transition gap (minutes) required between consecutive bookings on the same connector. */
  bufferMinutes?: number;
}

export interface PricingConfig {
  /**
   * Shortest window a driver may book, and the increment they step in
   * (30 | 60 | 90). Not a pre-generated slot: FR05 has the driver pick a start
   * time plus a duration, and the booking stores that range itself — the system
   * never materialises fixed slots to hand out.
   */
  minBookingDurationMin: number;
  /** Safe buffer (minutes) enforced between consecutive bookings: booking[i+1].startAt >= booking[i].endAt + bufferMinutes */
  bufferMinutes?: number;
  basePriceVnd: number; // per kWh, applies to any window without a TOU rule
  /** Whole-station 24/7 shortcut. When true, per-day open/close values are ignored. */
  open24Hours?: boolean;
  hours: OperatingHour[];
  touRules: TouRule[];
  availability: AvailabilityRules;
  /** Active schedule version metadata */
  scheduleEffectiveFrom?: string | null;
  scheduleEffectiveTo?: string | null;
  scheduleStatus?: 'ACTIVE' | 'DEFAULT' | 'UNCONFIGURED' | string;
  version?: number;
}

export interface StationScheduleHistoryItem {
  scheduleId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: 'ACTIVE' | 'EXPIRED';
  open24Hours: boolean;
  hours: OperatingHour[];
  changedByName: string;
  changedAt: string;
}

/* ---------- policy KB (FR15) ---------- */

export interface PolicyDoc {
  id: string;
  category: string;
  content: string;
  updatedAt: string;
}

export interface AssistantCitation {
  documentId?: string;
  documentName?: string;
  segmentId?: string;
  content?: string;
  score?: number;
}

export interface AssistantQuotaDetails {
  resetAt?: string;
  usedQueries?: number;
  maxDailyQueries?: number;
  scope?: string;
}

export interface AssistantAnswer {
  answer: string;
  locale?: 'vi' | 'en';
  messageId?: string;
  conversationId?: string;
  citations?: AssistantCitation[];
  /** Backwards-compatible alias for answer */
  text?: string;
  /** Backwards-compatible alias for citation document ids/names */
  sources?: string[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationPage {
  items: ConversationSummary[];
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface ChatTurn {
  id: string;
  conversationId: string;
  query: string;
  answer: string;
  status?: string;
  createdAt: string;
  citations?: AssistantCitation[];
}

export interface MessagePage {
  items: ChatTurn[];
  hasMore: boolean;
  nextCursor?: string | null;
}

/* ---------- support tickets (FR-cross-cutting) ---------- */

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed';

/**
 * FR16 categories. Also the routing key (BR-TKT-01): CHARGING_ISSUE and
 * station-linked BOOKING tickets go to that station's Owner/Staff; PAYMENT,
 * ACCOUNT and OTHER go to Admin.
 */
export type TicketCategory =
  | 'CHARGING_ISSUE'
  | 'BOOKING'
  | 'PAYMENT'
  | 'ACCOUNT'
  | 'OTHER'
  | 'charging_issue'
  | 'booking'
  | 'payment'
  | 'account'
  | 'other';

/** Categories an Owner/Staff console may see, provided the ticket is station-linked. */
export const STATION_SCOPED_CATEGORIES: readonly TicketCategory[] = [
  'CHARGING_ISSUE',
  'BOOKING',
  'charging_issue',
  'booking',
];

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketAuthorRole = 'driver' | 'station_staff' | 'station_owner' | 'platform_admin';
export type TicketActorKind = 'REPORTER' | 'STAFF' | 'OWNER' | 'ADMIN';

export type TicketCloseReason = 'REPORTER_CONFIRMED' | 'AUTO_CLOSED_NO_RESPONSE' | 'ADMIN_SUPPORT_CASE_CLOSED';

export type TicketEventType =
  | 'CLAIMED'
  | 'ASSIGNED'
  | 'REASSIGNED'
  | 'RESOLVED'
  | 'AUTO_CLOSED_NO_RESPONSE'
  | 'REPORTER_CONFIRMED'
  | 'REOPENED_PERSISTENT'
  | 'RETURN_TO_STATION'
  | 'CLOSE_SUPPORT_CASE';

export type TicketFindingConclusion =
  | 'STATION_FAILURE'
  | 'NOT_STATION_FAILURE'
  | 'STATION_FAULT'
  | 'USER_ERROR'
  | 'VEHICLE_FAULT'
  | 'POWER_OUTAGE'
  | 'FORCE_MAJEURE'
  | 'NO_ISSUE';

export interface TicketFinding {
  id?: string;
  findingId: string;
  conclusion: TicketFindingConclusion | string;
  affectedAt: string;
  reason: string;
  recordedAt: string;
  recordedBy?: string | null;
  recordedByRole?: string | null;
}

/** Append-only — no edit/delete once posted. */
export interface TicketMessage {
  id?: string;
  messageId?: string;
  ticketId?: string;
  authorId?: string;
  authorName?: string;
  authorDisplayName?: string;
  authorRole?: TicketAuthorRole;
  authorKind?: TicketActorKind;
  body: string;
  createdAt: string; // ISO
}

/** BKG-052 append-only immutable audit event trail. */
export interface TicketEvent {
  id: string;
  ticketId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorKind: TicketActorKind | 'SYSTEM';
  eventType: TicketEventType;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  fromHandlerId?: string | null;
  fromHandlerName?: string | null;
  toHandlerId?: string | null;
  toHandlerName?: string | null;
  resolutionCycle: number;
  reason?: string | null;
  createdAt: string;
}

/** BKG-052 Station Staff operational KPI metrics aggregate. */
export interface StationTicketKpis {
  stationId: string;
  periodFrom: string;
  periodTo: string;
  selfClaimedTickets: number;
  assignedTickets: number;
  resolvedTickets: number;
  completedTickets: number;
  reporterConfirmedCompletedTickets: number;
  autoClosedCompletedTickets: number;
}

export interface AssignTicketRequest {
  expectedVersion?: number;
  handlerId: string;
  reason?: string;
}

export interface TicketHandlerCandidate {
  userId: string;
  displayName: string;
  role: 'OWNER' | 'STAFF';
}

export interface RecordTicketFindingRequest {
  expectedVersion: number;
  conclusion: 'STATION_FAILURE' | 'NOT_STATION_FAILURE';
  affectedAt: string;
  reason: string;
}

export interface ResolveTicketRequest {
  expectedVersion?: number;
  reason: string;
}

/** Linked context (station/booking) is shown in the detail header when present. */
export interface Ticket {
  id: string;
  ticketId?: string;
  /** Human-readable reference quoted to the reporter, alongside the system id (FR16). */
  ticketNo?: string;
  ticketCode?: string;
  subject: string;
  title?: string;
  description?: string;
  category: TicketCategory;
  priority?: TicketPriority;
  status: TicketStatus;
  version?: number;
  stationId: string | null;
  stationName: string | null;
  bookingId: string | null;
  bookingCode?: string;
  bookingStartAt?: string | null;
  bookingEndAt?: string | null;
  reporterId?: string;
  reporterUserId?: string;
  reporterName: string;
  driverName?: string;
  driverId?: string;
  reporterPhone: string | null;
  /** null = unassigned. */
  assigneeName?: string | null;
  assignedToName?: string | null;
  assignedToUserId?: string | null;
  assignedHandlerId?: string | null;
  assignedHandlerName?: string | null;
  resolvedAt?: string | null;
  autoCloseAt?: string | null;
  closeReason?: TicketCloseReason | null;
  resolutionCycle?: number;
  resolutionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  lastMessagePreview?: string;
  messageCount?: number;
  messages?: TicketMessage[];
  findings?: TicketFinding[];
  refundIds?: string[];
  serviceFailureDecisions?: ServiceFailureDecisionSummary[];
  financialResolution?: ServiceFailureDecisionSummary | null;
}

export interface TicketListParams {
  /** Owner/staff console is implicitly scoped server-side by token; admin sees all. */
  status?: TicketStatus | 'all';
  category?: TicketCategory | 'all';
  stationId?: string | 'all';
  queueScope?: 'station' | 'my' | 'platform' | 'all';
  assignedHandlerId?: string | 'unassigned' | 'me' | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  role?: 'owner' | 'admin' | 'staff';
  workstream?: 'all' | 'platform' | 'station';
}

export interface TicketSummary {
  total: number;
  byStatus: Record<string, number>;
  open?: number;
  inProgress?: number;
  resolved?: number;
  closed?: number;
  avgResponseMinutes?: number;
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
  license: { status: LicenseStatus; expiryDate: string; daysLeft: number; expiringSoon?: boolean };
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

/** Owner operations summary endpoint: GET /api/v1/owner/dashboard/summary */
export interface OwnerOperationsSummary {
  generatedAt?: string;
  date?: string;
  timezone?: string;
  stations: {
    totalStations: number;
    activeStations: number;
    visibleToDrivers: number;
    pendingApproval: number;
    onlineChargePoints: number;
    totalChargePoints: number;
  };
  hardware: {
    totalConnectors: number;
    availableConnectors: number;
    chargingConnectors: number;
    offlineConnectors: number;
    unavailableConnectors: number;
    sessionsToday: number;
    averageUtilizationPercent: number;
  };
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

/** Platform operations only; contains no Owner booking or finance data. */
export interface AdminOperationsSummary {
  activeStations: number;
  pendingApprovals: number;
  platformOpenTickets: number;
  escalatedOpenCases: number;
}

export interface UserProfile {
  id: string;
  keycloakId: string;
  email: string;
  displayName?: string;
  phone?: string;
  status: UserStatus;
  profileCompleted: boolean;
  avatarUrl?: string | null;
  avatarStorageKey?: string | null;
}

export interface UserProfileUpdateRequest {
  displayName?: string;
  phone?: string;
  avatarUrl?: string | null;
  avatarStorageKey?: string | null;
}

/* ---------- BKG-056 / BKG-057 Station Failure & Dispute Policy Decisions ---------- */

export type ServiceFailureDecisionKind =
  | 'OWNER_CANCEL_BOOKING'
  | 'OWNER_ACCEPT_STATION_FAILURE'
  | 'ADMIN_REVIEW_STATION_FAILURE';

export type ServiceFailureDecisionResult =
  | 'FULL_REFUND'
  | 'NO_APPLIED_PAYMENT'
  | 'INSUFFICIENT_EVIDENCE';

export interface ServiceFailureDecisionSummary {
  decisionId: string;
  sequenceNo: number;
  kind: ServiceFailureDecisionKind;
  result: ServiceFailureDecisionResult;
  reason: string;
  decidedAt: string;
  affectedAt?: string | null;
  actorKind: 'OWNER' | 'ADMIN';
  actorDisplayName: string;
  refundId?: string | null;
  amountVnd?: number;
  currency?: 'VND';
}

export interface ServiceFailureRefundSummary {
  refundId: string;
  amount: number;
  currency: 'VND';
  status: 'PENDING' | 'SUCCEEDED';
  requiresOwnerAction?: boolean;
}

export interface StationFailureEligibility {
  allowed: boolean;
  reason?:
    | 'HOLD_EXPIRED'
    | 'CHECK_IN_WINDOW_CLOSED'
    | 'OPERATIONAL_RESOLUTION_REQUIRED'
    | 'NO_APPLIED_PAYMENT'
    | 'OUT_OF_DEMO_SCOPE'
    | 'RECONCILIATION_REQUIRED'
    | 'RESPONSIBILITY_ALREADY_ACCEPTED'
    | 'ESCALATION_NOT_ACTIVE'
    | 'REFUND_ALREADY_GRANTED'
    | string;
}

export interface OwnerStationFailureContext {
  bookingId: string;
  bookingCode: string;
  bookingVersion: number;
  decisionVersion: number;
  status: ApiBookingStatus;
  persistedStatus: ApiBookingStatus;
  stateReconciliationPending: boolean;
  evaluatedAt: string;
  eligibleRefundAmountVnd: number;
  cancelEligibility: StationFailureEligibility;
  admissionEligibility: StationFailureEligibility;
  latestDecision?: ServiceFailureDecisionSummary | null;
  refundSummary?: ServiceFailureRefundSummary | null;
  historyDecisions: ServiceFailureDecisionSummary[];
}

export interface AdminRefundPolicyContext {
  ticketId: string;
  ticketVersion: number;
  escalationId: string;
  /** Escalation still open — only then may Admin issue a new financial decision. */
  active: boolean;
  bookingId: string;
  bookingCode?: string;
  packageAmountVnd?: number | null;
  bookingVersion: number;
  decisionVersion: number;
  bookingStatus: ApiBookingStatus;
  evaluatedAt: string;
  eligibleRefundAmountVnd: number | null;
  reviewEligibility: StationFailureEligibility;
  grantEligibility?: StationFailureEligibility;
  insufficientEligibility?: StationFailureEligibility;
  latestDecision?: ServiceFailureDecisionSummary | null;
  refundSummary?: ServiceFailureRefundSummary | null;
  historyDecisions: ServiceFailureDecisionSummary[];
  dossier?: AdminBookingDossier | null;
}

/**
 * Case-scoped booking dossier served by refund-policy-context. Derived from the
 * ticket's own booking relation — the Admin never supplies a booking id.
 */
export interface AdminBookingDossier {
  currency: string;
  window: AdminBookingWindow;
  snapshot: AdminBookingSnapshot;
  policy: AdminBookingPolicy;
  timeline: AdminBookingTimeline;
  payment?: AdminDossierPayment | null;
  receipt?: AdminDossierReceipt | null;
  priceLines: AdminDossierPriceLine[];
}

export interface AdminBookingWindow {
  startAt?: string | null;
  endAt?: string | null;
  durationMin: number;
}

export interface AdminBookingSnapshot {
  stationName?: string | null;
  stationAddress?: string | null;
  chargePointCode?: string | null;
  connectorCode?: string | null;
}

export interface AdminBookingPolicy {
  version?: string | null;
  cancellationGraceMin?: number | null;
  checkInCloseBeforeEndMin?: number | null;
  stationFailureRefundPercent?: number | null;
  voluntaryRefundPercent?: number | null;
}

export interface AdminBookingTimeline {
  expiresAt?: string | null;
  paymentConfirmedAt?: string | null;
  freeCancellationDeadline?: string | null;
  checkInDeadline?: string | null;
  checkedInAt?: string | null;
  chargingStartedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export interface AdminDossierPayment {
  status: PaymentStatus;
  amount: number;
  paidAt?: string | null;
  environment?: string;
  needsReconciliation: boolean;
}

export interface AdminDossierReceipt {
  receiptId: string;
  transactionRef?: string | null;
  amount: number;
  currency?: string | null;
  receivedAt?: string | null;
  classification: 'APPLIED' | 'UNAPPLIED' | string;
}

export interface AdminDossierPriceLine {
  label: string;
  periodCode?: string | null;
  durationMin: number;
  amount: number;
}

export interface OwnerCancelBookingPayload {
  expectedVersion: number;
  reason: string;
}

export interface OwnerAcceptStationFailurePayload {
  expectedVersion: number;
  expectedDecisionVersion: number;
  affectedAt: string;
  reason: string;
}

export interface StationFailureCommandResponse {
  bookingId: string;
  bookingVersion: number;
  status: ApiBookingStatus;
  cancellationReason: CancellationReason;
  stateReconciliationPending: boolean;
  decisionVersion: number;
  decision: ServiceFailureDecisionSummary;
  refund?: ServiceFailureRefundSummary | null;
}

export interface AdminReviewRefundPolicyPayload {
  expectedVersion: number;
  expectedBookingVersion: number;
  expectedDecisionVersion: number;
  outcome: 'GRANT_FULL_REFUND' | 'INSUFFICIENT_EVIDENCE';
  affectedAt?: string | null;
  reason: string;
}

export interface AdminReviewRefundPolicyResponse {
  ticketId: string;
  ticketVersion: number;
  escalationId: string;
  bookingId: string;
  bookingVersion: number;
  decisionVersion: number;
  decision: ServiceFailureDecisionSummary;
  refund?: ServiceFailureRefundSummary | null;
}

/** BKG-054 / BKG-055: Operational emergency incident and recovery types */
export type ConnectorIncidentStatus = 'OPEN' | 'RECOVERED';
export type IncidentBookingSafetyState = 'AWAITING_SESSION_STOP' | 'NO_ACTIVE_SESSION' | 'SESSION_RESOLVED';
export type IncidentHandlingState = 'PENDING' | 'COMPLETED';

export interface AffectedIncidentBooking {
  bookingId: string;
  snapshotStatus: ApiBookingStatus;
  snapshotVersion: number;
  currentStatus: ApiBookingStatus;
  currentVersion: number;
  safetyState: IncidentBookingSafetyState;
  resolvedAt: string | null;
  resolutionReason: string | null;
}

export interface ConnectorIncidentResponse {
  incidentId: string;
  stationId: string;
  connectorId: string;
  status: ConnectorIncidentStatus;
  version: number;
  connectorVersion: number;
  runtimeStatus: ConnectorRuntimeStatus;
  reason: string;
  occurredAt: string;
  reportedAt: string;
  recoveredAt: string | null;
  recoveryReason: string | null;
  affectedBookingIds: string[];
  handlingState: IncidentHandlingState;
  affectedBookings: AffectedIncidentBooking[];
}

export interface ReportConnectorIncidentRequest {
  expectedConnectorVersion: number;
  reason: string;
  occurredAt: string;
}

export interface RecoverConnectorIncidentRequest {
  expectedVersion: number;
  reason: string;
}

export interface ResolveIncidentSessionRequest {
  expectedBookingVersion: number;
  reason: string;
  safetyConfirmed: boolean;
}

/* ---------- STAFF Operations (Ops-01..Ops-05) ---------- */

export interface StaffStationOverview {
  stationId: string;
  name: string;
  address: string;
  operationalStatus: StationOperationalStatus;
  chargePointCount: number;
  connectorCount: number;
}

export interface StaffChargePointItem {
  id: string;
  code: string;
  name: string;
  zoneLabel: string | null;
  provisioningStatus: ProvisioningStatus;
  operationalStatus: OperationalChargePointStatus;
  version: number;
}

export interface StaffConnectorItem {
  id: string;
  code: string;
  connectorType: ConnectorType;
  runtimeStatus: ConnectorRuntimeStatus;
  version: number;
  activeIncidentId?: string | null;
}

export type StaffHistoryActorType = 'ADMIN' | 'OWNER' | 'STAFF' | 'SYSTEM';

export interface StaffEquipmentHistoryItem {
  id: string;
  /** 'CHARGE_POINT' | 'CONNECTOR' (server string, not an enum on the FE). */
  dimension: string;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  incidentAction?: IncidentAuditAction | null;
  incidentId?: string | null;
  incidentDetail?: string | null;
  actorType: StaffHistoryActorType;
  performedByDisplayName: string | null;
  performedAt: string;
}

export interface StaffChangeChargePointStatusRequest {
  operationalStatus: OperationalChargePointStatus;
  expectedVersion: number;
  reason?: string;
}

export interface StaffChangeConnectorStatusRequest {
  runtimeStatus: ConnectorRuntimeStatus;
  expectedVersion: number;
  reason?: string;
}

export interface StaffBookingListParams {
  connectorId?: string;
  from?: string;
  to?: string;
  /** Backend is 1-based. */
  page?: number;
  size?: number;
}

/**
 * Same shape as the owner operational booking, and deliberately no wider:
 * BKG-048 returns `OperationalBookingResponse` with `driverDisplayName` only —
 * its zero-leakage test asserts the payload carries neither money fields nor
 * `driverPhone`. Vehicle plate has no collection/storage flow yet, so neither
 * field is added here until the contract grows them.
 */
export type StaffOperationalBooking = OperationalBooking;

export interface StaffEquipmentHistoryParams {
  page?: number;
  size?: number;
}

/* ---------- Staff invitations (owner) ---------- */

export type StaffInvitationStatus = 'PENDING' | 'SENT' | 'ACCEPTED' | 'CANCELLED';

export interface StaffInvitationResponse {
  invitationId: string;
  stationId: string;
  email: string;
  status: StaffInvitationStatus;
  expiresAt: string;
  sentAt?: string | null;
  acceptedAt?: string | null;
}

export interface StaffInvitationRequest {
  email: string;
}

export interface StaffInvitationListParams {
  /** Backend is 1-based. */
  page?: number;
  size?: number;
}

