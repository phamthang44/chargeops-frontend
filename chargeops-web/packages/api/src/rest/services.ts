/**
 * REST implementation of every service — thin mappings onto the (future)
 * chargeops-backend Spring Boot API. Endpoint paths are the proposed contract;
 * adjust here (and only here) if the backend names them differently.
 * Scoping (owner sees own stations only) is enforced server-side via the
 * Keycloak token — the client never passes an owner id.
 */
import type { HttpClient } from '../http';
import type { Services } from '../services';
import type {
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
  StationStaffMember,
  UserProfile,
} from '../types';

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
    },

    transactions: {
      list: (params = {}) => http.get('/transactions', params),
      summary: () => http.get('/transactions/summary'),
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
        if (!stationId) return [];
        const res = await http.get<StationStaffMember[] | { items?: StationStaffMember[] }>(
          `/owner/stations/${stationId}/staffs`,
          params,
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

    tickets: {
      list: (params = {}) => http.get('/tickets', params),
      get: (id) => http.get(`/tickets/${id}`),
      messages: (id) => http.get(`/tickets/${id}/messages`),
      summary: () => http.get('/tickets/summary'),
      reply: (id, body) => http.post(`/tickets/${id}/messages`, { body }),
      setStatus: (id, status) => http.patch(`/tickets/${id}/status`, { status }),
      reassign: (id, stationName) => http.post(`/admin/tickets/${id}/reassign`, { stationName }),
      escalate: (id) => http.post(`/admin/tickets/${id}/escalate`),
    },

    challenge: {
      create: (connectorId: string) =>
        http.post<CheckInChallengeResponse>(`/internal/connectors/${connectorId}/check-in-challenge`),
    },
  };
}
