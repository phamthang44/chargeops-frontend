import { STATIONS, type CoverageStation, type Connector } from "@/components/stations";

/**
 * Backend DTO types aligned with Spring Boot controllers:
 * - StationDiscoveryController.java (`GET /api/v1/stations`, `GET /api/v1/stations/{id}`)
 * - StationDiscoveryItemResponse.java
 * - StationDiscoveryDetailResponse.java
 * - StationDiscoveryFilter.java
 * - ApiResult.java
 */

export type BackendConnectorType = "CCS2" | "CHADEMO" | "TYPE2" | "GBT";

export type StationOperationalStatus = "OPERATING" | "PAUSED" | "MAINTENANCE";

export type StationOperatingState =
  | "UNAVAILABLE_BY_PLATFORM"
  | "PAUSED_BY_OWNER"
  | "MAINTENANCE"
  | "OPEN"
  | "CLOSED_BY_SCHEDULE"
  | "SCHEDULE_NOT_CONFIGURED";

export type StationDiscoverySort = "NEAREST" | "CHEAPEST" | "AVAILABLE";

export interface BackendStationAsset {
  id?: string;
  assetUrl?: string;
  assetType?: string;
  caption?: string;
  displayOrder?: number;
}

export interface BackendOperatingHour {
  day?: string;
  openTime?: string;
  closeTime?: string;
  enabled?: boolean;
}

export interface BackendCancellationPolicy {
  policyVersion?: string;
  gracePeriodMinutes?: number;
  graceStartsAt?: string;
  requiresBeforeBookingStart?: boolean;
  requiresNotCheckedIn?: boolean;
  withinGraceRefundPercent?: number;
  afterGraceRefundPercent?: number;
  noShowRefundPercent?: number;
  verifiedStationFailureRefundPercent?: number;
  stationFailureRequiresVerification?: boolean;
}

export interface BackendConnectorResponse {
  id: string;
  connectorCode?: string;
  connectorType: BackendConnectorType | string;
  chargerType?: "AC" | "DC" | string;
  powerKw?: number;
  runtimeStatus?: string;
  availableNow?: boolean;
}

export interface BackendChargePointResponse {
  id: string;
  chargePointCode?: string;
  name: string;
  zoneLabel?: string | null;
  maxPowerKw?: number;
  operationalStatus?: string;
  connectors?: BackendConnectorResponse[];
}

/** DTO for GET /api/v1/stations list items */
export interface StationDiscoveryItemResponse {
  id: string;
  name: string;
  address: string;
  provinceName?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number | null;
  primaryImageUrl?: string | null;
  priceFromVndPerKwh?: number | null;
  maxPowerKw?: number | null;
  connectorTypes?: (BackendConnectorType | string)[];
  totalConnectorCount: number;
  availableConnectorCount: number;
  operationalStatus: StationOperationalStatus;
  operationalStatusReason?: string | null;
  openNow: boolean;
  operatingState: StationOperatingState;
  scheduleConfigured: boolean;
}

/** DTO for GET /api/v1/stations/{id} detail item */
export interface StationDiscoveryDetailResponse {
  id: string;
  stationCode?: string;
  name: string;
  description?: string | null;
  address: string;
  wardName?: string | null;
  provinceName?: string | null;
  latitude?: number;
  longitude?: number;
  contactPhone?: string | null;
  assets?: BackendStationAsset[];
  currentPriceVndPerKwh?: number | null;
  operationalStatus: StationOperationalStatus;
  operationalStatusReason?: string | null;
  open24Hours: boolean;
  openNow: boolean;
  operatingState: StationOperatingState;
  scheduleConfigured: boolean;
  operatingHours?: BackendOperatingHour[];
  cancellationPolicy?: BackendCancellationPolicy | null;
  chargePoints?: BackendChargePointResponse[];
  // Fallbacks for compatibility
  primaryImageUrl?: string | null;
  maxPowerKw?: number | null;
  connectorTypes?: (BackendConnectorType | string)[];
  totalConnectorCount?: number;
  availableConnectorCount?: number;
}

/** Spring Boot standard ApiResult envelope */
export interface ApiMeta {
  serverTime?: number;
  apiVersion?: string;
  traceId?: string;
  message?: string | null;
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  nextCursor?: string | null;
  hasNextPage?: boolean | null;
  sort?: string;
  filter?: Record<string, unknown>;
}

export interface ApiError {
  code?: string;
  messageKey?: string | null;
  message?: string;
  traceId?: string;
  details?: unknown;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiMeta;
  error?: ApiError | null;
}

/** Query parameters accepted by GET /api/v1/stations (@ModelAttribute StationDiscoveryFilter) */
export interface StationDiscoveryFilterParams {
  query?: string;
  provinceCode?: string;
  chargerType?: "AC" | "DC";
  connectorTypes?: BackendConnectorType[];
  availableOnly?: boolean;
  openOnly?: boolean;
  minPowerKw?: number;
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
  sort?: StationDiscoverySort;
  page?: number; // 1-based index (default 1)
  size?: number; // 1-100 (default 12)
}

