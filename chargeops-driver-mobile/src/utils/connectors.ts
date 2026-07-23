import type { ChargePoint, Connector, ConnectorRuntimeStatus } from '@/types';

/**
 * A Charge Point's provisioning status governs its Connectors: if the device is
 * not ACTIVE, none of its ports can be used, whatever their own stored status
 * says (BR-CHG-01).
 *
 * This is derived for display only and never written back — so when the owner
 * brings a device back online, each port returns to the status they last set
 * rather than all of them being switched on together.
 */
export function effectiveConnectorStatus(
  chargePointStatus: ChargePoint['status'],
  connectorStatus: ConnectorRuntimeStatus,
): ConnectorRuntimeStatus {
  return chargePointStatus === 'ACTIVE' ? connectorStatus : 'OFFLINE';
}

/** A Charge Point with its ports resolved — the shape FR04 asks the detail page to show. */
export interface ChargePointGroup {
  chargePoint: ChargePoint;
  connectors: (Connector & { effectiveStatus: ConnectorRuntimeStatus })[];
}

/** Group connectors under their Charge Point, preserving the charge-point order. */
export function groupByChargePoint(
  chargePoints: ChargePoint[],
  connectors: Connector[],
): ChargePointGroup[] {
  return chargePoints.map((chargePoint) => ({
    chargePoint,
    connectors: connectors
      .filter((c) => c.chargePointId === chargePoint.id)
      .map((c) => ({
        ...c,
        effectiveStatus: effectiveConnectorStatus(chargePoint.status, c.runtimeStatus),
      })),
  }));
}

/** Only an AVAILABLE port on an ACTIVE device can take a booking. */
export function isBookable(chargePoint: ChargePoint, connector: Connector): boolean {
  return effectiveConnectorStatus(chargePoint.status, connector.runtimeStatus) === 'AVAILABLE';
}
