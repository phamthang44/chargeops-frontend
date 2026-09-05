import { apiBaseUrl } from './stationService';

export interface AdministrativeProvince {
  code: string;
  name: string;
  fullName: string;
}

/** Fallback list of key EV charging municipalities if API is unreachable */
export const FALLBACK_PROVINCES: AdministrativeProvince[] = [
  { code: '01', name: 'Hà Nội', fullName: 'Thành phố Hà Nội' },
  { code: '79', name: 'Hồ Chí Minh', fullName: 'Thành phố Hồ Chí Minh' },
  { code: '48', name: 'Đà Nẵng', fullName: 'Thành phố Đà Nẵng' },
  { code: '31', name: 'Hải Phòng', fullName: 'Thành phố Hải Phòng' },
  { code: '92', name: 'Cần Thơ', fullName: 'Thành phố Cần Thơ' },
];

// In-memory cache to guarantee 0ms latency on subsequent calls and avoid repeated network calls
let cachedProvinces: AdministrativeProvince[] | null = null;
let inflightPromise: Promise<AdministrativeProvince[]> | null = null;

/**
 * Fetch all administrative provinces from backend LocationController (/api/v1/administrative-units/provinces).
 * Leverages in-memory caching and inflight deduplication so UI never lags.
 */
export async function getAdministrativeProvinces(): Promise<AdministrativeProvince[]> {
  if (cachedProvinces && cachedProvinces.length > 0) {
    return cachedProvinces;
  }

  if (inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/administrative-units/provinces`, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const payload = await response.json();
        const list: AdministrativeProvince[] | undefined = payload?.data;
        if (Array.isArray(list) && list.length > 0) {
          cachedProvinces = list;
          return list;
        }
      }
    } catch {
      // Fallback gracefully to predefined list
    } finally {
      inflightPromise = null;
    }

    return FALLBACK_PROVINCES;
  })();

  return inflightPromise;
}
