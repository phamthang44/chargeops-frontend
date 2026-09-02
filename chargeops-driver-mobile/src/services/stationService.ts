import { Platform } from 'react-native';

import { chargePointsMock, connectorsMock, reviewsMock, stationsMock } from '@/mock/stations.mock';
import type { ChargePoint, Connector, ConnectorType, Review, Station } from '@/types';
import { effectiveConnectorStatus } from '@/utils/connectors';
import {
  adaptChargePointsFromDetail,
  adaptConnectorsFromDetail,
  adaptStationDiscoveryDetail,
  adaptStationDiscoveryItem,
  adaptStationList,
  buildStationDiscoveryQueryParams,
  deriveHasFastCharging,
  mapFrontendSortToBackend,
  type BackendChargePointResponse,
  type BackendConnectorResponse,
  type BackendPriceRangeResponse,
  type BackendStationAvailabilityResponse,
  type BackendStationDiscoveryDetail,
  type BackendStationDiscoveryItem,
  type BackendStationDiscoverySort,
  type BackendTimeRangeResponse,
} from './stationAdapter';

export {
  adaptChargePointsFromDetail,
  adaptConnectorsFromDetail,
  adaptStationDiscoveryDetail,
  adaptStationDiscoveryItem,
  adaptStationList,
  buildStationDiscoveryQueryParams,
  deriveHasFastCharging,
  mapFrontendSortToBackend,
  type BackendChargePointResponse,
  type BackendConnectorResponse,
  type BackendPriceRangeResponse,
  type BackendStationAvailabilityResponse,
  type BackendStationDiscoveryDetail,
  type BackendStationDiscoveryItem,
  type BackendStationDiscoverySort,
  type BackendTimeRangeResponse,
};

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export const apiBaseUrl =
  configuredBaseUrl ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8081' : 'http://localhost:8081');

let activeAccessTokenGetter: (() => string | null) | null = null;

/**
 * Configure global token provider so all station service calls automatically
 * send Authorization: Bearer <token> without requiring manual injection on every screen.
 */
export function setStationApiTokenProvider(getter: () => string | null) {
  activeAccessTokenGetter = getter;
}

export function resolveAccessToken(explicit?: string | null): string | null {
  if (explicit !== undefined && explicit !== null) return explicit;
  return activeAccessTokenGetter ? activeAccessTokenGetter() : null;
}

/**
 * Station data layer.
 *
 * The UI must call ONLY these functions — never the mock data directly.
 * Every function is async so that swapping the internals to a real REST API
 * does NOT change these signatures or any calling UI.
 *
 * Integrates Backend -> Frontend Adapter:
 * - primaryImageUrl          -> imageUrl
 * - priceFromVndPerKwh       -> minRatePerKwh (list)
 * - currentPriceVndPerKwh    -> minRatePerKwh (detail)
 * - chargePoints[].connectors[] -> total/available connectors & charge points/connectors
 * - availableConnectorCount  -> availableConnectors
 * - totalConnectorCount      -> totalConnectors
 * - openNow                  -> isOpen
 * - hasFastCharging          -> derived on frontend
 */

/** Simulate network latency for mock fallback. */
function simulateNetwork<T>(data: T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}

/** Search & filter criteria for the station list (FR02). */
export interface StationFilter {
  /** Free-text match against name and address. */
  query?: string;
  /** Only stations offering at least one connector of these types. */
  connectorTypes?: ConnectorType[];
  /** Only stations with at least one AC / DC connector. */
  currentType?: 'AC' | 'DC';
  /** Only stations with at least one port free right now. */
  availableOnly?: boolean;
  /** Only stations that are open right now. */
  openOnly?: boolean;
  /** Minimum charging power in kW (e.g. 50, 100, 150). */
  minPowerKw?: number;
  /** Province code filter (e.g. "VN-SG", "VN-HN"). */
  provinceCode?: string;
  /** User latitude for distance computation. */
  latitude?: number;
  /** User longitude for distance computation. */
  longitude?: number;
  /** Only stations within this many km. */
  maxDistanceKm?: number;
  /** Result ordering (defaults to nearest). */
  sort?: StationSort;
}

/** How the station list is ordered. Rating sort is removed per SRS spec. */
export type StationSort = 'nearest' | 'cheapest' | 'available';

