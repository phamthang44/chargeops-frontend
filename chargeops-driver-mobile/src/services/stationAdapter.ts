import type {
  Amenity,
  CancellationPolicy,
  ChargePoint,
  Connector,
  ConnectorRuntimeStatus,
  ConnectorType,
  ProvisioningStatus,
  Station,
  StationOperatingState,
  StationOperationalStatus,
} from '@/types';

/**
 * Backend DTO types returned by Spring Boot API
 * Aligned with:
 * - StationDiscoveryItemResponse.java
 * - StationDiscoveryDetailResponse.java
 */

export interface BackendStationAsset {
  id?: string;
  url: string;
  isPrimary?: boolean;
  assetType?: string;
}

export interface BackendOperatingHour {
  day?: string; // MONDAY, TUESDAY, etc.
  openTime?: string; // "06:00:00" or "06:00"
  closeTime?: string; // "22:00:00" or "22:00"
  enabled?: boolean;
}

export interface BackendConnectorResponse {
  id: string;
  connectorCode?: string;
  connectorType: ConnectorType | string;
  chargerType?: 'AC' | 'DC' | string;
  powerKw?: number;
  runtimeStatus?: string; // 'AVAILABLE' | 'IN_USE' | 'OFFLINE'
  availableNow?: boolean;
}

export interface BackendChargePointResponse {
  id: string;
  chargePointCode?: string;
  name: string;
  zoneLabel?: string | null;
  maxPowerKw?: number;
  operationalStatus?: string; // 'ACTIVE' | 'OFFLINE' | 'SUSPENDED'
  connectors?: BackendConnectorResponse[];
}

export interface BackendStationDiscoveryItem {
  id: string;
  name: string;
  address: string;
  provinceName?: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  primaryImageUrl?: string;
  priceFromVndPerKwh?: number; // Backend discovery list price field
  basePriceVndPerKwh?: number; // fallback
  maxPowerKw?: number;
  connectorTypes?: (ConnectorType | string)[];
  totalConnectorCount?: number;
  availableConnectorCount?: number;
  openNow?: boolean;
  operatingState?: StationOperatingState | string;
  operationalStatus?: StationOperationalStatus | string;
  operationalStatusReason?: string;
  scheduleConfigured?: boolean;
}

export interface BackendStationDiscoveryDetail {
  id: string;
  stationCode?: string;
  name: string;
  description?: string;
  address?: string;
  wardName?: string;
  provinceName?: string;
  latitude: number;
  longitude: number;
  contactPhone?: string;
  primaryImageUrl?: string;
  assets?: BackendStationAsset[];
  currentPriceVndPerKwh?: number; // Backend discovery detail price field
  basePriceVndPerKwh?: number; // fallback
  open24Hours?: boolean;
  openNow?: boolean;
  operatingState?: StationOperatingState | string;
  operationalStatus?: StationOperationalStatus | string;
  operationalStatusReason?: string;
  scheduleConfigured?: boolean;
  operatingHours?: BackendOperatingHour[];
  cancellationPolicy?: BackendCancellationPolicyResponse | null;
  chargePoints?: BackendChargePointResponse[]; // Real nested structure: chargePoints[].connectors[]
  totalConnectorCount?: number;
  availableConnectorCount?: number;
  maxPowerKw?: number;
  connectorTypes?: (ConnectorType | string)[];
}

export interface BackendCancellationPolicyResponse {
  gracePeriodMinutes?: number;
  refundRules?: BackendRefundRuleResponse[];
}

export interface BackendRefundRuleResponse {
  tier?: string;
  refundPercent?: number;
  minMinutesBeforeStartInclusive?: number | null;
  maxMinutesBeforeStartExclusive?: number | null;
  appliesToNoShow?: boolean;
}

/**
 * Backend availability response (FR04: Available booking times with pricing)
 */
export interface BackendTimeRangeResponse {
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
}

export interface BackendPriceRangeResponse {
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  rateVndPerKwh: number;
  periodCode?: 'NORMAL' | 'PEAK' | 'OFF_PEAK' | string;
}

export interface BackendStationAvailabilityResponse {
  stationId: string;
  connectorId: string;
  date: string; // YYYY-MM-DD
  timezone: string;
  generatedAt: string;
  minDurationMinutes: number;
  durationStepMinutes: number;
  maxDurationMinutes: number;
  operatingWindows: BackendTimeRangeResponse[];
  busyRanges: BackendTimeRangeResponse[];
  priceRanges: BackendPriceRangeResponse[]; // Nested response for available booking times with pricing (FR04)
}

