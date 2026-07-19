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

/** Fat/denormalized on purpose: price + names are snapshots taken at booking time (BookingPriceLine). */
export interface Booking {
  id: string;
  stationId: string;
  stationName: string;
  ownerName: string;
  chargerId: string;
  connector: ConnectorType;
  powerKw: number;
  driverName: string;
  driverPhone: string;
  /** ISO datetimes. */
  startAt: string;
  endAt: string;
  durationMin: number;
  rateKind: RateKind;
  rateVndPerKwh: number;
  energyKwh: number;
  amountVnd: number;
  /** BR-PAY-03: 100 / 50 / 0 by time-before-start at cancel moment. Null unless cancelled. */
  refundPct: number | null;
  refundVnd: number;
  method: PaymentMethod;
  status: BookingStatus;
}

export interface BookingListParams {
  /** Owner console is implicitly scoped server-side by token; admin sees all. */
  status?: BookingStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface BookingSummary {
  total: number;
  byStatus: Record<BookingStatus, number>;
  grossVnd: number;
  refundedVnd: number;
}

/* ---------- chargers ---------- */

export type ChargerStatus =
  | 'available'
  | 'maintenance'
  | 'offline'
  | 'unclaimed'; // admin-provisioned, not yet installed/linked

export interface Charger {
  id: string;
  stationId: string;
  /** Owner-editable display name; connector/power are admin-provisioned (read-only for owners). */
  name: string;
  connector: ConnectorType;
  powerKw: number;
  status: ChargerStatus;
  utilizationPct: number;
  sessionsToday: number;
  uptime30dPct: number;
  kwhToday: number;
  faultCount: number;
  lastSeen: string;
}

/* ---------- stations ---------- */

export type StationStatus = 'active' | 'pending' | 'rejected';

export interface Station {
  id: string;
  name: string;
  city: string;
  address: string;
  ownerName: string;
  chargerCount: number;
  onlineCount: number;
  status: StationStatus;
  /** e.g. "Năm · hết hạn 12/09/2026"; null while pending/rejected. */
  licenseSummary: string | null;
  rejectionReason: string | null;
  bookingsToday: number;
  revenueWeekVnd: number;
  utilizationPct: number;
  /** ISO date the registration was submitted (approval queue). */
  submittedAt: string | null;
}

export interface StationRegistration {
  name: string;
  city: string;
  address: string;
  plannedChargers: number;
}

/* ---------- licenses ---------- */

export type LicenseStatus = 'active' | 'expiring' | 'expired';
export type LicensePlan = 'monthly' | 'yearly';

export interface License {
  stationId: string;
  stationName: string;
  ownerName: string;
  plan: LicensePlan;
  startDate: string;
  expiryDate: string;
  daysLeft: number;
  status: LicenseStatus;
  priceVnd: number;
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
  slotDurationMin: number; // 30 | 60 | 90
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

/* ---------- dashboards ---------- */

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
  chargers: Pick<Charger, 'id' | 'name' | 'status' | 'utilizationPct'>[];
  upcomingBookings: { id: string; startTime: string; driverName: string }[];
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