/** One page of stations. `page` is one-based to match the public API contract. */
export interface StationPage {
  items: Station[];
  page: number;
  size: number;
  /** Total matching the filter (for a "showing X of N" style count). */
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

/** Default page size for the discovery list. */
export const STATION_PAGE_SIZE = 12;

function sortStations(list: Station[], sort: StationSort): Station[] {
  const by = [...list];
  if (sort === 'cheapest') by.sort((a, b) => (a.minRatePerKwh ?? Infinity) - (b.minRatePerKwh ?? Infinity));
  else if (sort === 'available') by.sort((a, b) => b.availableConnectors - a.availableConnectors);
  else by.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return by;
}


/** Charge Points a driver is allowed to see: UNCLAIMED/SUSPENDED are hidden (BR-CHG-01). */
function driverVisibleChargePoints(stationId: string): ChargePoint[] {
  return chargePointsMock.filter(
    (cp) => cp.stationId === stationId && (cp.status === 'ACTIVE' || cp.status === 'OFFLINE'),
  );
}

/** The connectors a driver can see at a station, with the device cascade applied. */
function visibleConnectors(stationId: string): (Connector & { effectiveStatus: Connector['runtimeStatus'] })[] {
  const points = driverVisibleChargePoints(stationId);
  const byId = new Map(points.map((cp) => [cp.id, cp]));
  return connectorsMock
    .filter((c) => byId.has(c.chargePointId))
    .map((c) => ({
      ...c,
      effectiveStatus: effectiveConnectorStatus(byId.get(c.chargePointId)!.status, c.runtimeStatus),
    }));
}

function matchesFilter(station: Station, filter: StationFilter): boolean {
  const connectors = visibleConnectors(station.id);

  if (filter.query) {
    const q = filter.query.trim().toLowerCase();
    const haystack = `${station.name} ${station.address}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
  }
  if (filter.connectorTypes?.length) {
    if (!connectors.some((c) => filter.connectorTypes!.includes(c.connectorType))) return false;
  }
  if (filter.currentType) {
    if (!connectors.some((c) => c.currentType === filter.currentType)) return false;
  }
  if (filter.availableOnly) {
    if (!connectors.some((c) => c.effectiveStatus === 'AVAILABLE')) return false;
  }
  if (filter.openOnly && !station.isOpen) return false;
  if (filter.maxDistanceKm !== undefined) {
    if ((station.distanceKm ?? Number.POSITIVE_INFINITY) > filter.maxDistanceKm) return false;
  }
  return true;
}

/**
 * Search, filter and page stations (FR02).
 * Adapts backend responses from `/api/v1/stations` using `adaptStationDiscoveryItem`.
 * Falls back to mock data if API is unavailable.
 */
export async function getNearbyStations(
  filter: StationFilter = {},
  pagination: { page?: number; size?: number } = {},
  options?: { accessToken?: string | null },
): Promise<StationPage> {
  const requestedPage = Math.max(1, pagination.page ?? 1);
  const requestedSize = Math.min(100, Math.max(1, pagination.size ?? STATION_PAGE_SIZE));

  // Try real API first if endpoint is available
  try {
    const params = buildStationDiscoveryQueryParams(filter, {
      page: requestedPage,
      size: requestedSize,
    });

    const token = resolveAccessToken(options?.accessToken);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBaseUrl}/api/v1/stations?${params.toString()}`, {
      headers,
    });

    if (response.ok) {
      const payload = await response.json();
      const rawItems: BackendStationDiscoveryItem[] | undefined =
        payload?.data?.content ?? payload?.data?.items ?? payload?.data ?? payload?.content;

      if (Array.isArray(rawItems)) {
        const items = adaptStationList(rawItems);
        const meta = payload?.meta ?? payload?.data?.meta ?? {};
        const page = Math.max(1, Number(meta.page ?? requestedPage) || requestedPage);
        const size = Math.max(1, Number(meta.size ?? requestedSize) || requestedSize);
        const total = Math.max(0, Number(meta.totalElements ?? payload?.total ?? items.length) || 0);
        const totalPages = Math.max(0, Number(meta.totalPages ?? Math.ceil(total / size)) || 0);
        return { items, page, size, total, totalPages, hasNextPage: page < totalPages };
      }
    }
  } catch {
    // Graceful fallback to mock data on network error
  }

