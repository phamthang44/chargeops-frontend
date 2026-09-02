/**
 * Service interfaces — the ONLY surface UI code depends on.
 * `createMockServices()` and `createRestServices()` both implement `Services`;
 * swapping mock → real API is a config change, not a UI change.
 */
import type {
  AdminDashboard,
  AdminStationDetail,
  AdminStationFilterParams,
  AdminStationListItem,
  AdministrativeProvince,
  AdministrativeWard,
  AnalyticsOverview,
  AssistantAnswer,
  Booking,
  BookingListParams,
  BookingSummary,
  ChargePoint,
  ChargePointStatusEvent,
  ConnectorProvisioningGroup,
  CheckInChallengeResponse,
  Connector,
  ConnectorRuntimeStatus,
  ConnectorStatusEvent,
  ConnectorType,
  IssueLicenseRequest,
  License,
  LicenseStatus,
  LicenseStatusEventDto,
  RenewLicenseRequest,
  OperationalChargePointStatus,
  OwnerDashboard,
  Page,
  PaymentMethod,
  PolicyDoc,
  PricingConfig,
  StationScheduleHistoryItem,
  ProvisioningStatus,
  RegisterStationRequest,
  StaffDashboard,
  StaffLookupResponse,
  StaffAssignmentStatus,
  CurrentStaffContextResponse,
  AssignStationStaffRequest,
  Amenity,
  Station,
  StationApprovalDetail,
  StationApprovalSummary,
  StationRegistration,
  StationStaffMember,
  StationStatusHistory,
  Ticket,
  TicketListParams,
  TicketMessage,
  TicketStatus,
  TicketSummary,
  Transaction,
  TransactionSummary,
  TransactionType,
  UserAccount,
  UserProfile,
  UserProfileUpdateRequest,
  UserStatus,
} from './types';

export interface LocationService {
  getProvinces(): Promise<AdministrativeProvince[]>;
  getWards(provinceCode: string): Promise<AdministrativeWard[]>;
}

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
  /** Owners/Admins may edit display name and zone label. */
  update(
    id: string,
    patch: {
      stationId?: string;
      name?: string;
      zoneLabel?: string;
    },
  ): Promise<ChargePoint>;
  /** Owners/staff change operational status (AVAILABLE <-> OFFLINE). */
  changeOperationalStatus(
    id: string,
    input: {
      stationId: string;
      operationalStatus: OperationalChargePointStatus;
      reason: string;
    },
  ): Promise<ChargePoint>;
  /** Admin: atomically create a draft charge point and its connector inventory. */
  provision(input: {
    stationId: string;
    name?: string;
    zoneLabel?: string;
    chargePointCode?: string;
    connectorGroups: ConnectorProvisioningGroup[];
  }): Promise<ChargePoint>;
  /** Admin: seal connector inventory and activate the charge point (FR14 step 3). */
  activate(id: string, stationId: string, expectedConnectorCount: number): Promise<ChargePoint>;
  /** Admin: suspend an active charge point (FR14). */
  suspend(id: string, stationId: string, reason: string): Promise<ChargePoint>;
  /** Admin: reactivate a suspended charge point (FR14). */
  reactivate(id: string, stationId: string, reason: string): Promise<ChargePoint>;
  /** Admin: get single charge point detail. */
  get(id: string, stationId: string): Promise<ChargePoint>;
  /** Admin: remove a mistaken draft. ACTIVE/SUSPENDED records are retained. */
  remove(id: string, stationId: string): Promise<void>;
  /** Admin/Owner: get status transition event history. */
  statusHistory(id: string, stationId: string): Promise<ChargePointStatusEvent[]>;
}

export interface ConnectorService {
  list(chargePointId?: string, stationId?: string): Promise<Connector[]>;
  /**
   * Owner: toggle runtime status (AVAILABLE<->OFFLINE).
   * Admin: edit hardware properties (connectorType, powerKw) while CP is PENDING_ACTIVATION.
   */
  update(
    id: string,
    patch: {
      stationId?: string;
      chargePointId?: string;
      connectorType?: ConnectorType;
      powerKw?: number;
      runtimeStatus?: ConnectorRuntimeStatus;
      reason?: string;
    },
  ): Promise<Connector>;
  /** Admin: create a connector under a charge point — connector type/power fixed at provisioning (FR14 step 2). */
  provision(input: {
    stationId?: string;
    chargePointId: string;
    connectorCode: string;
    connectorType: ConnectorType;
    powerKw: number;
    name?: string;
  }): Promise<Connector>;
  /** Admin: remove a mistaken connector while its charge point is still a draft. */
  remove(id: string, stationId: string, chargePointId: string): Promise<void>;
  /** Admin/Owner: get connector status transition event history. */
  statusHistory(id: string, stationId: string, chargePointId: string): Promise<ConnectorStatusEvent[]>;
}