/** DC connector types commonly used for DC Fast Charging */
const DC_CONNECTOR_TYPES = new Set(['CCS2', 'CHADEMO', 'GBT']);

/** Fast charging power threshold in kW (standard DC fast charging is >= 50kW) */
export const FAST_CHARGING_MIN_KW = 50;

/**
 * Derives `hasFastCharging` from station metadata (maxPowerKw, connectorTypes, chargePoints).
 * Backend does not need to send `hasFastCharging` explicitly.
 */
export function deriveHasFastCharging(source: {
  maxPowerKw?: number;
  connectorTypes?: (ConnectorType | string)[];
  chargePoints?: BackendChargePointResponse[];
}): boolean {
  // 1. Check max power rating
  if (typeof source.maxPowerKw === 'number' && source.maxPowerKw >= FAST_CHARGING_MIN_KW) {
    return true;
  }

  // 2. Check charge points and their connectors (from detail response)
  if (source.chargePoints && source.chargePoints.length > 0) {
    for (const cp of source.chargePoints) {
      if (typeof cp.maxPowerKw === 'number' && cp.maxPowerKw >= FAST_CHARGING_MIN_KW) {
        return true;
      }
      if (cp.connectors && cp.connectors.length > 0) {
        const hasFastConn = cp.connectors.some((conn) => {
          if (conn.chargerType?.toUpperCase() === 'DC') return true;
          if (typeof conn.powerKw === 'number' && conn.powerKw >= FAST_CHARGING_MIN_KW) return true;
          if (conn.connectorType && DC_CONNECTOR_TYPES.has(conn.connectorType.toUpperCase())) return true;
          return false;
        });
        if (hasFastConn) return true;
      }
    }
  }

  // 3. Check connector types list (from discovery item response)
  if (source.connectorTypes && source.connectorTypes.length > 0) {
    const hasDcType = source.connectorTypes.some(
      (type) => typeof type === 'string' && DC_CONNECTOR_TYPES.has(type.toUpperCase()),
    );
    if (hasDcType) return true;
  }

  return false;
}

/** Converts "HH:mm:ss" or "HH:mm" to minutes from midnight */
function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}

/** Formats list of operating hours to display string (e.g. "06:00 - 22:00" or "24/7") */
function formatOperatingHours(
  open24Hours?: boolean,
  hours?: BackendOperatingHour[],
): { operatingHoursText: string; opensAtMin: number; closesAtMin: number } {
  if (open24Hours) {
    return {
      operatingHoursText: '24/7',
      opensAtMin: 0,
      closesAtMin: 1440,
    };
  }

  if (!hours || hours.length === 0) {
    return {
      operatingHoursText: '24/7',
      opensAtMin: 0,
      closesAtMin: 1440,
    };
  }

  const enabledHours = hours.filter((h) => h.enabled !== false);
  const first = enabledHours[0] || hours[0];

  const openTime = first.openTime?.slice(0, 5) || '06:00';
  const closeTime = first.closeTime?.slice(0, 5) || '22:00';

  return {
    operatingHoursText: `${openTime} - ${closeTime}`,
    opensAtMin: parseTimeToMinutes(first.openTime),
    closesAtMin: parseTimeToMinutes(first.closeTime) || 1440,
  };
}

function adaptCancellationPolicy(
  policy?: BackendCancellationPolicyResponse | null,
): CancellationPolicy | undefined {
  if (!policy) return undefined;
  return {
    gracePeriodMinutes: Number(policy.gracePeriodMinutes ?? 0),
    refundRules: (policy.refundRules ?? []).map((rule) => ({
      tier: rule.tier ?? '',
      refundPercent: Number(rule.refundPercent ?? 0),
      minMinutesBeforeStartInclusive: rule.minMinutesBeforeStartInclusive ?? null,
      maxMinutesBeforeStartExclusive: rule.maxMinutesBeforeStartExclusive ?? null,
      appliesToNoShow: Boolean(rule.appliesToNoShow),
    })),
  };
}

/**
 * Adapter: Maps Backend Discovery Item Response -> Frontend Station
 *
 * Mapping rules:
 * - primaryImageUrl          -> imageUrl
 * - priceFromVndPerKwh       -> minRatePerKwh
 * - availableConnectorCount  -> availableConnectors
 * - totalConnectorCount      -> totalConnectors
 * - openNow                  -> isOpen
 * - hasFastCharging          -> derived from maxPowerKw / connectorTypes
 */
