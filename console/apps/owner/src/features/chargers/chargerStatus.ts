import type { ChargerStatus } from '@chargeops/api';

/** Concrete pill colours for the clickable charger-status control (owner: 3 states). */
export const CHARGER_PILL: Record<ChargerStatus, { bg: string; fg: string; label: string }> = {
  available: { bg: '#eafaf1', fg: '#0c7a3e', label: 'Sẵn sàng' },
  maintenance: { bg: '#fdf8ec', fg: '#9a6b16', label: 'Bảo trì' },
  offline: { bg: '#fdf3f2', fg: '#c0392b', label: 'Offline' },
  unclaimed: { bg: '#eef0f2', fg: '#62656e', label: 'Chưa gán' },
};

/** Owner may cycle only these three operational states. */
export const OWNER_CYCLE: ChargerStatus[] = ['available', 'maintenance', 'offline'];

export function nextStatus(current: ChargerStatus): ChargerStatus {
  const i = OWNER_CYCLE.indexOf(current);
  return OWNER_CYCLE[(i + 1) % OWNER_CYCLE.length];
}

/** Utilization bar colour: green while in use, grey when idle/down. */
export function utilColor(c: { status: ChargerStatus; utilizationPct: number }): string {
  if (c.status !== 'available' || c.utilizationPct === 0) return '#d6d9df';
  return c.utilizationPct >= 80 ? '#0d8a5a' : '#12a150';
}
