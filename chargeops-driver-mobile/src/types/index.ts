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

export interface Slot {
  id: string;
  chargerId: string;
  startAt: string; // ISO datetime
  endAt: string;
  price: number; // FIXED slot price (VND), already snapshotted — display as-is
  status: 'AVAILABLE' | 'BOOKED' | 'DISABLED';
}

export interface Booking {
  id: string;
  slotId: string;
  status: BookingStatus;
  checkedInAt?: string;
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