  // Fallback to local mock data
  const sorted = sortStations(
    stationsMock.filter((s) => matchesFilter(s, filter)),
    filter.sort ?? 'nearest',
  );
  const start = (requestedPage - 1) * requestedSize;
  const items = sorted.slice(start, start + requestedSize);
  const total = sorted.length;
  const totalPages = Math.ceil(total / requestedSize);
  return simulateNetwork({
    items,
    page: requestedPage,
    size: requestedSize,
    total,
    totalPages,
    hasNextPage: requestedPage < totalPages,
  });
}

export interface StationDetailBundle {
  station: Station;
  chargePoints: ChargePoint[];
  connectors: Connector[];
}

/**
 * Get comprehensive station detail by ID.
 * Returns station, charge points, and connectors adapted directly from Backend API
 * or falls back to mock data if offline/unavailable.
 */
export async function getStationDetail(
  id: string,
  options?: { accessToken?: string | null },
): Promise<StationDetailBundle | null> {
  try {
    const token = resolveAccessToken(options?.accessToken);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBaseUrl}/api/v1/stations/${id}`, {
      headers,
    });

    if (response.ok) {
      const payload = await response.json();
      const rawDetail: BackendStationDiscoveryDetail = payload?.data ?? payload;
      if (rawDetail && rawDetail.id) {
        const station = adaptStationDiscoveryDetail(rawDetail);
        const chargePoints = adaptChargePointsFromDetail(rawDetail);
        const connectors = adaptConnectorsFromDetail(rawDetail, station.minRatePerKwh);
        return { station, chargePoints, connectors };
      }
    }
  } catch {
    // Fallback to mock
  }

  const station = stationsMock.find((s) => s.id === id) ?? null;
  if (!station) return null;

  return simulateNetwork({
    station,
    chargePoints: driverVisibleChargePoints(id),
    connectors: visibleConnectors(id),
  });
}

/**
 * Get station detail by ID.
 * Adapts backend detail response from `/api/v1/stations/:id` using `adaptStationDiscoveryDetail`.
 * Falls back to mock data if API is unavailable.
 */
export async function getStationById(
  id: string,
  options?: { accessToken?: string | null },
): Promise<Station | null> {
  const bundle = await getStationDetail(id, options);
  return bundle?.station ?? null;
}

export async function getChargePointsByStation(stationId: string): Promise<ChargePoint[]> {
  // NOW: return mock. LATER: GET /stations/:stationId/charge-points
  return simulateNetwork(driverVisibleChargePoints(stationId));
}

export async function getConnectorsByStation(stationId: string): Promise<Connector[]> {
  // NOW: return mock. LATER: GET /stations/:stationId/connectors
  const connectors = connectorsMock.filter((c) =>
    driverVisibleChargePoints(stationId).some((cp) => cp.id === c.chargePointId),
  );
  return simulateNetwork(connectors);
}

export async function getConnectorById(connectorId: string): Promise<Connector | null> {
  // NOW: return mock. LATER: GET /connectors/:id
  return simulateNetwork(connectorsMock.find((c) => c.id === connectorId) ?? null);
}

/**
 * Resolve a scanned QR payload to its Connector (FR07). The QR encodes exactly
 * one Connector id and never changes after provisioning (BR-CHG-02/04), so this
 * is a plain lookup — there is no ambiguity about which port was scanned.
 */
export async function getConnectorByQrToken(qrToken: string): Promise<Connector | null> {
  // NOW: match the mock token. LATER: GET /connectors/by-qr/:token
  const token = qrToken.trim();
  const connector =
    connectorsMock.find((c) => c.qrToken === token) ??
    // Tolerate a bare connector id — some printed labels carry the id itself.
    connectorsMock.find((c) => c.id === token) ??
    null;
  return simulateNetwork(connector);
}

export async function getChargePointById(id: string): Promise<ChargePoint | null> {
  return simulateNetwork(chargePointsMock.find((cp) => cp.id === id) ?? null);
}

export async function getReviewsByStation(stationId: string): Promise<Review[]> {
  // NOW: return mock. LATER: GET /stations/:stationId/reviews
  const reviews = reviewsMock.filter((r) => r.stationId === stationId);
  return simulateNetwork(reviews);
}
