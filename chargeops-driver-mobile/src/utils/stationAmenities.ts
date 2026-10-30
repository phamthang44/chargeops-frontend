import type { Amenity } from '../types';

export const CANONICAL_AMENITIES: readonly Amenity[] = [
  'wifi',
  'food',
  'coffee',
  'parking',
  'security',
  'restroom',
  'lounge',
  'atm',
  'carwash',
  'shop',
];

const ALIAS_MAP: Record<string, Amenity> = {
  WIFI: 'wifi',
  RESTROOM: 'restroom',
  PARKING: 'parking',
  CAFE: 'coffee',
  CONVENIENCE_STORE: 'shop',
};

/**
 * Normalizes, deduplicates, and orders station amenities.
 * - Maps legacy uppercase aliases (WIFI -> wifi, CAFE -> coffee, RESTROOM -> restroom, PARKING -> parking, CONVENIENCE_STORE -> shop)
 * - Preserves SHOPPING legacy without converting to shop
 * - Orders items according to canonical catalog order
 * - Discards unknown/invalid items
 * - Returns [] for null, undefined, or non-array inputs
 */
export function normalizeStationAmenities(raw: unknown): Amenity[] {
  if (!Array.isArray(raw)) return [];

  const canonicalSet = new Set<Amenity>();
  let hasShopping = false;

  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;

    // Check legacy SHOPPING
    if (trimmed === 'SHOPPING' || trimmed.toLowerCase() === 'shopping') {
      hasShopping = true;
      continue;
    }

    // Check alias
    const mappedAlias = ALIAS_MAP[trimmed] || ALIAS_MAP[trimmed.toUpperCase()];
    if (mappedAlias) {
      canonicalSet.add(mappedAlias);
      continue;
    }

    // Check canonical (case-insensitive match)
    const lower = trimmed.toLowerCase() as Amenity;
    if (CANONICAL_AMENITIES.includes(lower)) {
      canonicalSet.add(lower);
    }
  }

  // Order canonical items according to CANONICAL_AMENITIES
  const ordered = CANONICAL_AMENITIES.filter((code) => canonicalSet.has(code));

  if (hasShopping) {
    ordered.push('SHOPPING');
  }

  return ordered;
}
