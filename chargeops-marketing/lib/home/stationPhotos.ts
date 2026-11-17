import { STATIONS, type CoverageStation } from "@/components/stations";

/*
 * Illustrative photos for the sample stations. They are the AI-made brand
 * photos from /public/home (same style as the home page), not pictures of the
 * real sites, and the page labels them as illustrations. Real photos from the
 * public API take over when a station has them.
 */
const POOL = ["/home/hero.webp", "/home/about1.webp", "/home/about2.webp"];
const CITY_MAIN: Record<string, string> = {
  "Hà Nội": "/home/hanoi.webp",
  "Đà Nẵng": "/home/danang.webp",
};

export function illustrativePhotos(station: CoverageStation): string[] {
  const sameCity = STATIONS.filter((s) => s.city === station.city);
  const idx = Math.max(0, sameCity.findIndex((s) => s.slug === station.slug));
  const main = CITY_MAIN[station.city] ?? POOL[idx % POOL.length];
  const rest = POOL.filter((p) => p !== main);
  return [main, rest[idx % rest.length], "/home/booking.webp"];
}

/**
 * The public API sends full province names ("Thành phố Hồ Chí Minh",
 * "Thành phố Hà Nội"); the sample list uses short ones. One name per city
 * keeps the filter chips from showing the same city twice.
 */
export function cityName(city: string): string {
  const short = city.replace(/^(Thành phố|TP\.?)\s+/i, "").trim();
  return /^Hồ Chí Minh$/i.test(short) ? "TP. Hồ Chí Minh" : short;
}

/** The station API helpers fall back to the sample list, whose media URLs are placeholders. */
export function isSampleStation(station: CoverageStation): boolean {
  return STATIONS.some((s) => s.id === station.id);
}

/** Cover photo for a station card: real photo for live stations, illustration for samples. */
export function stationCover(station: CoverageStation): { src: string; illustrative: boolean } {
  const real = !isSampleStation(station) && (station.primaryImageUrl || station.images?.[0]);
  return real ? { src: real, illustrative: false } : { src: illustrativePhotos(station)[0], illustrative: true };
}
