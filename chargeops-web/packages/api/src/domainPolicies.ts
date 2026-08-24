/**
 * Central Domain Policy & Business Rule Registry
 * 
 * Defines rule identifiers and policy document references for the ChargeOps platform.
 * To update, rename, or abstract domain rules in the future, edit the values in this file.
 */
export const DOMAIN_POLICIES = {
  /** Lockout taking charge points or connectors offline while a live booking is active */
  ACTIVE_BOOKING_LOCKOUT: 'BR-CHG-05',

  /** Hiding stations and chargers from driver map and search when License is expired/suspended */
  LICENSE_SEARCH_VISIBILITY: 'BR-STA-01',

  /** Booking cancellation refund tiers and penalty calculations */
  REFUND_POLICY: 'BR-PAY-03',

  /** Hardwired connector hardware specifications locking after initial provisioning */
  CONNECTOR_PROVISIONING_LOCK: 'BR-CHG-03',

  /** Station staff role scoping and access isolation */
  STATION_ACCESS_CONTROL: 'BR-ACC-05',

  /** Station amenities self-service management */
  STATION_AMENITIES: 'BR-STA-02',

  /** 10-minute hold window for unpaid reservations */
  UNPAID_BOOKING_HOLD: 'BR-BOK-02',

  /** Transition buffer enforced between consecutive bookings on the same connector */
  BOOKING_BUFFER_POLICY: 'POL-BUF-01',

  /** Operational handling and penalty rates for overstay sessions past scheduled end time */
  OVERSTAY_PENALTY_POLICY: 'POL-OVR-01',

  /** Ticket categorization and routing rules */
  TICKET_ROUTING: 'BR-TKT-01',
} as const;

export type DomainPolicyKey = keyof typeof DOMAIN_POLICIES;
export type DomainPolicyCode = (typeof DOMAIN_POLICIES)[DomainPolicyKey];

/**
 * System-Wide Fixed Scheduling Constants
 * 
 * Non-configurable by individual station owners to preserve system-wide
 * availability predictability and operational safety.
 */
export const SYSTEM_BOOKING_RULES = {
  /** Fixed turnaround safety buffer between consecutive bookings on the same connector (10 mins) */
  TURNAROUND_BUFFER_MINUTES: 10,

  /** Standard duration stepping increment on driver reservation interface (30 mins) */
  DURATION_STEP_MINUTES: 30,

  /** Hard upper limit for a single reservation session (3 hours = 180 mins) */
  MAX_BOOKING_DURATION_MINUTES: 180,

  /** Short-term reservation horizon: Today + Tomorrow (2 days / ~48h) */
  MAX_ADVANCE_BOOKING_DAYS: 2,

  /** Auto-release reservation window when driver fails to check in (15 mins) */
  NO_SHOW_AUTO_LOCK_MINUTES: 15,
} as const;