export interface StationsApiResponse {
  stations: CoverageStation[];
  isLive: boolean;
  total: number;
  page: number;
  totalPages: number;
  source: "api" | "fallback";
}

/**
 * Maps backend ConnectorType enum (CCS2, CHADEMO, TYPE2, GBT)
 * to marketing display Connector label.
 */
export function mapConnectorType(type: string): Connector {
  const norm = String(type || "").toUpperCase().replace(/[-_]/g, "");
  if (norm === "CCS2" || norm.includes("CCS")) return "CCS2";
  if (norm === "CHADEMO") return "CHAdeMO";
  if (norm === "TYPE2" || norm.includes("TYPE")) return "Type 2 (AC)";
  if (norm === "GBT") return "GB/T";
  return "CCS2";
}

/** Converts Vietnamese diacritics into URL-safe slug */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Extracts approximate district from Vietnamese address string
 * e.g., "72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh" -> "Quận 1"
 */
export function extractDistrict(address: string, provinceName?: string | null): string {
  if (!address) return provinceName || "Trung tâm";
  const parts = address.split(",").map((p) => p.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (
      p.toLowerCase().startsWith("quận") ||
      p.toLowerCase().startsWith("huyện") ||
      p.toLowerCase().startsWith("thị xã") ||
      p.toLowerCase().startsWith("q.") ||
      p.toLowerCase().startsWith("tp.")
    ) {
      return p;
    }
  }
  return parts.length > 1 ? parts[parts.length - 2] : parts[0];
}

/**
 * Maps either a list item (StationDiscoveryItemResponse) or detail (StationDiscoveryDetailResponse)
 * to the marketing frontend CoverageStation model.
 */
export function mapBackendToCoverageStation(
  b: StationDiscoveryItemResponse | StationDiscoveryDetailResponse
): CoverageStation {
  // 1. Resolve connectors
  let rawConnectors: (string | BackendConnectorType)[] = [];
  if (b.connectorTypes && b.connectorTypes.length > 0) {
    rawConnectors = b.connectorTypes;
  } else if ("chargePoints" in b && Array.isArray(b.chargePoints)) {
    const set = new Set<string>();
    b.chargePoints.forEach((cp) => {
      cp.connectors?.forEach((c) => {
        if (c.connectorType) set.add(String(c.connectorType));
      });
    });
    rawConnectors = Array.from(set);
  }

  const mappedConnectors: Connector[] =
    rawConnectors.length > 0
      ? Array.from(new Set(rawConnectors.map(mapConnectorType)))
      : ["CCS2", "Type 2 (AC)"];

  // 2. Connector counts
  let total = b.totalConnectorCount ?? 4;
  let available = b.availableConnectorCount ?? total;
  if ("chargePoints" in b && Array.isArray(b.chargePoints) && b.chargePoints.length > 0) {
    let t = 0;
    let a = 0;
    b.chargePoints.forEach((cp) => {
      cp.connectors?.forEach((c) => {
        t++;
        if (c.availableNow || c.runtimeStatus === "AVAILABLE") a++;
      });
    });
    if (t > 0) {
      total = t;
      available = a;
    }
  }

  // 3. Max power and fast-charge flag
  const powerKw = b.maxPowerKw ?? 0;
  const fast =
    powerKw >= 30 ||
    mappedConnectors.some((c) => c === "CCS2" || c === "CHAdeMO");

  // 4. Pricing
  const priceNumber =
    "priceFromVndPerKwh" in b && b.priceFromVndPerKwh != null
      ? b.priceFromVndPerKwh
      : "currentPriceVndPerKwh" in b && b.currentPriceVndPerKwh != null
      ? b.currentPriceVndPerKwh
      : 3850;

  const priceFormatted = `${Number(priceNumber).toLocaleString("vi-VN")}đ`;

  // 5. Operating state & hours
  const isOperatingOpen =
    b.openNow ||
    ("open24Hours" in b && b.open24Hours) ||
    b.operatingState === "OPEN";

  const hoursText = isOperatingOpen ? "Mở cửa 24/7" : "06:00 – 22:00";

  // 6. Image resolution
  const primaryImg =
    b.primaryImageUrl ||
    ("assets" in b && Array.isArray(b.assets) && b.assets[0]?.assetUrl) ||
    null;

  const description =
    ("description" in b && b.description) ||
    `Trạm sạc xe điện ${b.name} tại ${b.address}. Hỗ trợ sạc ${
      fast ? "nhanh DC công suất cao" : "chuẩn AC"
    }, trạng thái ${b.operatingState === "OPEN" ? "sẵn sàng phục vụ" : "vận hành linh hoạt"}. Đặt khung giờ và check-in QR qua ứng dụng di động ChargeOps.`;

  return {
    id: b.id,
    slug: slugify(b.name) || b.id,
    name: b.name,
    district: extractDistrict(b.address, b.provinceName),
    city: b.provinceName || "TP. Hồ Chí Minh",
    address: b.address,
    available,
    total,
    fast,
    pricePerKwh: priceFormatted,
    connectors: mappedConnectors,
    amenities: ["Mái che", "Wifi", "Bãi đỗ rộng", "Thanh toán trong app", ...(isOperatingOpen ? ["Mở cửa 24/7"] : [])],
    hours: hoursText,
    rating: 4.8,
    reviewCount: 88,
    description,
    primaryImageUrl: primaryImg,
    maxPowerKw: powerKw > 0 ? powerKw : null,
    operatingState: b.operatingState,
    operationalStatus: b.operationalStatus,
  };
}

