/**
 * REST implementation of every service — thin mappings onto the (future)
 * chargeops-backend Spring Boot API. Endpoint paths are the proposed contract;
 * adjust here (and only here) if the backend names them differently.
 * Scoping (owner sees own stations only) is enforced server-side via the
 * Keycloak token — the client never passes an owner id.
 */
import type { HttpClient } from '../http';
import type { Services, TicketRoleOptions } from '../services';
import type {
  OperationalBooking,
  OwnerBookingDetail,
  OwnerBookingListItem,
  OwnerBookingSummary,
  ChargePoint,
  ChargePointStatusEvent,
  Connector,
  ConnectorRuntimeStatus,
  ConnectorStatusEvent,
  CheckInChallengeResponse,
  License,
  OperationalChargePointStatus,
  PricingConfig,
  ProvisioningStatus,
  Station,
  StationOperationalStatusResponse,
  StationStaffMember,
  UserProfile,
  RefundDetail,
  RefundAttemptItem,
  RefundStatus,
  OwnerFinanceBooking,
  OwnerFinanceSummary,
  OwnerRefund,
  OwnerRefundsSummary,
  OwnerRefundRetryPayload,
  TicketEscalation,
  TicketEscalationsSummary,
  EscalateTicketPayload,
  Ticket,
  TicketMessage,
  TicketFinding,
  TicketListParams,
  TicketSummary,
  TicketEvent,
  StationTicketKpis,
  AssignTicketRequest,
  TicketHandlerCandidate,
  RecordTicketFindingRequest,
  ResolveTicketRequest,
  Page,
} from '../types';

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeTicketMessage(m: any, defaultTicketId = ''): TicketMessage {
  const id = m?.messageId || m?.id || generateUuidV4();
  const rawAuthorKind = m?.authorKind || 'REPORTER';
  const authorRole = m?.authorRole || (
    rawAuthorKind === 'REPORTER' ? 'driver' :
    rawAuthorKind === 'OWNER' ? 'owner' :
    rawAuthorKind === 'ADMIN' ? 'admin' : 'staff'
  );
  return {
    id,
    ticketId: m?.ticketId || defaultTicketId,
    authorId: m?.authorId || m?.authorDisplayName || 'user',
    authorName: m?.authorDisplayName || m?.authorName || 'Người gửi',
    authorRole,
    authorKind: m?.authorKind,
    authorDisplayName: m?.authorDisplayName,
    body: m?.body || '',
    createdAt: m?.createdAt || new Date().toISOString(),
  };
}

function normalizeTicketFinding(f: any): TicketFinding {
  return {
    id: f?.findingId || f?.id || generateUuidV4(),
    findingId: f?.findingId || f?.id,
    conclusion: f?.conclusion || 'OTHER',
    affectedAt: f?.affectedAt,
    reason: f?.reason || '',
    recordedAt: f?.recordedAt || new Date().toISOString(),
    recordedBy: f?.recordedBy,
  };
}

function normalizeTicketEvent(e: any): TicketEvent {
  return {
    id: e?.id || e?.eventId || generateUuidV4(),
    ticketId: e?.ticketId || '',
    actorId: e?.actorId || null,
    actorName: e?.actorName || null,
    actorKind: e?.actorKind || 'SYSTEM',
    eventType: e?.eventType || 'CLAIMED',
    fromStatus: e?.fromStatus || 'OPEN',
    toStatus: e?.toStatus || 'IN_PROGRESS',
    fromHandlerId: e?.fromHandlerId || null,
    fromHandlerName: e?.fromHandlerName || null,
    toHandlerId: e?.toHandlerId || null,
    toHandlerName: e?.toHandlerName || null,
    resolutionCycle: Number(e?.resolutionCycle ?? 0),
    reason: e?.reason || null,
    createdAt: e?.createdAt || new Date().toISOString(),
  };
}

function normalizeTicket(t: any): Ticket {
  const id = t?.ticketId || t?.id || '';
  const title = t?.subject || t?.title || 'Phiếu hỗ trợ';
  const messages = Array.isArray(t?.messages)
    ? t.messages.map((m: any) => normalizeTicketMessage(m, id))
    : undefined;
  const findings = Array.isArray(t?.findings)
    ? t.findings.map(normalizeTicketFinding)
    : undefined;
  const refundIds = Array.isArray(t?.refundIds)
    ? t.refundIds.map((r: any) => String(r))
    : undefined;

  return {
    ...t,
    id,
    ticketCode: t?.ticketCode || (id ? `TKT-${id.slice(0, 8).toUpperCase()}` : undefined),
    stationId: t?.stationId,
    stationName: t?.stationName,
    driverId: t?.reporterId || t?.driverId,
    driverName: t?.reporterName || t?.driverName,
    reporterUserId: t?.reporterId || t?.reporterUserId,
    reporterName: t?.reporterName,
    reporterId: t?.reporterId,
    assignedToUserId: t?.assignedHandlerId || t?.assignedToUserId,
    assignedToName: t?.assignedHandlerName || t?.assignedToName,
    assignedHandlerId: t?.assignedHandlerId || t?.assignedToUserId,
    assignedHandlerName: t?.assignedHandlerName || t?.assignedToName,
    version: typeof t?.version === 'number' ? t.version : 0,
    resolvedAt: t?.resolvedAt || null,
    autoCloseAt: t?.autoCloseAt || null,
    closeReason: t?.closeReason || null,
    resolutionCycle: typeof t?.resolutionCycle === 'number' ? t.resolutionCycle : 0,
    resolutionReason: t?.resolutionReason || null,
    bookingId: t?.bookingId,
    title,
    subject: t?.subject || title,
    description: t?.description || '',
    category: t?.category || 'CHARGING_ISSUE',
    priority: t?.priority || 'MEDIUM',
    status: t?.status || 'OPEN',
    createdAt: t?.createdAt || new Date().toISOString(),
    updatedAt: t?.updatedAt || t?.createdAt,
    closedAt: t?.closedAt,
    messages,
    findings,
    refundIds,
  };
}

function normalizeRefundAttempt(a: any): RefundAttemptItem {
  const attemptId = a?.attemptId || a?.id || '';
  return {
    ...a,
    id: attemptId,
    attemptId,
    sequenceNo: Number(a?.sequenceNo ?? 1),
    executionMode: a?.executionMode ?? 'SIMULATOR',
    executionTrigger: a?.executionTrigger ?? (a?.performedBy ? 'ADMIN' : 'SYSTEM_POLICY'),
    status: a?.status ?? 'STARTED',
    transferReference: a?.transferReference,
    failureCode: a?.failureCode,
    note: a?.note,
    startedAt: a?.startedAt || new Date().toISOString(),
    performedAt: a?.performedAt,
    completedAt: a?.completedAt,
    performedBy: a?.performedBy,
  };
}

