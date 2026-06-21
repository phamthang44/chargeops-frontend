/**
 * Core domain types — mirror the database schema (only fields the UI needs).
 */

export type ConnectorType = 'CCS2' | 'CHADEMO' | 'TYPE2' | 'GBT';

export type ChargerStatus = 'AVAILABLE' | 'IN_USE' | 'DISABLED' | 'MAINTENANCE';

/** Station amenities (mapped to an icon + i18n label in the UI). */
export type Amenity = 'wifi' | 'food' | 'parking' | 'security' | 'restroom';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

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
  availableChargers: number; // number of free chargers (derived)
  totalChargers: number;
  rating?: number; // average rating, e.g. 4.8 (shown in station list/detail)
  reviewCount?: number; // number of ratings, optional
  isOpen?: boolean; // derived open/closed state (vs operatingHours)
  hasFastCharging?: boolean; // has at least one DC charger (for list filtering)
  minRatePerKwh?: number; // cheapest đ/kWh rate label (info only, "Giá từ")
  amenities?: Amenity[]; // shown on the station detail screen
}

export interface Charger {
  id: string;
  stationId: string;
  name: string; // e.g. "Sạc Nhanh DC-01"
  connectorType: ConnectorType;
  powerKw: number;
  chargerType: 'AC' | 'DC';
  status: ChargerStatus;
  ratePerKwh?: number; // informational đ/kWh rate label (NEVER used to compute price)
}

/**
 * Slot availability from the current driver's perspective:
 * - AVAILABLE   = bookable (Có thể đặt)
 * - OCCUPIED    = booked by someone else (Người khác đã đặt)
 * - UNAVAILABLE = maintenance / offline (Bảo trì)
 * - MINE        = already booked by this driver (Lượt đặt của bạn)
 */
export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'UNAVAILABLE' | 'MINE';

export interface Slot {
  id: string;
  chargerId: string;
  startAt: string; // ISO datetime
  endAt: string;
  price: number; // FIXED slot price (VND), already snapshotted — display as-is
  status: SlotStatus;
}

/** Payment methods offered on the booking-confirmation screen. */
export type PaymentMethod = 'MOMO' | 'VISA' | 'ZALOPAY' | 'ATM' | 'WALLET';

/**
 * A booking, denormalized for display.
 * The booking snapshots the station/charger/slot details at creation time so the
 * history & detail screens never need to re-join against live station data.
 */
export interface Booking {
  id: string;
  code: string; // human-facing booking code, e.g. "CHG-8829"
  // Station snapshot
  stationId: string;
  stationName: string;
  stationAddress: string;
  stationImageUrl?: string;
  // Charger snapshot
  chargerId: string;
  chargerName: string;
  connectorType: ConnectorType;
  powerKw: number;
  // Time window (earliest slot start -> latest slot end)
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  slotCount: number; // number of hourly slots booked (= duration in hours)
  // Pricing (VND, snapshotted)
  chargingFee: number; // sum of the chosen slot prices
  serviceFee: number; // flat platform fee
  totalPrice: number; // chargingFee + serviceFee
  paymentMethod: PaymentMethod;
  // Lifecycle
  status: BookingStatus;
  checkedInAt?: string;
  createdAt: string; // ISO datetime
}

/** One chosen time slot in a booking request (ISO timestamps + fixed price). */
export interface BookingSlotInput {
  startAt: string;
  endAt: string;
  price: number;
}

/**
 * Payload sent to the backend to create a booking.
 * The frontend generates the slot grid; the chosen slots' ISO timestamps travel here.
 * Multiple slots may be selected in one booking. Pricing is derived server-side
 * from the snapshotted slot prices — the client never sends a total it computed itself.
 */
export interface CreateBookingRequest {
  stationId: string;
  chargerId: string;
  slots: BookingSlotInput[];
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

/** JWT access + refresh token pair (SRS auth model). */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