export interface StationService {
  /** Owner: own stations, any status. */
  mine(params?: { pageNo?: number; pageSize?: number }): Promise<Station[]>;
  register(input: RegisterStationRequest | StationRegistration): Promise<Station>;
  /** Owner: set the amenities advertised on one of their own stations (BR-STA-02). */
  updateAmenities(id: string, amenities: Amenity[]): Promise<Station>;
  /** Admin: approval queue (status = pending). */
  approvals(params?: { pageNo?: number; pageSize?: number }): Promise<StationApprovalSummary[]>;
  /** Admin: get detailed approval request info including address, licenseSubmitted, assets. */
  approvalDetail(id: string): Promise<StationApprovalDetail>;
  /** Admin: every approved station platform-wide. Filtering/search happens client-side. */
  all(): Promise<Station[]>;
  /** Admin: paginated station list platform-wide with server-side filters. */
  adminList(params?: AdminStationFilterParams): Promise<Page<AdminStationListItem>>;
  /** Admin: 360° station detail. */
  adminDetail(stationId: string): Promise<AdminStationDetail>;
  approve(id: string): Promise<void>;
  reject(id: string, reason: string): Promise<void>;
  suspend(id: string, reason?: string): Promise<void>;
  reactivate(id: string, reason?: string): Promise<void>;
  /** Audit log: list status transitions and approval history for a station. */
  statusHistory(stationId: string): Promise<StationStatusHistory[]>;
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
  /** Admin: issue an active license to a station (POST /stations/{stationId}/licenses). */
  issue(stationId: string, input: IssueLicenseRequest): Promise<License>;
  /** Owner: own license (status display only — renewal handled off-platform). */
  mine(stationId?: string): Promise<License>;
  /** Station license history (all license periods for a station). */
  history(stationId: string): Promise<License[]>;
  /** Admin: all licenses with search, filter, and pagination. */
  list(params?: {
    pageNo?: number;
    pageSize?: number;
    search?: string;
    status?: LicenseStatus | 'all';
    stationId?: string;
    sort?: string;
  }): Promise<Page<License>>;
  /** Admin: single license detail. */
  detail(licenseId: string): Promise<License>;
  /** Admin: status-event audit timeline for a license. */
  statusEvents(licenseId: string): Promise<LicenseStatusEventDto[]>;
  /** Admin: manually record an off-platform renewal by station. */
  recordRenewal(stationId: string, input?: RenewLicenseRequest): Promise<License>;
  /** Admin: renew a license by license ID. */
  renew(licenseId: string, input?: RenewLicenseRequest): Promise<License>;
  /** Admin: suspend license. */
  suspend(stationId: string, licenseId: string, reason?: string): Promise<License>;
  /** Admin: reactivate suspended license. */
  activate(stationId: string, licenseId: string, reason?: string): Promise<License>;
  /** Admin: cancel license. */
  cancel(stationId: string, licenseId: string, reason?: string): Promise<License>;
}

export interface UserService {
  list(params?: { role?: string; search?: string }): Promise<UserAccount[]>;
  setStatus(id: string, status: UserStatus): Promise<UserAccount>;
}

export interface StaffService {
  /** Get current user's DB-backed staff assignment context. */
  currentContext(): Promise<CurrentStaffContextResponse>;
  /** Owner: Station staff assignments for a specific station (or across owner's stations). */
  list(stationId?: string, params?: { pageNo?: number; pageSize?: number; assignmentStatus?: StaffAssignmentStatus }): Promise<StationStaffMember[]>;
  /** Lookup user by email for a station to verify existence and eligibility before assignment. */
  lookup(stationId: string, email: string): Promise<StaffLookupResponse>;
  /** Assign an existing eligible user to a station as station staff. */
  assign(stationId: string, input: AssignStationStaffRequest): Promise<StationStaffMember>;
  /** Revokes station staff assignment by stationId and assignmentId. */
  revoke(stationId: string, assignmentId: string): Promise<StationStaffMember | void>;
}

export interface PricingService {
  /** Owner's pricing & hours config for one explicitly selected station (FR11). */
  get(stationId: string): Promise<PricingConfig>;
  save(stationId: string, config: PricingConfig): Promise<PricingConfig>;
  /** Operating hours version history for a station. */
  history(stationId: string): Promise<StationScheduleHistoryItem[]>;
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

export interface ProfileService {
  get(): Promise<UserProfile>;
  update(request: UserProfileUpdateRequest): Promise<UserProfile>;
}

export interface ChallengeService {
  /** Request dynamic QR check-in challenge token for physical connector display (60s TTL). */
  create(connectorId: string): Promise<CheckInChallengeResponse>;
}

export interface Services {
  profile: ProfileService;
  location: LocationService;
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
  challenge: ChallengeService;
}
