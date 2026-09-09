import { STATIONS, type CoverageStation, type Connector } from "@/components/stations";

export interface BackendStationItem {
  id: string;
  name: string;
  address: string;
  provinceName?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  primaryImageUrl?: string;
  priceFromVndPerKwh?: number;
  maxPowerKw?: number;
  connectorTypes?: string[];
  totalConnectorCount?: number;
  availableConnectorCount?: number;
  operationalStatus?: string;
  openNow?: boolean;
  scheduleConfigured?: boolean;
}

export interface StationsApiResponse {
  stations: CoverageStation[];
  isLive: boolean;
  total: number;
  source: "api" | "fallback";
}

/**
 * Maps backend ConnectorType enum (CCS2, CHADEMO, TYPE_2_AC, GBT)
 * to frontend Connector label.
 */
function mapConnectorType(type: string): Connector {
  const norm = String(type || "").toUpperCase().replace(/[-_]/g, "");
  if (norm.includes("CCS")) return "CCS2";
  if (norm.includes("CHADEMO")) return "CHAdeMO";
  if (norm.includes("TYPE2") || norm.includes("AC")) return "Type 2 (AC)";
  if (norm.includes("GBT")) return "GB/T";
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
function extractDistrict(address: string, provinceName?: string): string {
  if (!address) return provinceName || "Trung tâm";
  const parts = address.split(",").map((p) => p.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (
      p.toLowerCase().startsWith("quận") ||
      p.toLowerCase().startsWith("huyện") ||
      p.toLowerCase().startsWith("thị xã") ||
      p.toLowerCase().startsWith("q.")
    ) {
      return p;
    }
  }
  return parts.length > 1 ? parts[parts.length - 2] : parts[0];
}

/** Maps a single backend station DTO to the frontend CoverageStation */
export function mapBackendToCoverageStation(b: BackendStationItem): CoverageStation {
  const connectors: Connector[] = (b.connectorTypes || []).map(mapConnectorType);
  const total = b.totalConnectorCount ?? 4;
  const available = b.availableConnectorCount ?? total;
  const fast = (b.maxPowerKw ?? 0) >= 30 || connectors.some((c) => c === "CCS2" || c === "CHAdeMO");
  const price = b.priceFromVndPerKwh
    ? `${Number(b.priceFromVndPerKwh).toLocaleString("vi-VN")}đ`
    : "3.850đ";

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
    pricePerKwh: price,
    connectors: connectors.length > 0 ? Array.from(new Set(connectors)) : ["CCS2", "Type 2 (AC)"],
    amenities: ["Mái che", "Wifi", "Bãi đỗ rộng", "Thanh toán trong app"],
    hours: b.openNow ? "Mở cửa 24/7" : "06:00 – 23:00",
    rating: 4.8,
    reviewCount: 95,
    description: `Trạm sạc xe điện ${b.name} tại ${b.address}. Hỗ trợ sạc ${
      fast ? "nhanh DC" : "thường AC"
    }, đặt trước khung giờ và check-in bằng mã QR qua ứng dụng di động ChargeOps.`,
  };
}

/**
 * Fetches public stations list from backend API if available,
 * gracefully falling back to pre-configured stations when offline or unauthenticated.
 */
export async function fetchPublicStations(params?: {
  city?: string;
  query?: string;
  page?: number;
  size?: number;
}): Promise<StationsApiResponse> {
  const apiBase =
    process.env.NEXT_PUBLIC_PUBLIC_STATIONS_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:8080";

  // Prioritize dedicated public unauthenticated stations endpoint, or general stations discovery
  const endpoints = [
    `${apiBase}/api/v1/public/stations`,
    `${apiBase}/api/v1/stations`,
  ];

  for (const url of endpoints) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set("page", String(params.page));
      if (params?.size) queryParams.set("size", String(params.size));
      if (params?.query) queryParams.set("keyword", params.query);

      const fetchUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const res = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 60 }, // ISR cache 60s
      });

      if (res.ok) {
        const json = await res.json();
        const rawList: BackendStationItem[] =
          json?.data?.content || json?.data || json?.content || (Array.isArray(json) ? json : []);

        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map(mapBackendToCoverageStation);
          return {
            stations: mapped,
            isLive: true,
            total: mapped.length,
            source: "api",
          };
        }
      }
    } catch {
      // Endpoint unreachable or connection refused -> continue to fallback
    }
  }

  // Graceful fallback to curated showcase stations
  return {
    stations: STATIONS,
    isLive: false,
    total: STATIONS.length,
    source: "fallback",
  };
}

/** Retrieves a single station by its slug or ID */
export async function fetchPublicStationBySlug(slug: string): Promise<CoverageStation | undefined> {
  const data = await fetchPublicStations();
  return data.stations.find((s) => s.slug === slug || s.id === slug);
}
