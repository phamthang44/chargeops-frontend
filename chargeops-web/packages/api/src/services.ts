/**
 * Service interfaces — the ONLY surface UI code depends on.
 * `createMockServices()` and `createRestServices()` both implement `Services`;
 * swapping mock → real API is a config change, not a UI change.
 */
import type {
  AdminDashboard,
  AnalyticsOverview,
  AssistantAnswer,
  Booking,
  BookingListParams,
  BookingSummary,
  ChargePoint,
  Connector,
  ConnectorRuntimeStatus,
  ConnectorType,
  License,
  OwnerDashboard,
  Page,
  PaymentMethod,
  PolicyDoc,
  PricingConfig,
  ProvisioningStatus,
  StaffDashboard,
  Amenity,
  Station,
  StationRegistration,
  StationStaffMember,
  Ticket,
  TicketListParams,
  TicketMessage,
  TicketStatus,
  TicketSummary,
  Transaction,
  TransactionSummary,
  TransactionType,
  UserAccount,
  UserStatus,
} from './types';

export interface DashboardService {
  owner(): Promise<OwnerDashboard>;
  admin(): Promise<AdminDashboard>;
  /** Ops-only KPIs — no revenue/license fields exist on this DTO (see StaffDashboard). */
  staff(): Promise<StaffDashboard>;
}

export interface AnalyticsService {
  overview(): Promise<AnalyticsOverview>;
}

export interface BookingService {
  list(params?: BookingListParams): Promise<Page<Booking>>;
  get(id: string): Promise<Booking>;
  summary(): Promise<BookingSummary>;
  /** Owner cancelling on behalf of the driver — refund per BR-PAY-03. */
  cancel(id: string): Promise<Booking>;
  /**
   * BR-CHG-05 — bookings in Confirmed/Checked-In state on the given connectors.
   * A non-empty result blocks taking those connectors (or their charge point)
   * offline: the slot is sold and the driver may already be plugged in.
   */
  activeFor(connectorIds: string[]): Promise<Booking[]>;
}

export interface ChargePointService {
  list(stationId?: string): Promise<ChargePoint[]>;
  /** Owners may edit display name, zone label, and toggle ACTIVE<->OFFLINE. */
  update(id: string, patch: { name?: string; zoneLabel?: string; status?: ProvisioningStatus }): Promise<ChargePoint>;
  /** Admin: create an UNCLAIMED charge point for a station (FR14 step 1). */
  provision(input: { stationId: string; name?: string; zoneLabel?: string }): Promise<ChargePoint>;
  /** Admin: UNCLAIMED → ACTIVE once its connectors are provisioned and QR stickers installed. */
  activate(id: string): Promise<ChargePoint>;
}

export interface ConnectorService {
  list(chargePointId?: string): Promise<Connector[]>;
  /** Owner/staff may only toggle runtime status (AVAILABLE<->OFFLINE); hardware attrs are locked (BR-CHG-03). */
  update(id: string, patch: { runtimeStatus?: ConnectorRuntimeStatus }): Promise<Connector>;
  /** Admin: create a connector under a charge point — connector type/power fixed at provisioning (FR14 step 2). */
  provision(input: { chargePointId: string; connectorType: ConnectorType; powerKw: number; name?: string }): Promise<Connector>;
}

export interface StationService {
  /** Owner: own stations, any status. */
  mine(): Promise<Station[]>;
  register(input: StationRegistration): Promise<Station>;
  /** Owner: set the amenities advertised on one of their own stations (BR-STA-02). */
  updateAmenities(id: string, amenities: Amenity[]): Promise<Station>;
  /** Admin: approval queue (status = pending). */
  approvals(): Promise<Station[]>;
  /** Admin: every approved station platform-wide. Filtering/search happens client-side. */
  all(): Promise<Station[]>;
  approve(id: string): Promise<Station>;
  reject(id: string, reason: string): Promise<Station>;
}

export interface TransactionService {
  list(params?: {
    type?: TransactionType | 'all';
    method?: PaymentMethod | 'all';
    page?: number;
    pageSize?: number;
  }): Promise<Page<Transaction>>;
  summary(): Promise<TransactionSummary>;
}

export interface LicenseService {
  /** Owner: own license (status display only — renewal handled off-platform). */
  mine(): Promise<License>;
  /** Admin: all licenses with expiry monitoring. */
  list(): Promise<License[]>;
  /** Admin: manually record an off-platform renewal. */
  recordRenewal(stationId: string): Promise<License>;
}

export interface UserService {
  list(params?: { role?: string; search?: string }): Promise<UserAccount[]>;
  setStatus(id: string, status: UserStatus): Promise<UserAccount>;
}

export interface StaffService {
  /** Owner: STATION_STAFF assignments across the stations they own (BR-ACC-05 scopes this server-side). */
  list(): Promise<StationStaffMember[]>;
  /**
   * FR17 invite-by-email. Email is the only handle by design — the SRS
   * deliberately exposes no platform-wide user search or directory browsing.
   * Grants STATION_STAFF additively to an existing account, or provisions a new
   * one via the identity provider's admin API. `created` distinguishes the two
   * so the UI can say which happened. Effective immediately: v1 has no
   * invitation-acceptance step (documented simplification in FR17).
   */
  invite(input: { email: string; stationId: string }): Promise<{ member: StationStaffMember; created: boolean }>;
  /** Revokes this station assignment only — never deletes the account or its other roles. */
  revoke(userId: string, stationId: string): Promise<void>;
}

export interface PricingService {
  /** Owner's pricing & hours config for the active station (FR11). */
  get(): Promise<PricingConfig>;
  save(config: PricingConfig): Promise<PricingConfig>;
}

export interface PolicyService {
  docs(): Promise<PolicyDoc[]>;
  save(doc: { id?: string; category: string; content: string }): Promise<PolicyDoc>;
  remove(id: string): Promise<void>;
  /** Owner assistant (FR15, ask-only RAG). */
  ask(question: string): Promise<AssistantAnswer>;
}

export interface TicketService {
  /** Owner/staff: tickets routed to stations they have access to. Admin: all tickets. */
  list(params?: TicketListParams): Promise<Page<Ticket>>;
  get(id: string): Promise<Ticket>;
  /** Oldest-first. */
  messages(id: string): Promise<TicketMessage[]>;
  summary(): Promise<TicketSummary>;
  /** Append-only reply; first reply on an open ticket also flips it to in_progress. */
  reply(id: string, body: string): Promise<TicketMessage>;
  setStatus(id: string, status: TicketStatus): Promise<Ticket>;
  /** Admin only — moves the ticket to a different station's queue. */
  reassign(id: string, stationName: string): Promise<Ticket>;
  /** Admin only — pulls the ticket into central ops. */
  escalate(id: string): Promise<Ticket>;
}

export interface Services {
  dashboard: DashboardService;
  analytics: AnalyticsService;
  bookings: BookingService;
  chargePoints: ChargePointService;
  connectors: ConnectorService;
  stations: StationService;
  transactions: TransactionService;
  licenses: LicenseService;
  users: UserService;
  staff: StaffService;
  pricing: PricingService;
  policies: PolicyService;
  tickets: TicketService;
}
