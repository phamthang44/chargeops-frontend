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
  Connector,
  ConnectorRuntimeStatus,
  CheckInChallengeResponse,
  License,
  OperationalChargePointStatus,
  ProvisioningStatus,
  Station,
  UserProfile,
} from '../types';

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
    slotMinutes: c.slotMinutes || 30,
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
        if (isAdminRoute()) {
          return [];
        }
        try {
          const stationsRes = await http.get<Station[] | { items: Station[] }>('/owner/stations/mine');
          const stations = Array.isArray(stationsRes) ? stationsRes : (stationsRes as { items?: Station[] })?.items ?? [];
          if (stations.length === 0) return [];
          const allCps = await Promise.all(
            stations.map((s) =>
              http
                .get<ChargePoint[]>(`/owner/stations/${s.id}/charge-points`)
                .catch(() => [] as ChargePoint[]),
            ),
          );
          return allCps.flat().map(normalizeChargePoint);
        } catch {
          return [];
        }
      },
      update: async (id, patch) => {
        if (isAdminRoute()) {
          if (patch.stationId) {
            const res = await http.patch<ChargePoint>(`/admin/stations/${patch.stationId}/charge-points/${id}`, {
              name: patch.name,
              zoneLabel: patch.zoneLabel,
              maxPowerKw: patch.maxPowerKw,
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
      activate: async (id, stationId) => {
        const res = await (stationId
          ? http.post<ChargePoint>(`/admin/stations/${stationId}/charge-points/${id}/activate`)
          : http.post<ChargePoint>(`/admin/charge-points/${id}/activate`));
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
        try {
          const stationsRes = await http.get<Station[] | { items: Station[] }>('/owner/stations/mine');
          const stations = Array.isArray(stationsRes) ? stationsRes : (stationsRes as { items?: Station[] })?.items ?? [];
          if (stations.length === 0) return [];
          const allCpsResults = await Promise.all(
            stations.map((s) =>
              http
                .get<ChargePoint[]>(`/owner/stations/${s.id}/charge-points`)
                .catch(() => [] as ChargePoint[]),
            ),
          );
          const allCps = allCpsResults.flat();
          if (allCps.length === 0) return [];

          const connectorResults = await Promise.all(
            allCps.map((cp) =>
              http
                .get<Connector[]>(`/owner/stations/${cp.stationId}/charge-points/${cp.id}/connectors`)
                .catch(() => [] as Connector[]),
            ),
          );
          return connectorResults.flat().map(normalizeConnector);
        } catch {
          return [];
        }
      },
      update: async (id, patch) => {
        if (isAdminRoute()) {
          const res = await http.patch<Connector>(
            `/admin/stations/${patch.stationId}/charge-points/${patch.chargePointId}/connectors/${id}`,
            patch,
          );
          return normalizeConnector(res);
        }
        const rawStatus = patch.runtimeStatus || (patch as any).status;
        const runtimeStatus =
          rawStatus === 'offline' || rawStatus === 'OFFLINE' ? 'OFFLINE' : 'AVAILABLE';
        const res = await http.patch<Connector>(
          `/owner/stations/${patch.stationId}/charge-points/${patch.chargePointId}/connectors/${id}/runtime-status`,
          { runtimeStatus, reason: patch.reason || 'Owner connector runtime status update' },
        );
        return normalizeConnector(res);
      },
      provision: async (input) => {
        const payload = {
          connectorCode: input.connectorCode,
          connectorType: input.connectorType,
          powerKw: input.powerKw,
          slotMinutes: input.slotMinutes ?? 30,
        };
        const res = await (input.stationId
          ? http.post<Connector>(`/admin/stations/${input.stationId}/charge-points/${input.chargePointId}/connectors`, payload)
          : http.post<Connector>(`/admin/connectors`, payload));
        return normalizeConnector(res);
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
        try {
          const stationsRes = await http.get<Station[] | { items: Station[] }>('/owner/stations/mine');
          const stations = Array.isArray(stationsRes) ? stationsRes : (stationsRes as { items?: Station[] })?.items ?? [];
          if (stations.length > 0) {
            return await http.get<License>(`/owner/licenses/${stations[0].id}`);
          }
        } catch {
          /* fallback */
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
      list: () => http.get('/staff'),
      invite: (input) => http.post('/staff', input),
      revoke: (userId, stationId) => http.delete(`/staff/${stationId}/${userId}`),
    },

    pricing: {
      get: () => http.get('/pricing'),
      save: (config) => http.put('/pricing', config),
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
