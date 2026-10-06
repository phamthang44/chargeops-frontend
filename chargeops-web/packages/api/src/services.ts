/**
 * Service interfaces — the ONLY surface UI code depends on.
 * `createMockServices()` and `createRestServices()` both implement `Services`;
 * swapping mock → real API is a config change, not a UI change.
 */
import type {
  OperationalBooking,
  OwnerActiveBookingParams,
  OwnerBookingDetail,
  OwnerBookingFilter,
  OwnerBookingListItem,
  OwnerBookingListParams,
  OwnerBookingSummary,
  AdminOperationsSummary,
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
  AdminRefundPolicyContext,
  AdminReviewRefundPolicyPayload,
  AdminReviewRefundPolicyResponse,
  OwnerAcceptStationFailurePayload,
  OwnerCancelBookingPayload,
  OwnerStationFailureContext,
  StationFailureCommandResponse,
  ConnectorIncidentResponse,
  ReportConnectorIncidentRequest,
  RecoverConnectorIncidentRequest,
  ResolveIncidentSessionRequest,
  ChargePoint,
  ChargePointStatusEvent,
  ConnectorProvisioningGroup,
  CheckInChallengeResponse,
  Connector,
  ConnectorRuntimeStatus,
  ConnectorStatusEvent,
  ConnectorType,
  ExecuteRefundRequest,
  IssueLicenseRequest,
  License,
  LicenseStatus,
  LicenseStatusEventDto,
  RefundDetail,
  RefundQueueSummary,
  RefundStatus,
  OwnerFinanceBooking,
  OwnerFinanceSummary,
  OwnerRefund,
  OwnerRefundsSummary,
  OwnerRefundRetryPayload,
  TicketEscalation,
  TicketEscalationsSummary,
  EscalateTicketPayload,
  ReviewTicketEscalationPayload,
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
  StationRegistrationDetail,
  StaffDashboard,
  StaffLookupResponse,
  StaffAssignmentStatus,
  CurrentStaffContextResponse,
  AssignStationStaffRequest,
  StaffStationOverview,
  StaffChargePointItem,
  StaffConnectorItem,
  StaffEquipmentHistoryItem,
  StaffEquipmentHistoryParams,
  StaffChangeChargePointStatusRequest,
  StaffChangeConnectorStatusRequest,
  StaffBookingListParams,
  StaffOperationalBooking,
  StaffInvitationResponse,
  StaffInvitationRequest,
  StaffInvitationListParams,
  Amenity,
  ChangeStationOperationalStatusRequest,
  Station,
  StationApprovalDetail,
  StationApprovalSummary,
  StationAsset,
  StationOperationalStatusResponse,
  StationRegistration,
  StationStaffMember,
  StationStatusHistory,
  RegisterStationAssetInput,
  ImageKitAuthResponse,
  Ticket,
  TicketEvent,
  TicketListParams,
  TicketMessage,
  TicketStatus,
  TicketSummary,
  AssignTicketRequest,
  TicketHandlerCandidate,
  RecordTicketFindingRequest,
  ResolveTicketRequest,
  StationTicketKpis,
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
  admin(): Promise<AdminOperationsSummary>;
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

/**
 * BKG-047 / FE-15: Dedicated Station Owner Booking read APIs.
 * Scoped strictly to the authenticated Owner's stations.
 */
export interface OwnerBookingService {
  list(params?: OwnerBookingListParams): Promise<Page<OwnerBookingListItem>>;
  get(bookingId: string): Promise<OwnerBookingDetail>;
  summary(params?: OwnerBookingFilter): Promise<OwnerBookingSummary>;
  activeFor(params: OwnerActiveBookingParams): Promise<Page<OperationalBooking>>;
  /** BKG-056: Read context for station failure cancellation & responsibility admission */
  getStationFailureContext(bookingId: string): Promise<OwnerStationFailureContext>;
  /** BKG-056 Bước A: Owner cancel before check-in due to station failure */
  cancelForStationFailure(bookingId: string, payload: OwnerCancelBookingPayload, idempotencyKey: string): Promise<StationFailureCommandResponse>;
  /** BKG-056 Bước B: Owner accepts station failure responsibility after booking end or in escalation */
  admitStationFailure(bookingId: string, payload: OwnerAcceptStationFailurePayload, idempotencyKey: string): Promise<StationFailureCommandResponse>;
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
  registration(id: string): Promise<StationRegistrationDetail>;
  updateRegistration(id: string, version: number, input: RegisterStationRequest): Promise<StationRegistrationDetail>;
  withdrawRegistration(id: string, version: number): Promise<void>;
  /** Owner: set the amenities advertised on one of their own stations (BR-STA-02). */
  updateAmenities(id: string, amenities: Amenity[]): Promise<Station>;
  /** Owner: change operational status (OPERATING, PAUSED, MAINTENANCE). */
  changeOperationalStatus(
    stationId: string,
    input: ChangeStationOperationalStatusRequest,
  ): Promise<StationOperationalStatusResponse>;
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
  /** Owner: get assets / gallery of station. */
  getAssets(stationId: string): Promise<StationAsset[]>;
  /** Owner: register an asset after direct client-side upload. */
  registerAsset(stationId: string, input: RegisterStationAssetInput): Promise<StationAsset>;
  /** Owner: delete an asset. */
  deleteAsset(stationId: string, assetId: string): Promise<void>;
  /** Owner: set primary cover asset. */
  setPrimaryAsset(stationId: string, assetId: string): Promise<StationAsset>;
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

export interface RefundService {
  list(params?: {
    status?: RefundStatus | 'all';
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Page<RefundDetail>>;
  get(refundId: string): Promise<RefundDetail>;
  summary(): Promise<RefundQueueSummary>;
  execute(
    refundId: string,
    request: ExecuteRefundRequest,
    idempotencyKey?: string
  ): Promise<RefundDetail>;
}

export interface OwnerFinanceService {
  summary(): Promise<OwnerFinanceSummary>;
  list(params?: { page?: number; pageSize?: number }): Promise<Page<OwnerFinanceBooking>>;
  get(bookingId: string): Promise<OwnerFinanceBooking>;
}

export interface OwnerRefundService {
  summary(): Promise<OwnerRefundsSummary>;
  list(params?: { status?: RefundStatus; page?: number; pageSize?: number }): Promise<Page<OwnerRefund>>;
  get(refundId: string): Promise<OwnerRefund>;
  retry(refundId: string, payload: OwnerRefundRetryPayload, idempotencyKey?: string): Promise<OwnerRefund>;
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

/**
 * STAFF Operations console (Ops-01..Ops-05). All calls are scoped to the
 * caller's ACTIVE station assignment server-side; `stationId` comes from
 * `staff.currentContext().station.id`.
 * `page` on every paged method is 0-based (UI convention); the REST layer
 * converts to the backend's 1-based `page` query param.
 */
export interface StaffOperationsService {
  /** Station operational overview: status + charge point / connector counts. */
  overview(stationId: string): Promise<StaffStationOverview>;
  listChargePoints(stationId: string): Promise<StaffChargePointItem[]>;
  listConnectors(stationId: string, chargePointId: string): Promise<StaffConnectorItem[]>;
  /** Optimistic-lock status change; throws `STAFF_OP_00x` ApiError on conflict. */
  changeChargePointStatus(
    stationId: string,
    chargePointId: string,
    input: StaffChangeChargePointStatusRequest,
  ): Promise<StaffChargePointItem>;
  changeConnectorStatus(
    stationId: string,
    chargePointId: string,
    connectorId: string,
    input: StaffChangeConnectorStatusRequest,
  ): Promise<StaffConnectorItem>;
  chargePointHistory(
    stationId: string,
    chargePointId: string,
    params?: StaffEquipmentHistoryParams,
  ): Promise<Page<StaffEquipmentHistoryItem>>;
  connectorHistory(
    stationId: string,
    chargePointId: string,
    connectorId: string,
    params?: StaffEquipmentHistoryParams,
  ): Promise<Page<StaffEquipmentHistoryItem>>;
  /** BKG-048 operational bookings filtered by connector / time window. */
  listBookings(stationId: string, params?: StaffBookingListParams): Promise<Page<StaffOperationalBooking>>;
}

/** Owner: staff invitations (invite, list, resend, cancel) + staff activation. */
export interface StaffInvitationService {
  invite(stationId: string, input: StaffInvitationRequest): Promise<StaffInvitationResponse>;
  list(stationId: string, params?: StaffInvitationListParams): Promise<Page<StaffInvitationResponse>>;
  resend(stationId: string, invitationId: string): Promise<StaffInvitationResponse>;
  cancel(stationId: string, invitationId: string): Promise<StaffInvitationResponse>;
  /**
   * Staff self-service: `POST /me/staff-invitation/activate` (idempotent).
   * Call only when the Keycloak realm role STAFF is present but
   * `currentContext().staff` is false; refetch `currentContext()` afterwards.
   */
  activate(): Promise<StaffInvitationResponse>;
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

export interface TicketRoleOptions {
  role?: 'owner' | 'admin' | 'staff';
  workstream?: 'all' | 'platform' | 'station';
}

export interface TicketService {
  /** Owner/staff: tickets routed to stations they have access to. Admin: all tickets. */
  list(params?: TicketListParams): Promise<Page<Ticket>>;
  get(id: string, options?: TicketRoleOptions): Promise<Ticket>;
  /** Oldest-first. */
  messages(id: string, options?: TicketRoleOptions): Promise<TicketMessage[]>;
  summary(options?: TicketRoleOptions): Promise<TicketSummary>;
  /** Append-only reply; first reply on an open ticket also flips it to in_progress. */
  reply(id: string, body: string, options?: TicketRoleOptions): Promise<TicketMessage>;
  /** BKG-052 claim atomic mutation */
  claim(id: string, expectedVersion?: number, options?: TicketRoleOptions): Promise<Ticket>;
  /** BKG-052 assign/reassign handler mutation */
  assign(id: string, request: AssignTicketRequest, options?: TicketRoleOptions): Promise<Ticket>;
  stationHandlers(id: string): Promise<TicketHandlerCandidate[]>;
  recordFinding(id: string, request: RecordTicketFindingRequest): Promise<Ticket>;
  /** BKG-052 resolve ticket with mandatory reason and 10-day auto-close countdown */
  resolve(id: string, request: ResolveTicketRequest, options?: TicketRoleOptions): Promise<Ticket>;
  /** BKG-052 reporter confirmation or auto-close */
  confirm(id: string, expectedVersion?: number, options?: TicketRoleOptions): Promise<Ticket>;
  /** BKG-052 reporter persists issue (reopen to IN_PROGRESS) */
  reopen(id: string, request: { expectedVersion?: number; reason: string }, options?: TicketRoleOptions): Promise<Ticket>;
  /** BKG-052 append-only audit event trail */
  events(id: string, options?: TicketRoleOptions): Promise<TicketEvent[]>;
  /** BKG-052 Station Staff operational KPI metrics */
  kpis(stationId: string, params?: { from?: string; to?: string; staffId?: string }): Promise<StationTicketKpis>;
  /** Legacy status changer */
  setStatus(id: string, status: TicketStatus, options?: { expectedVersion?: number; reason?: string; role?: 'owner' | 'admin' }): Promise<Ticket>;
  /** Admin only — moves the ticket to a different station's queue. */
  reassign(id: string, stationName: string): Promise<Ticket>;
  /** Admin only — pulls the ticket into central ops. */
  escalate(id: string): Promise<Ticket>;
}

export interface TicketEscalationService {
  summary(): Promise<TicketEscalationsSummary>;
  request(ticketId: string, payload: EscalateTicketPayload): Promise<TicketEscalation>;
  review(ticketId: string, payload: ReviewTicketEscalationPayload): Promise<TicketEscalation>;
  get(ticketId: string): Promise<TicketEscalation>;
  adminQueue(params?: { page?: number; pageSize?: number }): Promise<Page<TicketEscalation>>;
  adminEscalatedTickets(params?: { stationId?: string; status?: string; page?: number; pageSize?: number }): Promise<Page<Ticket>>;
  /** BKG-057: Admin get refund policy review context for active escalation */
  getRefundPolicyContext(ticketId: string, escalationId: string): Promise<AdminRefundPolicyContext>;
  /** BKG-057: Admin review and decide refund policy in active escalation */
  reviewRefundPolicy(ticketId: string, escalationId: string, payload: AdminReviewRefundPolicyPayload, idempotencyKey: string): Promise<AdminReviewRefundPolicyResponse>;
}

export interface ProfileService {
  get(): Promise<UserProfile>;
  update(request: UserProfileUpdateRequest): Promise<UserProfile>;
}

export interface ChallengeService {
  /** Request dynamic QR check-in challenge token for physical connector display (60s TTL). */
  create(connectorId: string): Promise<CheckInChallengeResponse>;
}

export interface MediaService {
  /** Request ImageKit client-side upload authentication signature */
  getImageKitAuth(): Promise<ImageKitAuthResponse>;
}

export type LegalDocType = 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'LICENSE_AGREEMENT' | 'OPERATIONAL_REGULATION';
export type TargetAudience = 'ALL' | 'DRIVER' | 'OWNER';

export interface LegalDocumentSummary {
  id: string;
  slug: string;
  docType: LegalDocType;
  targetAudience: TargetAudience;
  title: string;
  eyebrow?: string;
  summary?: string;
  version: string;
  locale: string;
  keywords?: string[];
  active: boolean;
  effectiveFrom: string;
  updatedAt: string;
}

export interface LegalDocumentDetail extends LegalDocumentSummary {
  content: string;
  createdAt: string;
}

export interface LegalDocumentSearchParams {
  search?: string;
  docType?: LegalDocType;
  audience?: TargetAudience;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface LegalDocumentsService {
  list(params?: LegalDocumentSearchParams): Promise<Page<LegalDocumentSummary>>;
  get(slug: string): Promise<LegalDocumentDetail>;
  adminList(params?: LegalDocumentSearchParams): Promise<Page<LegalDocumentSummary>>;
  adminGet(id: string): Promise<LegalDocumentDetail>;
  adminCreate(doc: {
    slug: string;
    docType: LegalDocType;
    targetAudience?: TargetAudience;
    title: string;
    eyebrow?: string;
    summary?: string;
    content: string;
    version: string;
    locale?: string;
    keywords?: string[];
    active?: boolean;
    effectiveFrom?: string;
  }): Promise<LegalDocumentDetail>;
  adminUpdate(id: string, doc: Partial<LegalDocumentDetail>): Promise<LegalDocumentDetail>;
  adminRemove(id: string): Promise<void>;
}

export interface NotificationService {
  list(params?: import('./notificationTypes').NotificationListParams): Promise<import('./notificationTypes').AppNotification[]>;
  unreadCount(): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  delete(id: string): Promise<void>;
}

/** BKG-054 / BKG-055: Operational emergency incident and recovery service */
export interface IncidentService {
  report(
    stationId: string,
    connectorId: string,
    request: ReportConnectorIncidentRequest,
    idempotencyKey?: string,
  ): Promise<ConnectorIncidentResponse>;
  get(stationId: string, incidentId: string): Promise<ConnectorIncidentResponse>;
  recover(
    stationId: string,
    incidentId: string,
    request: RecoverConnectorIncidentRequest,
    idempotencyKey?: string,
  ): Promise<ConnectorIncidentResponse>;
  resolveSession(
    stationId: string,
    incidentId: string,
    bookingId: string,
    request: ResolveIncidentSessionRequest,
    idempotencyKey?: string,
  ): Promise<ConnectorIncidentResponse>;
}

export interface Services {
  profile: ProfileService;
  location: LocationService;
  dashboard: DashboardService;
  analytics: AnalyticsService;
  bookings: BookingService;
  ownerBookings: OwnerBookingService;
  chargePoints: ChargePointService;
  connectors: ConnectorService;
  stations: StationService;
  transactions: TransactionService;
  refunds: RefundService;
  ownerFinance: OwnerFinanceService;
  ownerRefunds: OwnerRefundService;
  licenses: LicenseService;
  users: UserService;
  staff: StaffService;
  staffOperations: StaffOperationsService;
  staffInvitations: StaffInvitationService;
  pricing: PricingService;
  policies: PolicyService;
  legalDocuments: LegalDocumentsService;
  tickets: TicketService;
  ticketEscalations: TicketEscalationService;
  challenge: ChallengeService;
  media: MediaService;
  notifications: NotificationService;
  incidents: IncidentService;
}
