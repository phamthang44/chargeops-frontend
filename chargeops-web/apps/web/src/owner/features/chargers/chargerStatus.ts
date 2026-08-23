import type { ConnectorRuntimeStatus, OperationalChargePointStatus, ProvisioningStatus } from '@chargeops/api';

export const PROVISIONING_STATUS_PILL: Record<ProvisioningStatus, { bg: string; fg: string; label: string }> = {
  PENDING_ACTIVATION: { bg: 'var(--color-chip)', fg: 'var(--color-muted)', label: 'Chờ kích hoạt' },
  ACTIVE: { bg: 'var(--color-good-soft)', fg: 'var(--color-good-deep)', label: 'Đã kích hoạt' },
  SUSPENDED: { bg: 'var(--color-bad-soft)', fg: 'var(--color-bad-deep)', label: 'Tạm ngưng vận hành' },
};

export const OPERATIONAL_STATUS_PILL: Record<OperationalChargePointStatus, { bg: string; fg: string; label: string }> = {
  AVAILABLE: { bg: 'var(--color-good-soft)', fg: 'var(--color-good-deep)', label: 'Hoạt động' },
  OFFLINE: { bg: 'var(--color-bad-soft)', fg: 'var(--color-bad-deep)', label: 'Offline' },
  MAINTENANCE: { bg: 'var(--color-warn-soft)', fg: 'var(--color-warn-deep)', label: 'Bảo trì' },
};

export const CONNECTOR_PILL: Record<ConnectorRuntimeStatus, { bg: string; fg: string; label: string }> = {
  AVAILABLE: { bg: 'var(--color-good-soft)', fg: 'var(--color-good-deep)', label: 'Sẵn sàng' },
  IN_USE: { bg: 'var(--color-brand-soft)', fg: 'var(--color-brand)', label: 'Đang sạc' },
  OFFLINE: { bg: 'var(--color-bad-soft)', fg: 'var(--color-bad-deep)', label: 'Offline' },
};

export function getChargePointPill(
  provisioningStatus?: ProvisioningStatus,
  operationalStatus?: OperationalChargePointStatus,
): { bg: string; fg: string; label: string } {
  if (provisioningStatus === 'PENDING_ACTIVATION') {
    return PROVISIONING_STATUS_PILL.PENDING_ACTIVATION;
  }
  if (provisioningStatus === 'SUSPENDED') {
    return PROVISIONING_STATUS_PILL.SUSPENDED;
  }
  if (operationalStatus === 'OFFLINE') {
    return OPERATIONAL_STATUS_PILL.OFFLINE;
  }
  if (operationalStatus === 'MAINTENANCE') {
    return OPERATIONAL_STATUS_PILL.MAINTENANCE;
  }
  return OPERATIONAL_STATUS_PILL.AVAILABLE;
}

export function canToggleChargePoint(provisioningStatus?: ProvisioningStatus): boolean {
  return provisioningStatus === 'ACTIVE';
}

/** Owner/staff may cycle between these Operational states. */
export const OWNER_OPERATIONAL_CYCLE: OperationalChargePointStatus[] = ['AVAILABLE', 'OFFLINE', 'MAINTENANCE'];

export function nextOperationalStatus(current?: OperationalChargePointStatus): OperationalChargePointStatus {
  if (current === 'AVAILABLE') return 'OFFLINE';
  if (current === 'OFFLINE') return 'MAINTENANCE';
  return 'AVAILABLE';
}

export function getConnectorPill(status?: ConnectorRuntimeStatus): { bg: string; fg: string; label: string } {
  if (!status) return CONNECTOR_PILL.OFFLINE;
  return CONNECTOR_PILL[status] || CONNECTOR_PILL.OFFLINE;
}

/** Owner/staff may cycle only between these two Connector states — IN_USE is system-set. */
export const OWNER_CONNECTOR_CYCLE: ConnectorRuntimeStatus[] = ['AVAILABLE', 'OFFLINE'];

export function nextConnectorStatus(current?: ConnectorRuntimeStatus): ConnectorRuntimeStatus {
  return current === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
}

/**
 * BR-CHG-01: a Charge Point that is not ACTIVE or is OFFLINE/MAINTENANCE takes all of its Connectors down
 * with it — so no connector under it is bookable regardless of its own stored runtime status.
 */
export function effectiveConnectorStatus(
  provisioningStatus?: ProvisioningStatus,
  operationalStatus?: OperationalChargePointStatus,
  connectorStatus?: ConnectorRuntimeStatus,
): ConnectorRuntimeStatus {
  if (provisioningStatus !== 'ACTIVE' || operationalStatus === 'OFFLINE' || operationalStatus === 'MAINTENANCE') {
    return 'OFFLINE';
  }
  if (connectorStatus === 'IN_USE') return 'IN_USE';
  if (connectorStatus === 'AVAILABLE') return 'AVAILABLE';
  return 'OFFLINE';
}

/** A connector is only owner-togglable while its device is ACTIVE & AVAILABLE and it isn't mid-session. */
export function canToggleConnector(
  provisioningStatus?: ProvisioningStatus,
  operationalStatus?: OperationalChargePointStatus,
  connectorStatus?: ConnectorRuntimeStatus,
): boolean {
  return provisioningStatus === 'ACTIVE' && operationalStatus === 'AVAILABLE' && connectorStatus !== 'IN_USE';
}

/** Utilization bar colour: green while in use, grey when idle/down. */
export function utilColor(c: { runtimeStatus: ConnectorRuntimeStatus; utilizationPct: number }): string {
  if (c.runtimeStatus !== 'AVAILABLE' || c.utilizationPct === 0) return 'var(--color-disabled)';
  return c.utilizationPct >= 80 ? 'var(--color-good-deep)' : 'var(--color-owner)';
}
