import { chargersMock, reviewsMock, slotsMock, stationsMock } from '@/mock/stations.mock';
import type { Charger, Review, Slot, Station } from '@/types';

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

export async function getNearbyStations(): Promise<Station[]> {
  // NOW: return mock. LATER: GET /stations/nearby?lat=&lng=
  return simulateNetwork(stationsMock);
}

export async function getStationById(id: string): Promise<Station | null> {
  // NOW: return mock. LATER: GET /stations/:id
  const station = stationsMock.find((s) => s.id === id) ?? null;
  return simulateNetwork(station);
}

export async function getChargersByStation(stationId: string): Promise<Charger[]> {
  // NOW: return mock. LATER: GET /stations/:stationId/chargers
  const chargers = chargersMock.filter((c) => c.stationId === stationId);
  return simulateNetwork(chargers);
}

export async function getSlotsByCharger(chargerId: string): Promise<Slot[]> {
  // NOW: return mock. LATER: GET /chargers/:chargerId/slots
  const slots = slotsMock.filter((s) => s.chargerId === chargerId);
  return simulateNetwork(slots);
}

export async function getReviewsByStation(stationId: string): Promise<Review[]> {
  // NOW: return mock. LATER: GET /stations/:stationId/reviews
  const reviews = reviewsMock.filter((r) => r.stationId === stationId);
  return simulateNetwork(reviews);
}