function normalizeRefundDetail(r: any): RefundDetail {
  const refundId = r?.refundId || r?.id || '';
  const rawAttempts = Array.isArray(r?.attempts) ? r.attempts : [];
  const normalizedAttempts = rawAttempts.map(normalizeRefundAttempt);
  return {
    ...r,
    id: refundId,
    refundId,
    bookingId: r?.bookingId || '',
    bookingCode: r?.bookingCode,
    driverId: r?.driverId,
    driverName: r?.driverName,
    stationName: r?.stationName,
    ticketId: r?.ticketId,
    amount: Number(r?.amount ?? 0),
    currency: r?.currency ?? 'VND',
    reason: r?.reason ?? 'VOLUNTARY_GRACE',
    basisType: r?.basisType ?? 'BOOKING_CANCELLATION',
    basisId: r?.basisId || '',
    status: (r?.status as RefundStatus) ?? 'PENDING',
    executionPolicy: r?.executionPolicy ?? (r?.reason === 'VOLUNTARY_GRACE' ? 'AUTO_FIRST_ATTEMPT' : 'ADMIN_REQUIRED'),
    requiresAdminAction: typeof r?.requiresAdminAction === 'boolean'
      ? r.requiresAdminAction
      : (r?.reason !== 'VOLUNTARY_GRACE' || normalizedAttempts.some((att: any) => att.status === 'FAILED')),
    version: Number(r?.version ?? 0),
    decisionAt: r?.decisionAt || new Date().toISOString(),
    decidedBy: r?.decidedBy || '',
    successfulAttemptId: r?.successfulAttemptId,
    transferReference: r?.transferReference,
    completedAt: r?.completedAt,
    attempts: normalizedAttempts,
  };
}

const STATION_DAY_TO_UI: Record<string, string> = {
  MONDAY: 'T2',
  TUESDAY: 'T3',
  WEDNESDAY: 'T4',
  THURSDAY: 'T5',
  FRIDAY: 'T6',
  SATURDAY: 'T7',
  SUNDAY: 'CN',
};

const UI_DAY_TO_STATION: Record<string, string> = Object.fromEntries(
  Object.entries(STATION_DAY_TO_UI).map(([stationDay, uiDay]) => [uiDay, stationDay]),
);

const TOU_DAY_TO_UI = {
  DAILY: 'daily',
  WEEKDAY: 'weekdays',
  WEEKEND: 'weekends',
} as const;

const UI_DAY_TO_TOU = {
  daily: 'DAILY',
  weekdays: 'WEEKDAY',
  weekends: 'WEEKEND',
} as const;

function hhmm(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 5) : '';
}

function normalizePricing(raw: any): PricingConfig {
  const open24Hours = Boolean(raw?.open24Hours);
  return {
    minBookingDurationMin: Number(raw?.minBookingDurationMin) || 30,
    bufferMinutes: Number(raw?.availability?.bufferMinutes) || 10,
    basePriceVnd: Number(raw?.basePriceVnd) || 3400,
    open24Hours,
    hours: (raw?.hours ?? []).map((hour: any) => ({
      day: STATION_DAY_TO_UI[String(hour.day)] ?? String(hour.day),
      open: open24Hours ? '00:00' : hhmm(hour.openTime),
      close: open24Hours ? '00:00' : hhmm(hour.closeTime),
      open24: Boolean(hour.enabled),
    })),
    touRules: (raw?.touRules ?? []).map((rule: any) => ({
      id: String(rule.id),
      name: String(rule.name),
      days: TOU_DAY_TO_UI[String(rule.dayType) as keyof typeof TOU_DAY_TO_UI] ?? 'daily',
      from: hhmm(rule.startTime),
      to: hhmm(rule.endTime),
      rateVnd: Number(rule.rateVnd),
    })),
    availability: {
      autoLock: Boolean(raw?.availability?.autoLock),
      maxAdvanceDays: Number(raw?.availability?.maxAdvanceDays) || 2,
      bufferMinutes: Number(raw?.availability?.bufferMinutes) || 10,
    },
    scheduleEffectiveFrom: raw?.scheduleEffectiveFrom ?? null,
    scheduleEffectiveTo: raw?.scheduleEffectiveTo ?? null,
    scheduleStatus: raw?.scheduleStatus ?? (raw?.scheduleEffectiveFrom ? 'ACTIVE' : 'DEFAULT'),
    version: raw?.version != null ? Number(raw.version) : 0,
  };
}

function pricingRequest(config: PricingConfig) {
  const open24Hours = Boolean(config.open24Hours);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return {
    minBookingDurationMin: config.minBookingDurationMin,
    basePriceVnd: config.basePriceVnd,
    open24Hours,
    hours: config.hours.map((hour) => ({
      day: UI_DAY_TO_STATION[hour.day] ?? hour.day,
      openTime: !open24Hours && hour.open24 ? hour.open : null,
      closeTime: !open24Hours && hour.open24 ? hour.close : null,
      enabled: open24Hours || hour.open24,
    })),
    touRules: config.touRules.map((rule) => ({
      id: uuid.test(rule.id) ? rule.id : null,
      name: rule.name,
      periodCode:
        rule.rateVnd > config.basePriceVnd
          ? 'PEAK'
          : rule.rateVnd < config.basePriceVnd
            ? 'OFF_PEAK'
            : 'NORMAL',
      dayType: UI_DAY_TO_TOU[rule.days],
      startTime: rule.from,
      endTime: rule.to,
      rateVnd: rule.rateVnd,
    })),
    version: config.version != null ? Number(config.version) : 0,
  };
}

function isAdminRoute(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
}

function normalizeChargePoint(cp: any): ChargePoint {
  if (!cp) return cp;
  const provisioningStatus: ProvisioningStatus =
    String(cp.provisioningStatus || 'PENDING_ACTIVATION').toUpperCase() as ProvisioningStatus;
  const operationalStatus: OperationalChargePointStatus =
    String(cp.operationalStatus || 'AVAILABLE').toUpperCase() as OperationalChargePointStatus;

  return {
    ...cp,
    chargePointCode: cp.chargePointCode || cp.id,
    name: cp.name || cp.chargePointCode || cp.id,
    zoneLabel: cp.zoneLabel ?? null,
    maxPowerKw: Number(cp.maxPowerKw) || 0,
    provisioningStatus,
    operationalStatus,
  };
}

