import { chargePointsMock, connectorsMock, reviewsMock, stationsMock } from '@/mock/stations.mock';
import type { ChargePoint, Connector, ConnectorType, Review, Station } from '@/types';
import { effectiveConnectorStatus } from '@/utils/connectors';

/**
 * Station data layer.
 *
 * The UI must call ONLY these functions — never the mock data directly.
 * Every function is async so that swapping the internals to a real REST API
 * later does NOT change these signatures or any calling UI.
 *
 * NOW:   returns mock data.
 * LATER: replace each body with a real fetch(), keep the signature identical.
 */

/** Simulate network latency so the UI behaves like it will with a real API. */
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
  /** Only stations within this many km. */
  maxDistanceKm?: number;
  /** Result ordering (defaults to nearest). */
  sort?: StationSort;
}

/** How the station list is ordered. */
export type StationSort = 'nearest' | 'cheapest' | 'rating' | 'available';

/**
 * One page of stations plus the cursor for the next page. Cursor-based (not
 * offset) paging: `nextCursor` is the last item's id, and the next request
 * returns the items that follow it in the same sorted order — stable even as
 * the underlying set grows. `null` means there are no more.
 */
export interface StationPage {
  items: Station[];
  nextCursor: string | null;
  /** Total matching the filter (for a "showing X of N" style count). */
  total: number;
}

/** Default page size for the discovery list. */
export const STATION_PAGE_SIZE = 12;

function sortStations(list: Station[], sort: StationSort): Station[] {
  const by = [...list];
  if (sort === 'cheapest') by.sort((a, b) => (a.minRatePerKwh ?? Infinity) - (b.minRatePerKwh ?? Infinity));
  else if (sort === 'rating') by.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
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
 * Search, filter and page stations (FR02). All filtering + ordering happens here
 * so the cursor stays consistent across pages. Results are sorted per
 * `filter.sort` (nearest by default), then a `cursor`-anchored slice is returned.
 * NOW: pages the mock locally. LATER: GET /stations/nearby?lat=&lng=&cursor=&… —
 * the backend returns the same {items, nextCursor} shape from a DB keyset query.
 */
export async function getNearbyStations(
  filter: StationFilter = {},
  page: { cursor?: string | null; limit?: number } = {},
): Promise<StationPage> {
  const { cursor = null, limit = STATION_PAGE_SIZE } = page;
  const sorted = sortStations(
    stationsMock.filter((s) => matchesFilter(s, filter)),
    filter.sort ?? 'nearest',
  );
  const start = cursor ? sorted.findIndex((s) => s.id === cursor) + 1 : 0;
  const items = sorted.slice(start, start + limit);
  const nextCursor = start + limit < sorted.length && items.length > 0 ? items[items.length - 1].id : null;
  return simulateNetwork({ items, nextCursor, total: sorted.length });
}

export async function getStationById(id: string): Promise<Station | null> {
  // NOW: return mock. LATER: GET /stations/:id
  const station = stationsMock.find((s) => s.id === id) ?? null;
  return simulateNetwork(station);
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
