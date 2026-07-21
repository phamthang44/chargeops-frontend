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
  Charger,
  ChargerStatus,
  ConnectorType,
  License,
  OwnerDashboard,
  Page,
  PaymentMethod,
  PolicyDoc,
  PricingConfig,
  StaffDashboard,
  Station,
  StationRegistration,
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
}

export interface ChargerService {
  list(stationId?: string): Promise<Charger[]>;
  /** Owners may only change display name and operational status. */
  update(id: string, patch: { name?: string; status?: ChargerStatus }): Promise<Charger>;
  /** Admin: create an UNCLAIMED charger record (connector/power fixed at provisioning). */
  provision(input: { connector: ConnectorType; powerKw: number; name?: string }): Promise<Charger>;
}

export interface StationService {
  /** Owner: own stations, any status. */
  mine(): Promise<Station[]>;
  register(input: StationRegistration): Promise<Station>;
  /** Admin: approval queue (status = pending). */
  approvals(): Promise<Station[]>;
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
  chargers: ChargerService;
  stations: StationService;
  transactions: TransactionService;
  licenses: LicenseService;
  users: UserService;
  pricing: PricingService;
  policies: PolicyService;
  tickets: TicketService;
}