function normalizeConnector(c: any): Connector {
  if (!c) return c;
  const rStatus = String(c.runtimeStatus || 'AVAILABLE').toUpperCase().replace(/[-_]/g, '');
  let runtimeStatus: ConnectorRuntimeStatus = 'AVAILABLE';
  if (rStatus === 'INUSE' || rStatus === 'IN_USE') {
    runtimeStatus = 'IN_USE';
  } else if (rStatus === 'OFFLINE') {
    runtimeStatus = 'OFFLINE';
  } else {
    runtimeStatus = 'AVAILABLE';
  }

  return {
    ...c,
    connectorCode: c.connectorCode || c.id,
    name: c.name || c.connectorCode || `Cổng ${c.connectorType || 'Sạc'} (${c.powerKw || 0} kW)`,
    connectorType: c.connectorType || 'CCS2',
    powerKw: Number(c.powerKw) || 0,
    chargerType: c.chargerType || 'DC',
    runtimeStatus,
    utilizationPct: Number(c.utilizationPct) || 0,
    sessionsToday: Number(c.sessionsToday) || 0,
    uptime30dPct: Number(c.uptime30dPct) || 99,
    kwhToday: Number(c.kwhToday) || 0,
    faultCount: Number(c.faultCount) || 0,
    lastSeen: c.lastSeen || new Date().toISOString(),
  };
}

