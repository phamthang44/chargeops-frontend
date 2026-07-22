import type { ConnectorRuntimeStatus, ProvisioningStatus } from '@chargeops/api';

/** Charge Point status pill (owner cycles active<->offline only; unclaimed/suspended are admin-only). */
export const CHARGE_POINT_PILL: Record<ProvisioningStatus, { bg: string; fg: string; label: string }> = {
  unclaimed: { bg: 'var(--color-chip)', fg: 'var(--color-muted)', label: 'Chưa gán' },
  active: { bg: 'var(--color-good-soft)', fg: 'var(--color-good-deep)', label: 'Hoạt động' },
  offline: { bg: 'var(--color-bad-soft)', fg: 'var(--color-bad-deep)', label: 'Offline' },
  suspended: { bg: 'var(--color-bad-soft)', fg: 'var(--color-bad-deep)', label: 'Đình chỉ' },
};

/** Owner/staff may cycle only between these two Charge Point states. */
export const OWNER_CHARGE_POINT_CYCLE: ProvisioningStatus[] = ['active', 'offline'];

export function nextChargePointStatus(current: ProvisioningStatus): ProvisioningStatus {
  const i = OWNER_CHARGE_POINT_CYCLE.indexOf(current);
  return i < 0 ? current : OWNER_CHARGE_POINT_CYCLE[(i + 1) % OWNER_CHARGE_POINT_CYCLE.length];
}

/** Connector runtime status pill (owner cycles available<->offline; in-use is system-set, read-only). */
export const CONNECTOR_PILL: Record<ConnectorRuntimeStatus, { bg: string; fg: string; label: string }> = {
  available: { bg: 'var(--color-good-soft)', fg: 'var(--color-good-deep)', label: 'Sẵn sàng' },
  inuse: { bg: 'var(--color-brand-soft)', fg: 'var(--color-brand)', label: 'Đang sạc' },
  offline: { bg: 'var(--color-bad-soft)', fg: 'var(--color-bad-deep)', label: 'Offline' },
};

/** Owner/staff may cycle only between these two Connector states — in-use is never owner-selectable. */
export const OWNER_CONNECTOR_CYCLE: ConnectorRuntimeStatus[] = ['available', 'offline'];

export function nextConnectorStatus(current: ConnectorRuntimeStatus): ConnectorRuntimeStatus {
  const i = OWNER_CONNECTOR_CYCLE.indexOf(current);
  return i < 0 ? current : OWNER_CONNECTOR_CYCLE[(i + 1) % OWNER_CONNECTOR_CYCLE.length];
}

/**
 * BR-CHG-01: a Charge Point that is not ACTIVE takes all of its Connectors down
 * with it — an UNCLAIMED/OFFLINE/SUSPENDED device cannot serve any port, so no
 * connector under it is bookable regardless of its own stored runtime status.
 *
 * This is derived for display, never written back: the connector keeps its own
 * status so that bringing the device back ACTIVE restores exactly the per-port
 * state the owner last chose (a connector they deliberately took offline stays
 * offline) instead of silently re-enabling everything.
 */
export function effectiveConnectorStatus(
  chargePointStatus: ProvisioningStatus,
  connectorStatus: ConnectorRuntimeStatus,
): ConnectorRuntimeStatus {
  return chargePointStatus === 'active' ? connectorStatus : 'offline';
}

/** A connector is only owner-togglable while its device is ACTIVE and it isn't mid-session. */
export function canToggleConnector(
  chargePointStatus: ProvisioningStatus,
  connectorStatus: ConnectorRuntimeStatus,
): boolean {
  return chargePointStatus === 'active' && connectorStatus !== 'inuse';
}

/** Utilization bar colour: green while in use, grey when idle/down. */
export function utilColor(c: { runtimeStatus: ConnectorRuntimeStatus; utilizationPct: number }): string {
  if (c.runtimeStatus !== 'available' || c.utilizationPct === 0) return 'var(--color-disabled)';
  return c.utilizationPct >= 80 ? 'var(--color-good-deep)' : 'var(--color-owner)';
}
