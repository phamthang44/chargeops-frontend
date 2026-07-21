import type { ChargerStatus } from '@chargeops/api';

/** Concrete pill colours (CSS var refs) for the clickable charger-status control (owner: 3 states). */
export const CHARGER_PILL: Record<ChargerStatus, { bg: string; fg: string; label: string }> = {
  available: { bg: 'var(--color-good-soft)', fg: 'var(--color-good-deep)', label: 'Sẵn sàng' },
  maintenance: { bg: 'var(--color-warn-soft)', fg: 'var(--color-warn-deep)', label: 'Bảo trì' },
  offline: { bg: 'var(--color-bad-soft)', fg: 'var(--color-bad-deep)', label: 'Offline' },
  unclaimed: { bg: 'var(--color-chip)', fg: 'var(--color-muted)', label: 'Chưa gán' },
};

/** Owner may cycle only these three operational states. */
export const OWNER_CYCLE: ChargerStatus[] = ['available', 'maintenance', 'offline'];

export function nextStatus(current: ChargerStatus): ChargerStatus {
  const i = OWNER_CYCLE.indexOf(current);
  return OWNER_CYCLE[(i + 1) % OWNER_CYCLE.length];
}

/** Utilization bar colour: green while in use, grey when idle/down. */
export function utilColor(c: { status: ChargerStatus; utilizationPct: number }): string {
  if (c.status !== 'available' || c.utilizationPct === 0) return 'var(--color-disabled)';
  return c.utilizationPct >= 80 ? 'var(--color-good-deep)' : 'var(--color-owner)';
}
