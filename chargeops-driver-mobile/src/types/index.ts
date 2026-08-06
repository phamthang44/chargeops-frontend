/**
 * Core domain types — mirror the database schema (only fields the UI needs).
 * Aligned with SRS v4.7 Section 7.
 */

export type ConnectorType = 'CCS2' | 'CHADEMO' | 'TYPE2' | 'GBT';

/** Station amenities (mapped to an icon + i18n label in the UI). */
export type Amenity =
  | 'RESTROOM'
  | 'CAFE'
  | 'WIFI'
  | 'PARKING'
  | 'CONVENIENCE_STORE'
  | 'SHOPPING'
  | 'wifi'
  | 'food'
  | 'parking'
  | 'security'
  | 'restroom';

/**
 * Booking lifecycle (SRS Section 4). There is no NO_SHOW state: a driver who
 * fails to check in is auto-CANCELLED at 0% refund (BR-BOK-05) — the reason is
 * carried separately in `Booking.cancelReason` so history can still label it.
 */
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHARGING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

/** Why a CANCELLED booking ended that way — drives the history badge + refund copy. */
export type CancelReason = 'DRIVER' | 'NO_SHOW' | 'PAYMENT_TIMEOUT';

export interface Station {
  id: string;
  name: string;
  address: string;
  description?: string;
  latitude: number;
  longitude: number;
  distanceKm?: number; // computed client-side
  imageUrl?: string;
  contactPhone?: string;
  operatingHours?: string;
  /** Opening/closing minutes from midnight; used to clamp the bookable window (FR11). */
  opensAtMin: number;
  closesAtMin: number; // 1440 = open until midnight (24/7 stations use 0–1440)
  availableConnectors: number; // free bookable ports (derived)
  totalConnectors: number;
  rating?: number; // average rating, e.g. 4.8 (shown in station list/detail)
  reviewCount?: number; // number of ratings, optional
  isOpen?: boolean; // derived open/closed state (vs operatingHours)
  hasFastCharging?: boolean; // has at least one DC connector (for list filtering)
  minRatePerKwh?: number; // cheapest đ/kWh rate label (info only, "Giá từ")
  amenities?: Amenity[]; // shown on the station detail screen
}

/**
 * Charge Point provisioning lifecycle (FR14). Drivers only ever see ACTIVE ones:
 * UNCLAIMED and SUSPENDED devices are hidden from search and cannot be booked
 * (BR-CHG-01).
 */
export type ProvisioningStatus = 'UNCLAIMED' | 'ACTIVE' | 'OFFLINE' | 'SUSPENDED';

/**
 * The physical device. It is NOT the bookable unit — bookings attach to its
 * Connectors (SRS Section 7). Its only driver-facing job is to say where in the
 * car park the ports are (`zoneLabel`) and group them (FR04).
 */
export interface ChargePoint {
  id: string;
  stationId: string;
  name: string; // e.g. "Trụ sạc A"
  zoneLabel: string | null; // free-text location hint, e.g. "gần lối vào, dãy B"
  maxPowerKw: number; // display-only descriptor (BR-CHG-06)
  status: ProvisioningStatus;
}

/** Runtime status of one bookable port (FR07/FR10). */
export type ConnectorRuntimeStatus = 'AVAILABLE' | 'IN_USE' | 'OFFLINE';

/**
 * A Connector is the bookable port and the unit of contention: availability,
 * locking, and the (connector, time range) exclusion invariant all live here.
 * Its `id` is what the glossary calls the "Charger ID" and what the printed QR
 * sticker encodes (BR-CHG-02).
 */
export interface Connector {
  id: string;
  chargePointId: string;
  stationId: string; // denormalized for station-scoped lookups
  name: string; // e.g. "Cổng 1"
  connectorType: ConnectorType;
  powerKw: number; // 3.0–360.0 (BR-CHG-07)
  currentType: 'AC' | 'DC';
  runtimeStatus: ConnectorRuntimeStatus;
  qrToken: string; // payload of the printed QR label; never changes (BR-CHG-04)
  ratePerKwh: number; // base đ/kWh before TOU banding
}

