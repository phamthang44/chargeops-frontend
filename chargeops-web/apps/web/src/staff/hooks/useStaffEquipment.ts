import { useQuery } from '@tanstack/react-query';
import { useApi, type StaffChargePointItem, type StaffConnectorItem } from '@chargeops/api';

export interface StaffEquipmentGroup {
  chargePoint: StaffChargePointItem;
  connectors: StaffConnectorItem[];
}

/**
 * Charge points and their connectors for the assigned station, via the
 * staff-scoped endpoints (`GET /staff/stations/{id}/charge-points` +
 * `/charge-points/{cpId}/connectors`). The staff connector DTO carries no
 * `chargePointId`, so the per-charge-point arrays are kept together as groups
 * instead of being flattened — one fan-out query, shared (react-query dedupes
 * on the key) between the dashboard and the chargers screen.
 */
export function useStaffEquipment(stationId: string | undefined) {
  const api = useApi();

  const equipmentQ = useQuery({
    queryKey: ['staff', 'equipment', stationId],
    queryFn: async (): Promise<StaffEquipmentGroup[]> => {
      const chargePoints = await api.staffOperations.listChargePoints(stationId as string);
      const connectorsPerChargePoint = await Promise.all(
        chargePoints.map((cp) => api.staffOperations.listConnectors(stationId as string, cp.id)),
      );
      return chargePoints.map((chargePoint, i) => ({
        chargePoint,
        connectors: connectorsPerChargePoint[i] ?? [],
      }));
    },
    enabled: Boolean(stationId),
    staleTime: 15_000,
  });

  const groups = equipmentQ.data ?? [];
  const chargePoints = groups.map((g) => g.chargePoint);
  const connectors = groups.flatMap((g) => g.connectors);

  return {
    groups,
    chargePoints,
    connectors,
    offlineConnectors: connectors.filter((c) => c.runtimeStatus === 'OFFLINE'),
    isLoading: equipmentQ.isLoading,
    error: equipmentQ.error,
    refetch: equipmentQ.refetch,
  };
}