export function adaptStationDiscoveryItem(dto: BackendStationDiscoveryItem): Station {
  const price =
    dto.priceFromVndPerKwh !== undefined && dto.priceFromVndPerKwh !== null
      ? Number(dto.priceFromVndPerKwh)
      : dto.basePriceVndPerKwh !== undefined && dto.basePriceVndPerKwh !== null
        ? Number(dto.basePriceVndPerKwh)
        : undefined;

  const operatingState: StationOperatingState =
    (dto.operatingState as StationOperatingState) ||
    (dto.operationalStatus === 'PAUSED'
      ? 'PAUSED_BY_OWNER'
      : dto.operationalStatus === 'MAINTENANCE'
        ? 'MAINTENANCE'
        : dto.openNow
          ? 'OPEN'
          : 'CLOSED_BY_SCHEDULE');

  return {
    id: String(dto.id),
    name: dto.name || '',
    address: dto.address || '',
    provinceName: dto.provinceName,
    latitude: Number(dto.latitude),
    longitude: Number(dto.longitude),
    distanceKm: dto.distanceKm !== undefined && dto.distanceKm !== null ? Number(dto.distanceKm) : undefined,
    imageUrl: dto.primaryImageUrl,
    opensAtMin: 0,
    closesAtMin: 1440,
    availableConnectors: Number(dto.availableConnectorCount ?? 0),
    totalConnectors: Number(dto.totalConnectorCount ?? 0),
    isOpen: dto.openNow !== undefined ? Boolean(dto.openNow) : operatingState === 'OPEN',
    operatingState,
    operationalStatus: dto.operationalStatus as StationOperationalStatus | undefined,
    operationalStatusReason: dto.operationalStatusReason,
    scheduleConfigured: dto.scheduleConfigured,
    hasFastCharging: deriveHasFastCharging(dto),
    maxPowerKw: dto.maxPowerKw !== undefined && dto.maxPowerKw !== null ? Number(dto.maxPowerKw) : undefined,
    connectorTypes: dto.connectorTypes ? (Array.from(dto.connectorTypes) as ConnectorType[]) : undefined,
    minRatePerKwh: price,
  };
}

/**
 * Adapter: Maps Backend Discovery Detail Response -> Frontend Station
 *
 * Mapping rules:
 * - primaryImageUrl / assets -> imageUrl
 * - currentPriceVndPerKwh    -> minRatePerKwh
 * - chargePoints[].connectors[] -> calculates totalConnectors & availableConnectors
 * - openNow                  -> isOpen
 * - operatingState           -> maps backend operatingState directly, or derives CLOSED_BY_SCHEDULE vs SCHEDULE_NOT_CONFIGURED
 * - hasFastCharging          -> derived from chargePoints / maxPowerKw
 */
export function adaptStationDiscoveryDetail(dto: BackendStationDiscoveryDetail): Station {
  let calculatedTotal = 0;
  let calculatedAvailable = 0;

  if (dto.chargePoints && dto.chargePoints.length > 0) {
    for (const cp of dto.chargePoints) {
      if (cp.connectors && cp.connectors.length > 0) {
        calculatedTotal += cp.connectors.length;
        calculatedAvailable += cp.connectors.filter(
          (c) => c.availableNow === true || c.runtimeStatus?.toUpperCase() === 'AVAILABLE',
        ).length;
      }
    }
  }

  const totalConnectors = dto.totalConnectorCount ?? calculatedTotal;
  const availableConnectors = dto.availableConnectorCount ?? calculatedAvailable;

  const primaryImage =
    dto.primaryImageUrl ||
    dto.assets?.find((a) => a.isPrimary)?.url ||
    dto.assets?.[0]?.url;

  const { operatingHoursText, opensAtMin, closesAtMin } = formatOperatingHours(
    dto.open24Hours,
    dto.operatingHours,
  );

  const fullAddress = [dto.address, dto.wardName, dto.provinceName].filter(Boolean).join(', ') || dto.address || '';

  const price =
    dto.currentPriceVndPerKwh !== undefined && dto.currentPriceVndPerKwh !== null
      ? Number(dto.currentPriceVndPerKwh)
      : dto.basePriceVndPerKwh !== undefined && dto.basePriceVndPerKwh !== null
        ? Number(dto.basePriceVndPerKwh)
        : undefined;

  const hasSchedule =
    Boolean(dto.open24Hours) ||
    (Array.isArray(dto.operatingHours) && dto.operatingHours.length > 0);

  const operatingState: StationOperatingState =
    (dto.operatingState as StationOperatingState) ||
    (dto.operationalStatus === 'PAUSED'
      ? 'PAUSED_BY_OWNER'
      : dto.operationalStatus === 'MAINTENANCE'
        ? 'MAINTENANCE'
        : dto.openNow
          ? 'OPEN'
          : hasSchedule
            ? 'CLOSED_BY_SCHEDULE'
            : 'SCHEDULE_NOT_CONFIGURED');

  return {
    id: String(dto.id),
    stationCode: dto.stationCode,
    name: dto.name || '',
    address: fullAddress,
    wardName: dto.wardName,
    provinceName: dto.provinceName,
    description: dto.description,
    latitude: Number(dto.latitude),
    longitude: Number(dto.longitude),
    imageUrl: primaryImage,
    contactPhone: dto.contactPhone,
    operatingHours: operatingHoursText,
    open24Hours: Boolean(dto.open24Hours),
    opensAtMin,
    closesAtMin,
    availableConnectors: Number(availableConnectors),
    totalConnectors: Number(totalConnectors),
    isOpen: dto.openNow !== undefined ? Boolean(dto.openNow) : operatingState === 'OPEN',
    operatingState,
    operationalStatus: dto.operationalStatus as StationOperationalStatus | undefined,
    operationalStatusReason: dto.operationalStatusReason,
    scheduleConfigured: dto.scheduleConfigured,
    hasFastCharging: deriveHasFastCharging(dto),
    maxPowerKw: dto.maxPowerKw !== undefined && dto.maxPowerKw !== null ? Number(dto.maxPowerKw) : undefined,
    connectorTypes: dto.connectorTypes ? (Array.from(dto.connectorTypes) as ConnectorType[]) : undefined,
    cancellationPolicy: adaptCancellationPolicy(dto.cancellationPolicy),
    minRatePerKwh: price,
  };
}

