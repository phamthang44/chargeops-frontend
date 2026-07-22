/**
 * REST implementation of every service — thin mappings onto the (future)
 * chargeops-backend Spring Boot API. Endpoint paths are the proposed contract;
 * adjust here (and only here) if the backend names them differently.
 * Scoping (owner sees own stations only) is enforced server-side via the
 * Keycloak token — the client never passes an owner id.
 */
import type { HttpClient } from '../http';
import type { Services } from '../services';

export function createRestServices(http: HttpClient): Services {
  return {
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
      list: (stationId) => http.get('/charge-points', { stationId }),
      update: (id, patch) => http.patch(`/charge-points/${id}`, patch),
      provision: (input) => http.post('/admin/charge-points', input),
      activate: (id) => http.post(`/admin/charge-points/${id}/activate`),
    },

    connectors: {
      list: (chargePointId) => http.get('/connectors', { chargePointId }),
      update: (id, patch) => http.patch(`/connectors/${id}`, patch),
      provision: (input) => http.post('/admin/connectors', input),
    },

    stations: {
      mine: () => http.get('/stations/mine'),
      register: (input) => http.post('/stations', input),
      approvals: () => http.get('/admin/stations/approvals'),
      all: () => http.get('/admin/stations'),
      approve: (id) => http.post(`/admin/stations/${id}/approve`),
      reject: (id, reason) => http.post(`/admin/stations/${id}/reject`, { reason }),
    },

    transactions: {
      list: (params = {}) => http.get('/transactions', params),
      summary: () => http.get('/transactions/summary'),
    },

    licenses: {
      mine: () => http.get('/licenses/mine'),
      list: () => http.get('/admin/licenses'),
      recordRenewal: (stationId) => http.post(`/admin/licenses/${stationId}/renew`),
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
  };
}