export function createRestServices(http: HttpClient): Services {
  return {
    profile: {
      get: () => http.get<UserProfile>('/me/profile'),
      update: (input) => http.put<UserProfile>('/me/profile', input),
    },

    location: {
      getProvinces: () => http.get('/administrative-units/provinces'),
      getWards: (provinceCode: string) => http.get(`/administrative-units/provinces/${provinceCode}/wards`),
    },

    dashboard: {
      owner: () => http.get('/dashboard/owner'),
      admin: () => http.get('/dashboard/admin'),
      staff: () => http.get('/dashboard/staff'),
    },

    analytics: {
      overview: () => http.get('/admin/analytics/overview'),
    },

    bookings: {
      list: (params = {}) => http.get('/bookings', params),
      get: (id) => http.get(`/bookings/${id}`),
      summary: () => http.get('/bookings/summary'),
      cancel: (id) => http.post(`/bookings/${id}/cancel`),
      activeFor: (connectorIds) => http.get('/bookings/active', { connectorIds: connectorIds.join(',') }),
    },

    ownerBookings: {
      list: async (params = {}) => {
        const query: Record<string, any> = {};
        if (params.stationId) query.stationId = params.stationId;
        if (params.connectorId) query.connectorId = params.connectorId;
        if (params.from) query.from = params.from;
        if (params.to) query.to = params.to;
        if (params.status && (params.status as any) !== 'all') query.status = params.status;
        query.page = (params.page ?? 0) + 1; // UI 0-based to API 1-based
        query.size = params.pageSize ?? 20;

        const res: any = await http.get('/owner/bookings', query);
        const rawItems = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const total = typeof res?.total === 'number'
          ? res.total
          : typeof res?.meta?.totalElements === 'number'
          ? res.meta.totalElements
          : rawItems.length;

        return {
          items: rawItems.map((item: any) => ({
            bookingId: item.bookingId,
            bookingCode: item.bookingCode,
            status: item.status,
            persistedStatus: item.persistedStatus ?? item.status,
            stateReconciliationPending: Boolean(item.stateReconciliationPending),
            cancellationReason: item.cancellationReason ?? null,
            stationId: item.stationId,
            stationName: item.stationName,
            connectorId: item.connectorId,
            connectorCode: item.connectorCode,
            driverDisplayName: item.driverDisplayName || 'Tài xế',
            startAt: item.startAt,
            endAt: item.endAt,
            checkInDeadline: item.checkInDeadline ?? null,
            checkedInAt: item.checkedInAt ?? null,
            totalAmount: Number(item.totalAmount ?? 0),
            currency: item.currency ?? 'VND',
          })),
          total,
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 20,
        };
      },

      get: async (bookingId: string) => {
        const res: any = await http.get(`/owner/bookings/${bookingId}`);
        const data = res?.data ?? res;
        return {
          ...data,
          bookingId: data.bookingId,
          bookingCode: data.bookingCode,
          status: data.status,
          persistedStatus: data.persistedStatus ?? data.status,
          stateReconciliationPending: Boolean(data.stateReconciliationPending),
          cancellationReason: data.cancellationReason ?? null,
          version: Number(data.version ?? 0),
          driverDisplayName: data.driverDisplayName || 'Tài xế',
          station: data.station,
          timezone: data.timezone || 'Asia/Ho_Chi_Minh',
          startAt: data.startAt,
          endAt: data.endAt,
          durationMin: Number(data.durationMin ?? 0),
          totalAmount: Number(data.totalAmount ?? 0),
          currency: data.currency ?? 'VND',
          priceLines: Array.isArray(data.priceLines) ? data.priceLines : [],
          pricingBasis: data.pricingBasis,
          policyVersion: data.policyVersion,
          paymentHoldExpiresAt: data.paymentHoldExpiresAt,
          paymentConfirmedAt: data.paymentConfirmedAt ?? null,
          freeCancellationDeadline: data.freeCancellationDeadline ?? null,
          checkInOpensAt: data.checkInOpensAt,
          checkInDeadline: data.checkInDeadline,
          checkedInAt: data.checkedInAt ?? null,
          chargingStartedAt: data.chargingStartedAt ?? null,
          completedAt: data.completedAt ?? null,
          payment: data.payment,
          checkout: data.checkout,
          refunds: Array.isArray(data.refunds) ? data.refunds : [],
          actions: {
            canCancelForStationFailure: Boolean(data.actions?.canCancelForStationFailure),
            canViewFinancials: Boolean(data.actions?.canViewFinancials),
            canReportIncident: Boolean(data.actions?.canReportIncident),
          },
        } as OwnerBookingDetail;
      },

      summary: async (params = {}) => {
        const query: Record<string, any> = {};
        if (params.stationId) query.stationId = params.stationId;
        if (params.connectorId) query.connectorId = params.connectorId;
        if (params.from) query.from = params.from;
        if (params.to) query.to = params.to;
        if (params.status && (params.status as any) !== 'all') query.status = params.status;

        const res: any = await http.get('/owner/bookings/summary', query);
        const data = res?.data ?? res;
        return {
          totalBookings: Number(data?.totalBookings ?? 0),
          pending: Number(data?.pending ?? 0),
          confirmed: Number(data?.confirmed ?? 0),
          inSession: Number(data?.inSession ?? 0),
          completed: Number(data?.completed ?? 0),
          cancelled: Number(data?.cancelled ?? 0),
          expired: Number(data?.expired ?? 0),
          noShow: Number(data?.noShow ?? 0),
        } as OwnerBookingSummary;
      },

      activeFor: async (params) => {
        const query: Record<string, any> = {
          stationId: params.stationId,
        };
        if (params.chargePointId) query.chargePointId = params.chargePointId;
        if (params.connectorId) query.connectorId = params.connectorId;
        query.page = (params.page ?? 0) + 1;
        query.size = params.size ?? 20;

        const res: any = await http.get('/owner/bookings/active-for', query);
        const rawItems = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const total = typeof res?.total === 'number'
          ? res.total
          : typeof res?.meta?.totalElements === 'number'
          ? res.meta.totalElements
          : rawItems.length;

        return {
          items: rawItems.map((item: any) => ({
            bookingId: item.bookingId,
            bookingCode: item.bookingCode,
            status: item.status,
            cancellationReason: item.cancellationReason ?? null,
            stationId: item.stationId,
            connectorId: item.connectorId,
            connectorCode: item.connectorCode,
            driverDisplayName: item.driverDisplayName || 'Tài xế',
            startAt: item.startAt,
            endAt: item.endAt,
            checkInDeadline: item.checkInDeadline,
            checkedInAt: item.checkedInAt ?? null,
          })),
          total,
          page: params.page ?? 0,
          pageSize: params.size ?? 20,
        };
      },
    },

    chargePoints: {
      async list(stationId) {
        if (stationId) {
          if (isAdminRoute()) {
            const res = await http.get<ChargePoint[]>(`/admin/stations/${stationId}/charge-points`);
            return (res ?? []).map(normalizeChargePoint);
          }
          const res = await http.get<ChargePoint[]>(`/owner/stations/${stationId}/charge-points`);
          return (res ?? []).map(normalizeChargePoint);
        }
        return [];
      },
      update: async (id, patch) => {
        if (isAdminRoute()) {
          if (patch.stationId) {
            const res = await http.patch<ChargePoint>(`/admin/stations/${patch.stationId}/charge-points/${id}`, {
              name: patch.name,
              zoneLabel: patch.zoneLabel,
            });
            return normalizeChargePoint(res);
          }
          const res = await http.patch<ChargePoint>(`/admin/charge-points/${id}`, patch);
          return normalizeChargePoint(res);
        }
        if (patch.stationId) {
          const res = await http.patch<ChargePoint>(
            `/owner/stations/${patch.stationId}/charge-points/${id}`,
            { name: patch.name, zoneLabel: patch.zoneLabel },
          );
          return normalizeChargePoint(res);
        }
        const res = await http.patch<ChargePoint>(`/charge-points/${id}`, patch);
        return normalizeChargePoint(res);
      },
      changeOperationalStatus: async (id, input) => {
        const res = await http.patch<ChargePoint>(
          `/owner/stations/${input.stationId}/charge-points/${id}/operational-status`,
          { operationalStatus: input.operationalStatus, reason: input.reason },
        );
        return normalizeChargePoint(res);
      },
      provision: async (input) => {
        const res = await http.post<ChargePoint>(`/admin/stations/${input.stationId}/charge-points`, input);
        return normalizeChargePoint(res);
      },
      activate: async (id, stationId, expectedConnectorCount) => {
        const res = await http.post<ChargePoint>(
          `/admin/stations/${stationId}/charge-points/${id}/activate`,
          { expectedConnectorCount },
        );
        return normalizeChargePoint(res);
      },
      suspend: async (id, stationId, reason) => {
        const res = await http.post<ChargePoint>(`/admin/stations/${stationId}/charge-points/${id}/suspend`, { reason });
        return normalizeChargePoint(res);
      },
      reactivate: async (id, stationId, reason) => {
        const res = await http.post<ChargePoint>(`/admin/stations/${stationId}/charge-points/${id}/reactivate`, { reason });
        return normalizeChargePoint(res);
      },
      get: async (id, stationId) => {
        const res = await http.get<ChargePoint>(`/admin/stations/${stationId}/charge-points/${id}`);
        return normalizeChargePoint(res);
      },
      remove: (id, stationId) =>
        http.delete<void>(`/admin/stations/${stationId}/charge-points/${id}`),
      statusHistory: (id, stationId) => {
        const prefix = isAdminRoute() ? '/admin' : '/owner';
        return http.get<ChargePointStatusEvent[]>(`${prefix}/stations/${stationId}/charge-points/${id}/status-history`);
      },
    },

    connectors: {
      async list(chargePointId, stationId) {
        if (isAdminRoute()) {
          if (stationId && chargePointId) {
            const res = await http.get<Connector[]>(`/admin/stations/${stationId}/charge-points/${chargePointId}/connectors`);
            return (res ?? []).map(normalizeConnector);
          }
          if (chargePointId) {
            const res = await http.get<Connector[]>(`/admin/charge-points/${chargePointId}/connectors`).catch(() => []);
            return (res ?? []).map(normalizeConnector);
          }
          return [];
        }
        if (stationId && chargePointId) {
          const res = await http.get<Connector[]>(`/owner/stations/${stationId}/charge-points/${chargePointId}/connectors`);
          return (res ?? []).map(normalizeConnector);
        }
        if (stationId) {
          try {
            const cps = await http
              .get<ChargePoint[]>(`/owner/stations/${stationId}/charge-points`)
              .catch(() => [] as ChargePoint[]);
            if (cps.length === 0) return [];
            const connectorResults = await Promise.all(
              cps.map((cp) =>
                http
                  .get<Connector[]>(`/owner/stations/${stationId}/charge-points/${cp.id}/connectors`)
                  .catch(() => [] as Connector[]),
              ),
            );
            return connectorResults.flat().map(normalizeConnector);
          } catch {
            return [];
          }
        }
        return [];
      },
      update: async (id, patch) => {
        if (isAdminRoute()) {
          const payload = {
            connectorType: patch.connectorType,
            powerKw: patch.powerKw,
          };
          const res = await http.patch<Connector>(
            `/admin/stations/${patch.stationId}/charge-points/${patch.chargePointId}/connectors/${id}`,
            payload,
          );
          return normalizeConnector(res);
        }
        const rawStatus = patch.runtimeStatus || (patch as any).status;
        const runtimeStatus =
          rawStatus === 'offline' || rawStatus === 'OFFLINE' ? 'OFFLINE' : 'AVAILABLE';
        const res = await http.patch<Connector>(
          `/owner/stations/${patch.stationId}/charge-points/${patch.chargePointId}/connectors/${id}/runtime-status`,
          { runtimeStatus, reason: patch.reason },
        );
        return normalizeConnector(res);
      },
      provision: async (input) => {
        const payload = {
          connectorCode: input.connectorCode,
          connectorType: input.connectorType,
          powerKw: input.powerKw,
        };
        const res = await (input.stationId
          ? http.post<Connector>(`/admin/stations/${input.stationId}/charge-points/${input.chargePointId}/connectors`, payload)
          : http.post<Connector>(`/admin/connectors`, payload));
        return normalizeConnector(res);
      },
      remove: (id, stationId, chargePointId) =>
        http.delete<void>(`/admin/stations/${stationId}/charge-points/${chargePointId}/connectors/${id}`),
      statusHistory: (id, stationId, chargePointId) => {
        const prefix = isAdminRoute() ? '/admin' : '/owner';
        return http.get<ConnectorStatusEvent[]>(
          `${prefix}/stations/${stationId}/charge-points/${chargePointId}/connectors/${id}/status-history`,
        );
      },
    },

    stations: {
      mine: (params = {}) =>
        http
          .get<Station[]>('/owner/stations/mine', params)
          .catch(() => http.get<Station[]>('/stations/mine', params)),
      register: (input) =>
        http
          .post<Station>('/owner/stations', input)
          .catch(() => http.post<Station>('/stations', input)),
      updateAmenities: (id, amenities) => http.put(`/stations/${id}/amenities`, { amenities }),
      changeOperationalStatus: (stationId, input) =>
        http.patch<StationOperationalStatusResponse>(`/owner/stations/${stationId}/operational-status`, input),
      approvals: (params = {}) => http.get('/admin/station-approvals', params),
      approvalDetail: (id) => http.get(`/admin/station-approvals/${id}`),
      all: () => http.get('/admin/stations'),
      adminList: (params = {}) => http.get('/admin/stations', params),
      adminDetail: (id) => http.get(`/admin/stations/${id}`),
      approve: (id) => http.post(`/admin/station-approvals/${id}/approve`),
      reject: (id, reason) => http.post(`/admin/station-approvals/${id}/reject`, { reason }),
      suspend: (id, reason) => http.post(`/admin/stations/${id}/suspend`, { reason }),
      reactivate: (id, reason) => http.post(`/admin/stations/${id}/reactivate`, { reason }),
      statusHistory: (id) => http.get(`/stations/${id}/status-history`),
      getAssets: (stationId) => http.get(`/owner/stations/${stationId}/assets`),
      registerAsset: (stationId, input) => http.post(`/owner/stations/${stationId}/assets/register`, input),
      deleteAsset: (stationId, assetId) => http.delete(`/owner/stations/${stationId}/assets/${assetId}`),
      setPrimaryAsset: (stationId, assetId) => http.patch(`/owner/stations/${stationId}/assets/${assetId}/primary`),
    },

    transactions: {
      list: (params = {}) => http.get('/transactions', params),
      summary: () => http.get('/transactions/summary'),
    },

    refunds: {
      list: async (params = {}) => {
        const query: Record<string, any> = {};
        if (params.status && params.status !== 'all') query.status = params.status;
        if (params.search) query.search = params.search;
        query.page = (params.page ?? 0) + 1;
        query.size = params.pageSize ?? 10;
        const res: any = await http.get('/admin/refunds', query);
        const rawItems = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const total = typeof res?.total === 'number'
          ? res.total
          : typeof res?.meta?.totalElements === 'number'
          ? res.meta.totalElements
          : rawItems.length;
        return {
          items: rawItems.map(normalizeRefundDetail),
          total,
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 10,
        };
      },
      get: async (refundId) => {
        const res: any = await http.get(`/admin/refunds/${refundId}`);
        const data = res?.data ?? res;
        return normalizeRefundDetail(data);
      },
      summary: async () => {
        const res: any = await http.get('/admin/refunds', { page: 1, size: 1 });
        const counts = res?.counts ?? res?.meta?.counts ?? res?.extra ?? {};
        const pendingCount = Number(counts?.PENDING ?? 0);
        const succeededCount = Number(counts?.SUCCEEDED ?? 0);
        return {
          totalPendingCount: pendingCount,
          totalPendingAmountVnd: 0,
          totalSucceededCount: succeededCount,
          totalSucceededAmountVnd: 0,
        };
      },
      execute: async (refundId, request, idempotencyKey) => {
        const key = idempotencyKey || generateUuidV4();
        const res: any = await http.post(
          `/admin/refunds/${refundId}/execute`,
          request,
          { headers: { 'Idempotency-Key': key } },
        );
        const data = res?.data ?? res;
        return normalizeRefundDetail(data);
      },
    },

    ownerFinance: {
      summary: async () => {
        try {
          const res: any = await http.get('/owner/finance/summary');
          return (res?.data ?? res) as OwnerFinanceSummary;
        } catch {
          // Fallback calculating from available ledger items
          const query = { page: 1, size: 100 };
          const res: any = await http.get('/owner/finance/bookings', query).catch(() => ({ items: [], total: 0 }));
          const items: OwnerFinanceBooking[] = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
          let grossVnd = 0;
          let refundedVnd = 0;
          let pendingRefundVnd = 0;
          let paidBookings = 0;
          for (const b of items) {
            grossVnd += b.collectedAmount || 0;
            refundedVnd += b.refundedAmount || 0;
            pendingRefundVnd += b.pendingRefundAmount || 0;
            if (b.paymentStatus === 'PAID') paidBookings++;
          }
          return {
            grossVnd,
            refundedVnd,
            netVnd: grossVnd - refundedVnd,
            pendingRefundVnd,
            totalBookings: typeof res?.total === 'number' ? res.total : items.length,
            paidBookings,
          };
        }
      },
      list: async (params = {}) => {
        const query: Record<string, any> = {
          page: (params.page ?? 0) + 1,
          size: params.pageSize ?? 20,
        };
        const res: any = await http.get('/owner/finance/bookings', query);
        const rawItems = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const total = typeof res?.total === 'number'
          ? res.total
          : typeof res?.meta?.totalElements === 'number'
          ? res.meta.totalElements
          : rawItems.length;
        return {
          items: rawItems,
          total,
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 20,
        };
      },
      get: async (bookingId: string) => {
        const res: any = await http.get(`/owner/finance/bookings/${bookingId}`);
        return (res?.data ?? res) as OwnerFinanceBooking;
      },
    },

    ownerRefunds: {
      summary: async () => {
        try {
          const res: any = await http.get('/owner/refunds/summary');
          return (res?.data ?? res) as OwnerRefundsSummary;
        } catch {
          // Fallback calculating from refund items
          const res: any = await http.get('/owner/refunds', { page: 1, size: 100 }).catch(() => ({ items: [], total: 0 }));
          const items: OwnerRefund[] = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
          let totalPendingCount = 0;
          let totalSucceededCount = 0;
          let totalFailedAttemptsCount = 0;
          let requiresOwnerActionCount = 0;
          let totalRefundAmountVnd = 0;
          let pendingRefundAmountVnd = 0;
          for (const r of items) {
            if (r.status === 'PENDING') {
              totalPendingCount++;
              pendingRefundAmountVnd += r.amount || 0;
            } else if (r.status === 'SUCCEEDED') {
              totalSucceededCount++;
              totalRefundAmountVnd += r.amount || 0;
            }
            if (r.requiresOwnerAction) requiresOwnerActionCount++;
            if (r.attempts?.some((a) => a.status === 'FAILED')) totalFailedAttemptsCount++;
          }
          return {
            totalPendingCount,
            totalSucceededCount,
            totalFailedAttemptsCount,
            requiresOwnerActionCount,
            totalRefundAmountVnd,
            pendingRefundAmountVnd,
          };
        }
      },
      list: async (params = {}) => {
        const query: Record<string, any> = {};
        if (params.status) query.status = params.status;
        query.page = (params.page ?? 0) + 1;
        query.size = params.pageSize ?? 20;
        const res: any = await http.get('/owner/refunds', query);
        const rawItems = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const total = typeof res?.total === 'number'
          ? res.total
          : typeof res?.meta?.totalElements === 'number'
          ? res.meta.totalElements
          : rawItems.length;
        return {
          items: rawItems,
          total,
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 20,
        };
      },
      get: async (refundId: string) => {
        const res: any = await http.get(`/owner/refunds/${refundId}`);
        return (res?.data ?? res) as OwnerRefund;
      },
      retry: async (refundId: string, payload: OwnerRefundRetryPayload, idempotencyKey?: string) => {
        const key = idempotencyKey || generateUuidV4();
        const res: any = await http.post(
          `/owner/refunds/${refundId}/retry`,
          payload,
          { headers: { 'Idempotency-Key': key } },
        );
        return (res?.data ?? res) as OwnerRefund;
      },
    },

    licenses: {
      issue: (stationId, input) =>
        http
          .post<License>(`/admin/stations/${stationId}/licenses`, input)
          .catch(() => http.post<License>(`/stations/${stationId}/licenses`, input)),
      mine: async (stationId) => {
        if (stationId) {
          return http.get<License>(`/owner/licenses/${stationId}`);
        }
        return null as any;
      },
      history: (stationId) =>
        http
          .get<License[]>(`/admin/stations/${stationId}/licenses`)
          .catch(() => http.get<License[]>(`/stations/${stationId}/licenses`)),
      list: (params = {}) => http.get('/admin/licenses', params),
      detail: (licenseId) => http.get<License>(`/admin/licenses/${licenseId}`),
      statusEvents: (licenseId) => http.get(`/admin/licenses/${licenseId}/status-events`),
      recordRenewal: (licenseIdOrStationId, input) =>
        http
          .post<License>(`/admin/licenses/${licenseIdOrStationId}/renew`, input)
          .catch(() => http.post<License>(`/stations/${licenseIdOrStationId}/licenses/renew`, input)),
      renew: (licenseId, input) => http.post(`/admin/licenses/${licenseId}/renew`, input),
      suspend: (stationId, licenseId, reason) => {
        const id = licenseId || stationId;
        return http.post<License>(`/admin/licenses/${id}/suspend`, { reason });
      },
      activate: (stationId, licenseId, reason) => {
        const id = licenseId || stationId;
        return http.post<License>(`/admin/licenses/${id}/reactivate`, { reason });
      },
      cancel: (stationId, licenseId, reason) => {
        const id = licenseId || stationId;
        return http.post<License>(`/admin/licenses/${id}/cancel`, { reason });
      },
    },

    users: {
      list: (params = {}) => http.get('/admin/users', params),
      setStatus: (id, status) => http.patch(`/admin/users/${id}/status`, { status }),
    },

    staff: {
      currentContext: () => http.get('/me/staff-context'),
      list: async (stationId, params = {}) => {
        const queryParams: Record<string, unknown> = { ...params };
        if (stationId && stationId !== 'ALL') {
          queryParams.stationId = stationId;
        }
        const res = await http.get<StationStaffMember[] | { items?: StationStaffMember[] }>(
          '/owner/staffs',
          queryParams,
        );
        if (Array.isArray(res)) return res;
        return (res as { items?: StationStaffMember[] })?.items ?? [];
      },
      lookup: (stationId, email) =>
        http.get(`/owner/stations/${stationId}/staffs/lookup`, { email }),
      assign: (stationId, input) =>
        http.post(`/owner/stations/${stationId}/staffs`, input),
      revoke: (stationId, assignmentId) =>
        http.delete(`/owner/stations/${stationId}/staffs/${assignmentId}`),
    },

    pricing: {
      get: async (stationId) =>
        normalizePricing(await http.get(`/owner/stations/${stationId}/pricing`)),
      save: async (stationId, config) =>
        normalizePricing(
          await http.put(
            `/owner/stations/${stationId}/pricing`,
            pricingRequest(config),
          ),
        ),
      history: async (stationId) => {
        const res: any = await http.get(`/owner/stations/${stationId}/pricing/schedule-history`);
        const list = Array.isArray(res) ? res : res?.data ?? [];
        return list.map((item: any) => ({
          scheduleId: String(item.scheduleId),
          effectiveFrom: String(item.effectiveFrom),
          effectiveTo: item.effectiveTo ? String(item.effectiveTo) : null,
          status: item.status === 'ACTIVE' ? 'ACTIVE' : 'EXPIRED',
          open24Hours: Boolean(item.open24Hours),
          hours: (item.hours ?? []).map((hour: any) => ({
            day: STATION_DAY_TO_UI[String(hour.day)] ?? String(hour.day),
            open: item.open24Hours ? '00:00' : hhmm(hour.openTime),
            close: item.open24Hours ? '00:00' : hhmm(hour.closeTime),
            open24: Boolean(hour.enabled),
          })),
          changedByName: String(item.changedByName || 'Hệ thống'),
          changedAt: String(item.changedAt || item.effectiveFrom),
        }));
      },
    },

    policies: {
      docs: () => http.get('/policies'),
      save: (doc) => (doc.id ? http.patch(`/policies/${doc.id}`, doc) : http.post('/policies', doc)),
      remove: (id) => http.delete(`/policies/${id}`),
      ask: (question) => http.post('/assistant/ask', { question }),
    },

    legalDocuments: {
      list: (params = {}) => http.get('/legal-documents', params),
      get: (slug) => http.get(`/legal-documents/${slug}`),
      adminList: (params = {}) => http.get('/admin/legal-documents', params),
      adminGet: (id) => http.get(`/admin/legal-documents/${id}`),
      adminCreate: (doc) => http.post('/admin/legal-documents', doc),
      adminUpdate: (id, doc) => http.put(`/admin/legal-documents/${id}`, doc),
      adminRemove: (id) => http.delete(`/admin/legal-documents/${id}`),
    },

    tickets: {
      list: async (params: TicketListParams = {}) => {
        const query: Record<string, any> = {};
        if (params.status && params.status !== 'all') {
          query.status = String(params.status).toUpperCase();
        }
        if (params.stationId && params.stationId !== 'all') {
          query.stationId = params.stationId;
        }
        // Spring Boot is 1-indexed
        query.page = (params.page ?? 0) + 1;
        query.size = params.pageSize ?? 20;

        let endpoint = '/tickets';
        if (params.role === 'owner') {
          endpoint = '/owner/tickets';
        } else if (params.role === 'admin') {
          if (params.workstream === 'station') {
            endpoint = '/admin/tickets/escalated';
          } else if (params.workstream === 'platform') {
            endpoint = '/admin/tickets';
          }
        }

        const res: any = await http.get(endpoint, query);
        const rawItems = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const total = typeof res?.total === 'number'
          ? res.total
          : typeof res?.meta?.totalElements === 'number'
          ? res.meta.totalElements
          : rawItems.length;

        return {
          items: rawItems.map(normalizeTicket),
          total,
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 20,
        };
      },
      get: async (id: string, options?: TicketRoleOptions) => {
        let endpoint = `/tickets/${id}`;
        if (options?.role === 'owner') endpoint = `/owner/tickets/${id}`;
        else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}`;

        const res: any = await http.get(endpoint);
        const data = res?.data ?? res;
        return normalizeTicket(data);
      },
      messages: async (id: string, options?: TicketRoleOptions) => {
        try {
          let endpoint = `/tickets/${id}/messages`;
          if (options?.role === 'owner') endpoint = `/owner/tickets/${id}/messages`;
          else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}/messages`;

          const res: any = await http.get(endpoint);
          const items = Array.isArray(res) ? res : res?.data ?? [];
          return items.map((m: any) => normalizeTicketMessage(m, id));
        } catch {
          // Fallback: fetch ticket which includes messages list
          let endpoint = `/tickets/${id}`;
          if (options?.role === 'owner') endpoint = `/owner/tickets/${id}`;
          else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}`;

          const res: any = await http.get(endpoint);
          const data = res?.data ?? res;
          const ticket = normalizeTicket(data);
          return ticket.messages ?? [];
        }
      },
      summary: async (options?: TicketRoleOptions) => {
        let endpoint = '/tickets';
        if (options?.role === 'owner') endpoint = '/owner/tickets';
        else if (options?.role === 'admin') {
          if (options?.workstream === 'platform') endpoint = '/admin/tickets';
          else if (options?.workstream === 'station') endpoint = '/admin/tickets/escalated';
        }
        try {
          if (endpoint === '/tickets') {
            return await http.get<TicketSummary>('/tickets/summary');
          }
        } catch {
          // Fallback summary from ticket list
        }
        const res: any = await http.get(endpoint, { page: 1, size: 100 }).catch(() => ({ items: [] }));
        const items: any[] = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const open = items.filter((t) => String(t.status).toLowerCase() === 'open').length;
        const inProgress = items.filter((t) => String(t.status).toLowerCase() === 'in_progress').length;
        const resolved = items.filter((t) => String(t.status).toLowerCase() === 'resolved').length;
        const closed = items.filter((t) => String(t.status).toLowerCase() === 'closed').length;
        return {
          total: items.length,
          byStatus: { open, in_progress: inProgress, resolved, closed },
          open,
          inProgress,
          resolved,
          avgResponseMinutes: 15,
        };
      },
      reply: async (id: string, body: string, options?: TicketRoleOptions) => {
        const clientMessageId = generateUuidV4();
        let endpoint = `/tickets/${id}/messages`;
        if (options?.role === 'owner') endpoint = `/owner/tickets/${id}/messages`;
        else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}/messages`;

        const res: any = await http.post(
          endpoint,
          { body },
          { headers: { 'Client-Message-Id': clientMessageId } },
        );
        const data = res?.data ?? res;
        return normalizeTicketMessage(data, id);
      },
      claim: async (id: string, expectedVersion?: number, options?: TicketRoleOptions) => {
        let endpoint = `/tickets/${id}/claim`;
        if (options?.role === 'owner') endpoint = `/owner/tickets/${id}/claim`;
        else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}/claim`;

        const res: any = await http.post(endpoint, { expectedVersion });
        const data = res?.data ?? res;
        return normalizeTicket(data);
      },
      assign: async (id: string, request: AssignTicketRequest, options?: TicketRoleOptions) => {
        let endpoint = `/tickets/${id}/assignment`;
        if (options?.role === 'owner') endpoint = `/owner/tickets/${id}/assignment`;
        else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}/assignment`;

        const res: any = await http.post(endpoint, request);
        const data = res?.data ?? res;
        return normalizeTicket(data);
      },
      stationHandlers: async (id: string): Promise<TicketHandlerCandidate[]> => {
        const res: any = await http.get(`/admin/tickets/${id}/station-handlers`);
        const data = res?.data ?? res;
        return Array.isArray(data) ? data : data?.items ?? [];
      },
      recordFinding: async (id: string, request: RecordTicketFindingRequest) => {
        const res: any = await http.post(`/tickets/${id}/findings`, request);
        return normalizeTicket(res?.data ?? res);
      },
      resolve: async (id: string, request: ResolveTicketRequest, options?: TicketRoleOptions) => {
        let endpoint = `/tickets/${id}/status`;
        if (options?.role === 'owner') endpoint = `/owner/tickets/${id}/status`;
        else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}/status`;

        const res: any = await http.patch(endpoint, {
          status: 'RESOLVED',
          expectedVersion: request.expectedVersion,
          reason: request.reason,
        });
        const data = res?.data ?? res;
        return normalizeTicket(data);
      },
      confirm: async (id: string, expectedVersion?: number, options?: TicketRoleOptions) => {
        let endpoint = `/tickets/${id}/status`;
        if (options?.role === 'owner') endpoint = `/owner/tickets/${id}/status`;
        else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}/status`;

        const res: any = await http.patch(endpoint, {
          status: 'CLOSED',
          expectedVersion,
          reason: 'REPORTER_CONFIRMED',
        });
        const data = res?.data ?? res;
        return normalizeTicket(data);
      },
      reopen: async (id: string, request: { expectedVersion?: number; reason: string }, options?: TicketRoleOptions) => {
        let endpoint = `/tickets/${id}/status`;
        if (options?.role === 'owner') endpoint = `/owner/tickets/${id}/status`;
        else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}/status`;

        const res: any = await http.patch(endpoint, {
          status: 'IN_PROGRESS',
          expectedVersion: request.expectedVersion,
          reason: request.reason,
        });
        const data = res?.data ?? res;
        return normalizeTicket(data);
      },
      events: async (id: string, options?: TicketRoleOptions) => {
        try {
          let endpoint = `/tickets/${id}/events`;
          if (options?.role === 'owner') endpoint = `/owner/tickets/${id}/events`;
          else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}/events`;

          const res: any = await http.get(endpoint);
          const items = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
          return items.map(normalizeTicketEvent);
        } catch {
          return [];
        }
      },
      kpis: async (stationId: string, params = {}) => {
        const res: any = await http.get(`/stations/${stationId}/ticket-kpis`, params);
        return res?.data ?? res;
      },
      setStatus: async (id, status, options) => {
        let endpoint = `/tickets/${id}/status`;
        if (options?.role === 'owner') endpoint = `/owner/tickets/${id}/status`;
        else if (options?.role === 'admin') endpoint = `/admin/tickets/${id}/status`;

        const res: any = await http.patch(endpoint, {
          status,
          expectedVersion: options?.expectedVersion,
          reason: options?.reason,
        });
        const data = res?.data ?? res;
        return normalizeTicket(data);
      },
      reassign: (id, stationName) => http.post(`/admin/tickets/${id}/reassign`, { stationName }),
      escalate: (id) => http.post(`/admin/tickets/${id}/escalate`),
    },

    ticketEscalations: {
      summary: async () => {
        try {
          const res: any = await http.get('/admin/ticket-escalations/summary');
          return (res?.data ?? res) as TicketEscalationsSummary;
        } catch {
          // Fallback calculating from queue
          const res: any = await http.get('/admin/ticket-escalations', { page: 1, size: 100 }).catch(() => ({ items: [], total: 0 }));
          const items: TicketEscalation[] = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
          let unresponsive24hCount = 0;
          let disputedFindingCount = 0;
          for (const item of items) {
            if (item.reason === 'DRIVER_UNRESPONSIVE_24H') unresponsive24hCount++;
            if (item.reason === 'DISPUTED_NOT_STATION_FAILURE') disputedFindingCount++;
          }
          const total = typeof res?.total === 'number' ? res.total : items.length;
          return {
            totalEscalated: total,
            pendingArbiter: total,
            unresponsive24hCount,
            disputedFindingCount,
          };
        }
      },
      request: async (ticketId: string, payload: EscalateTicketPayload) => {
        const res: any = await http.post(`/tickets/${ticketId}/escalation`, payload);
        return (res?.data ?? res) as TicketEscalation;
      },
      get: async (ticketId: string) => {
        const res: any = await http.get(`/tickets/${ticketId}/escalation`);
        return (res?.data ?? res) as TicketEscalation;
      },
      adminQueue: async (params = {}) => {
        const query: Record<string, any> = {
          page: (params.page ?? 0) + 1,
          size: params.pageSize ?? 20,
        };
        const res: any = await http.get('/admin/ticket-escalations', query);
        const rawItems = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const total = typeof res?.total === 'number'
          ? res.total
          : typeof res?.meta?.totalElements === 'number'
          ? res.meta.totalElements
          : rawItems.length;
        return {
          items: rawItems,
          total,
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 20,
        };
      },
      adminEscalatedTickets: async (params = {}) => {
        const query: Record<string, any> = {
          page: (params.page ?? 0) + 1,
          size: params.pageSize ?? 20,
        };
        if (params.stationId) query.stationId = params.stationId;
        if (params.status) query.status = params.status;
        const res: any = await http.get('/admin/tickets/escalated', query);
        const rawItems = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const total = typeof res?.total === 'number'
          ? res.total
          : typeof res?.meta?.totalElements === 'number'
          ? res.meta.totalElements
          : rawItems.length;
        return {
          items: rawItems.map(normalizeTicket),
          total,
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 20,
        };
      },
    },

    challenge: {
      create: (connectorId: string) =>
        http.post<CheckInChallengeResponse>(`/internal/connectors/${connectorId}/check-in-challenge`),
    },

    media: {
      getImageKitAuth: () => http.get('/media/imagekit-auth'),
    },

    notifications: {
      list: async (params) => {
        const res = await http.get<any>('/notifications', {
          unread: params?.unreadOnly ? 'true' : undefined,
          category: params?.category && params.category !== 'all' ? params.category : undefined,
        });
        const rawItems: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.data)
              ? res.data
              : [];

        return rawItems.map((raw: any) => {
          const createdAt = raw.createdAt ? String(raw.createdAt) : new Date().toISOString();
          const actionUrl = raw.actionUrl || raw.primaryAction?.actionUrl;
          const actionLabel = raw.actionLabel || raw.primaryAction?.label || (actionUrl ? 'Xem chi tiết' : undefined);

          return {
            id: String(raw.id),
            title: raw.title ?? '',
            subtitle: raw.subtitle ?? raw.body ?? '',
            body: raw.body ?? '',
            createdAt,
            time: raw.time,
            read: Boolean(raw.read || raw.readAt),
            category: (raw.category as any) ?? 'system',
            severity: raw.severity ?? (raw.category === 'alert' ? 'bad' : raw.category === 'ticket' ? 'warn' : 'neutral'),
            tone: raw.tone ?? raw.severity ?? (raw.category === 'alert' ? 'bad' : raw.category === 'ticket' ? 'warn' : 'neutral'),
            referenceId: raw.referenceId,
            stationName: raw.stationName,
            chargerId: raw.chargerId,
            metrics: raw.metrics,
            badge: raw.badge,
            actionLabel,
            primaryAction: actionUrl
              ? {
                  label: actionLabel || 'Xem chi tiết',
                  actionUrl,
                  actionType: 'link' as const,
                }
              : raw.primaryAction,
            secondaryAction: raw.secondaryAction,
          };
        });
      },
      unreadCount: async () => {
        const res = await http.get<{ count: number }>('/notifications/unread-count');
        return res?.count ?? 0;
      },
      markAsRead: (id) => http.patch(`/notifications/${id}/read`),
      markAllAsRead: () => http.patch('/notifications/read-all'),
      delete: async (id) => {
        try {
          await http.delete(`/notifications/${id}`);
        } catch {
          try {
            await http.patch(`/notifications/${id}/read`);
          } catch {
            // Ignore if already deleted/read
          }
        }
      },
    },
  };
}