/**
 * Adapter: Extracts ChargePoint[] from BackendStationDiscoveryDetail
 */
export function adaptChargePointsFromDetail(dto: BackendStationDiscoveryDetail): ChargePoint[] {
  if (!dto.chargePoints || dto.chargePoints.length === 0) return [];

  return dto.chargePoints.map((cp) => ({
    id: String(cp.id),
    stationId: String(dto.id),
    name: cp.name || `Trụ sạc ${cp.chargePointCode || ''}`.trim(),
    zoneLabel: cp.zoneLabel ?? null,
    maxPowerKw: Number(cp.maxPowerKw || 0),
    status: (cp.operationalStatus as ProvisioningStatus) || 'ACTIVE',
  }));
}

/**
 * Adapter: Extracts Connector[] from BackendStationDiscoveryDetail
 */
export function adaptConnectorsFromDetail(
  dto: BackendStationDiscoveryDetail,
  defaultRatePerKwh?: number,
): Connector[] {
  if (!dto.chargePoints || dto.chargePoints.length === 0) return [];

  const rate =
    dto.currentPriceVndPerKwh !== undefined && dto.currentPriceVndPerKwh !== null
      ? Number(dto.currentPriceVndPerKwh)
      : defaultRatePerKwh || 3500;

  const result: Connector[] = [];

  for (const cp of dto.chargePoints) {
    if (!cp.connectors) continue;
    for (const c of cp.connectors) {
      result.push({
        id: String(c.id),
        chargePointId: String(cp.id),
        stationId: String(dto.id),
        name: c.connectorCode || `Cổng ${c.connectorType}`,
        connectorType: (c.connectorType as ConnectorType) || 'CCS2',
        powerKw: Number(c.powerKw || cp.maxPowerKw || 0),
        currentType: (c.chargerType?.toUpperCase() === 'DC' ? 'DC' : 'AC') as 'AC' | 'DC',
        runtimeStatus: (c.runtimeStatus?.toUpperCase() as ConnectorRuntimeStatus) || (c.availableNow ? 'AVAILABLE' : 'IN_USE'),
        qrToken: String(c.id),
        ratePerKwh: rate,
      });
    }
  }

  return result;
}

/**
 * Maps Frontend sort key ('nearest' | 'cheapest' | 'available')
 * to Backend enum uppercase string ('NEAREST' | 'CHEAPEST' | 'AVAILABLE').
 * Note: 'rating' sort is removed/hidden per backend and SRS spec.
 */
export type BackendStationDiscoverySort = 'NEAREST' | 'CHEAPEST' | 'AVAILABLE';

export function mapFrontendSortToBackend(sort?: string): BackendStationDiscoverySort {
  if (!sort) return 'NEAREST';
  const normalized = sort.trim().toLowerCase();
  if (normalized === 'cheapest') return 'CHEAPEST';
  if (normalized === 'available') return 'AVAILABLE';
  return 'NEAREST';
}

