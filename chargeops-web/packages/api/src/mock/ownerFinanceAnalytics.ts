import type { OwnerFinanceAnalytics } from '../types';

/** Illustrative mock-only cash events, independent of booking price estimates. */
export function mockOwnerFinanceAnalytics(
  stations: { id: string; name: string; stationCode?: string }[],
  params: { stationId?: string; period?: '7d' | '30d' },
  now = new Date(),
): OwnerFinanceAnalytics {
  const today = new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  const days = params.period === '30d' ? 30 : 7;
  const end = new Date(`${today}T00:00:00+07:00`).getTime();
  const start = end - (days - 1) * 86400000;
  const selected = stations.slice(0, 2).filter((station) => !params.stationId || station.id === params.stationId);
  const totals = new Map<string, { grossVnd: number; refundedVnd: number }>();
  const daily = Array.from({ length: days }, (_, index) => {
    const age = days - index - 1;
    let grossVnd = 0, refundedVnd = 0;
    for (const station of selected) {
      const rank = stations.findIndex((item) => item.id === station.id);
      const gross = rank === 0 && age < 7 ? (age + 1) * 120000 : rank === 1 && age === 12 ? 240000 : 0;
      const refunded = age === 1 ? 120000 : 0;
      grossVnd += gross; refundedVnd += refunded;
      const total = totals.get(station.id) ?? { grossVnd: 0, refundedVnd: 0 };
      total.grossVnd += gross; total.refundedVnd += refunded;
      totals.set(station.id, total);
    }
    return { date: new Date(start + index * 86400000 + 7 * 3600000).toISOString().slice(0, 10), grossVnd, refundedVnd, netVnd: grossVnd - refundedVnd };
  });
  const grossVnd = daily.reduce((sum, row) => sum + row.grossVnd, 0);
  const refundedVnd = daily.reduce((sum, row) => sum + row.refundedVnd, 0);
  const rows = selected.map((station) => {
    const total = totals.get(station.id)!;
    return { stationId: station.id, stationCode: station.stationCode ?? station.id, stationName: station.name,
      ...total, netVnd: total.grossVnd - total.refundedVnd };
  }).filter((row) => row.grossVnd || row.refundedVnd).sort((a, b) => b.netVnd - a.netVnd);
  return { environment: 'SIMULATOR', currency: 'VND', timezone: 'Asia/Ho_Chi_Minh',
    period: params.period ?? '7d', stationId: params.stationId ?? null, from: new Date(start).toISOString(),
    to: new Date(end + 86400000).toISOString(), generatedAt: now.toISOString(),
    grossVnd, refundedVnd, netVnd: grossVnd - refundedVnd, daily, stations: rows, stationCount: rows.length, stationLimit: 10 };
}