/** Which time-of-use band a stretch of a booking falls in. */
export type RateKind = 'PEAK' | 'STANDARD' | 'OFFPEAK';

/**
 * One TOU band's slice of a booking's price, snapshotted at booking time
 * (SRS BookingPriceLine). A booking that crosses a band boundary — say
 * 16:15–17:45 — cannot be explained by a single rate, so it carries one line
 * per band and the total is their sum. Never recalculated afterwards: pricing
 * changes apply to new bookings only (BR-STA-03).
 */
export interface BookingPriceLine {
  fromAt: string; // ISO datetime
  toAt: string;
  rateKind: RateKind;
  rateVndPerKwh: number;
  energyKwh: number;
  amount: number; // VND for this band
}

/** Payment methods offered on the booking-confirmation screen. */
export type PaymentMethod = 'MOMO' | 'VISA' | 'ZALOPAY' | 'ATM' | 'WALLET';

/**
 * A booking, denormalized for display. It reserves a continuous time range on
 * one Connector — there is no stored slot entity (SRS Section 7). The booking
 * snapshots the station/connector details and the price lines at creation time
 * so history & detail screens never re-join against live data.
 */
export interface Booking {
  id: string;
  code: string; // human-facing booking code, e.g. "CHG-8829"
  // Station snapshot
  stationId: string;
  stationName: string;
  stationAddress: string;
  stationImageUrl?: string;
  // Connector snapshot (chargePointName/zoneLabel help the driver find the port)
  connectorId: string;
  connectorName: string;
  chargePointName: string;
  zoneLabel: string | null;
  connectorType: ConnectorType;
  powerKw: number;
  // Reserved time range
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  durationMin: number;
  // Pricing (VND, snapshotted at booking time)
  priceLines: BookingPriceLine[];
  energyKwh: number; // estimated kWh across all bands
  chargingFee: number; // sum of the price lines
  serviceFee: number; // flat platform fee
  totalPrice: number; // chargingFee + serviceFee
  paymentMethod: PaymentMethod;
  // Lifecycle
  status: BookingStatus;
  cancelReason?: CancelReason;
  checkedInAt?: string;
  createdAt: string; // ISO datetime — the 5-minute grace window runs from here (FR05)
  /** When an unpaid PENDING booking's hold lapses (BR-BOK-02); null once paid. */
  expiresAt: string | null;
  refundAmount?: number; // VND credited back when CANCELLED (FR08 tiers)
  refundPercent?: number; // 100 | 50 | 0 — which tier applied
}

/**
 * Payload sent to the backend to create a booking. The driver picks a start
 * time and a duration; the backend re-derives the price and checks the range
 * against existing bookings on that Connector (FR05, BR-BOK-01). The client
 * never sends a total it computed itself.
 */
export interface CreateBookingRequest {
  stationId: string;
  connectorId: string;
  startAt: string; // ISO datetime
  durationMin: number;
  paymentMethod: PaymentMethod;
}

/** A driver review for a station (display only; submission not yet specified). */
export interface Review {
  id: string;
  stationId: string;
  authorName: string;
  rating: number; // 1..5
  comment: string;
  createdAt: string; // ISO datetime
}

// --- Auth / account (mirrors the SRS `User` entity; see FR01, BR-ACC) ---

export type UserRole = 'DRIVER' | 'OWNER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole; // immutable; always DRIVER in this app (BR-ACC-01)
  status: UserStatus;
}

/** OAuth credentials held only in React memory. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt?: number;
}

/** A logged-in session = the user plus their tokens. */
export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

/** Payload sent to the register endpoint. Client sends `password`, never a hash. */
export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

/** Payload sent to the login endpoint (email + password per FR01). */
export interface LoginRequest {
  email: string;
  password: string;
}