/**
 * Builds URLSearchParams for backend GET /api/v1/stations (@ModelAttribute StationDiscoveryFilter)
 */
export function buildStationDiscoveryQueryParams(filter: {
  query?: string;
  connectorTypes?: ConnectorType[];
  currentType?: 'AC' | 'DC';
  availableOnly?: boolean;
  openOnly?: boolean;
  minPowerKw?: number;
  provinceCode?: string;
  maxDistanceKm?: number;
  latitude?: number;
  longitude?: number;
  sort?: string;
}, pagination: {
  page?: number;
  size?: number;
} = {}): URLSearchParams {
  const params = new URLSearchParams();

  if (filter.query) params.append('query', filter.query.trim());
  if (filter.availableOnly) params.append('availableOnly', 'true');
  if (filter.openOnly) params.append('openOnly', 'true');
  if (filter.currentType) params.append('chargerType', filter.currentType);
  if (filter.minPowerKw !== undefined && filter.minPowerKw > 0) params.append('minPowerKw', String(filter.minPowerKw));
  if (filter.provinceCode) params.append('provinceCode', filter.provinceCode);
  if (filter.maxDistanceKm !== undefined) params.append('maxDistanceKm', String(filter.maxDistanceKm));
  // Backend validation: latitude & longitude must both be present together
  if (filter.latitude !== undefined && filter.longitude !== undefined) {
    params.append('latitude', String(filter.latitude));
    params.append('longitude', String(filter.longitude));
  }
  if (filter.connectorTypes && filter.connectorTypes.length > 0) {
    filter.connectorTypes.forEach((type) => params.append('connectorTypes', type));
  }

  const sortEnum = mapFrontendSortToBackend(filter.sort);
  params.append('sort', sortEnum);
  if (pagination.page !== undefined) params.append('page', String(pagination.page));
  if (pagination.size !== undefined) params.append('size', String(pagination.size));

  return params;
}

/**
 * Adapter: Maps an array of Backend Station Discovery Items -> Frontend Station[]
 */
export function adaptStationList(items: BackendStationDiscoveryItem[]): Station[] {
  if (!Array.isArray(items)) return [];
  return items.map(adaptStationDiscoveryItem);
}

/**
 * Helper: Find matching price range for a given ISO time string.
 */
export function findPriceRangeForTime(
  priceRanges: BackendPriceRangeResponse[] | undefined,
  timeIso: string,
  fallbackRate = 3400,
): { rateVndPerKwh: number; periodCode: 'NORMAL' | 'PEAK' | 'OFF_PEAK' | string } {
  if (!priceRanges || priceRanges.length === 0) {
    return { rateVndPerKwh: fallbackRate, periodCode: 'NORMAL' };
  }
  const targetMs = new Date(timeIso).getTime();
  const matched = priceRanges.find((r) => {
    const startMs = new Date(r.startAt).getTime();
    const endMs = new Date(r.endAt).getTime();
    return targetMs >= startMs && targetMs < endMs;
  });
  if (matched) {
    return {
      rateVndPerKwh: matched.rateVndPerKwh,
      periodCode: matched.periodCode || 'NORMAL',
    };
  }
  return {
    rateVndPerKwh: priceRanges[0].rateVndPerKwh,
    periodCode: priceRanges[0].periodCode || 'NORMAL',
  };
}

/**
 * Check if a time range [startIso, endIso) overlaps with any busy range.
 */
export function isRangeBusy(
  busyRanges: BackendTimeRangeResponse[] | undefined,
  startIso: string,
  endIso: string,
): boolean {
  if (!busyRanges || busyRanges.length === 0) return false;
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  return busyRanges.some((range) => {
    const bStartMs = new Date(range.startAt).getTime();
    const bEndMs = new Date(range.endAt).getTime();
    return startMs < bEndMs && endMs > bStartMs;
  });
}

/**
 * Check if a time range [startIso, endIso) is within operating windows.
 * If operatingWindows is empty or not configured, returns false if station is closed.
 */
export function isRangeInOperatingWindows(
  operatingWindows: BackendTimeRangeResponse[] | undefined,
  startIso: string,
  endIso: string,
): boolean {
  if (!operatingWindows || operatingWindows.length === 0) return true;
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  return operatingWindows.some((win) => {
    const wStartMs = new Date(win.startAt).getTime();
    const wEndMs = new Date(win.endAt).getTime();
    return startMs >= wStartMs && endMs <= wEndMs;
  });
}