/** Resolves the base backend API URL */
export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_PUBLIC_STATIONS_API_URL ||
    process.env.API_URL ||
    "http://localhost:8080"
  ).replace(/\/+$/, "");
}

/**
 * Fetches public stations list from backend endpoint `GET /api/v1/stations`,
 * which is exposed as permitAll() in SecurityConfig.
 * Gracefully falls back to curated showcase stations when backend is offline.
 */
export async function fetchPublicStations(
  params?: StationDiscoveryFilterParams
): Promise<StationsApiResponse> {
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}/api/v1/stations`;

  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.size) queryParams.set("size", String(params.size));
    if (params?.query?.trim()) queryParams.set("query", params.query.trim());
    if (params?.provinceCode) queryParams.set("provinceCode", params.provinceCode);
    if (params?.chargerType) queryParams.set("chargerType", params.chargerType);
    if (params?.availableOnly) queryParams.set("availableOnly", "true");
    if (params?.openOnly) queryParams.set("openOnly", "true");
    if (params?.minPowerKw !== undefined && params.minPowerKw > 0) {
      queryParams.set("minPowerKw", String(params.minPowerKw));
    }
    if (params?.latitude !== undefined && params?.longitude !== undefined) {
      queryParams.set("latitude", String(params.latitude));
      queryParams.set("longitude", String(params.longitude));
    }
    if (params?.maxDistanceKm !== undefined) {
      queryParams.set("maxDistanceKm", String(params.maxDistanceKm));
    }
    if (params?.sort) {
      queryParams.set("sort", params.sort);
    }
    if (params?.connectorTypes && params.connectorTypes.length > 0) {
      params.connectorTypes.forEach((c) => queryParams.append("connectorTypes", c));
    }

    const fetchUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const res = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // Next.js ISR revalidate cache for 60s
    });

    if (res.ok) {
      const envelope: ApiResult<StationDiscoveryItemResponse[]> = await res.json();
      const rawList = envelope?.data;

      if (Array.isArray(rawList) && rawList.length > 0) {
        const mapped = rawList.map(mapBackendToCoverageStation);
        return {
          stations: mapped,
          isLive: true,
          total: envelope.meta?.totalElements ?? mapped.length,
          page: envelope.meta?.page ?? 1,
          totalPages: envelope.meta?.totalPages ?? 1,
          source: "api",
        };
      }
    }
  } catch (err) {
    // Network offline or connection refused -> gracefully fallback to showcase stations
  }

  // Fallback to showcase stations
  return {
    stations: STATIONS,
    isLive: false,
    total: STATIONS.length,
    page: 1,
    totalPages: 1,
    source: "fallback",
  };
}

/**
 * Fetches a single public station by UUID from `GET /api/v1/stations/{id}`,
 * exposed as permitAll() in SecurityConfig.
 */
export async function fetchPublicStationDetail(
  stationId: string
): Promise<CoverageStation | null> {
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}/api/v1/stations/${encodeURIComponent(stationId)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const envelope: ApiResult<StationDiscoveryDetailResponse> = await res.json();
      if (envelope?.data) {
        return mapBackendToCoverageStation(envelope.data);
      }
    }
  } catch {
    // Return null on failure to allow caller to fallback
  }

  return null;
}

/**
 * Retrieves a station by its slug or ID:
 * 1. Checks if the parameter is a valid UUID and calls the detail endpoint.
 * 2. Otherwise searches in the public stations list.
 * 3. Falls back to static showcase STATIONS.
 */
export async function fetchPublicStationBySlug(
  slugOrId: string
): Promise<CoverageStation | undefined> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  if (isUuid) {
    const directDetail = await fetchPublicStationDetail(slugOrId);
    if (directDetail) return directDetail;
  }

  const listRes = await fetchPublicStations({ size: 100 });
  const found = listRes.stations.find(
    (s) => s.slug === slugOrId || s.id === slugOrId
  );
  if (found) return found;

  // Fallback
  return STATIONS.find((s) => s.slug === slugOrId || s.id === slugOrId);
}
