import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  type ChargePoint,
  type Connector,
  type OperationalChargePointStatus,
} from '@chargeops/api';
import { Card, IconLock, PageHeader, Skeleton, useToast } from '@chargeops/ui';
import { getApiErrorMessage } from '../../i18n';
import { ChargerStatsStrip } from '../features/chargers/ChargerStatsStrip';
import { ChargerTable, type ChargePointGroup } from '../features/chargers/ChargerTable';
import { ChargerDetailPanel } from '../features/chargers/ChargerDetailPanel';
import { StatusChangeDialog, type StatusIntent } from '../features/chargers/StatusChangeDialog';
import { nextOperationalStatus, nextConnectorStatus } from '../features/chargers/chargerStatus';

import { useOwnerStation } from '../context/OwnerStationContext';

export function Chargers() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const { selectedStationId, currentStation } = useOwnerStation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Pending operational status change awaiting confirmation (null = dialog closed). */
  const [intent, setIntent] = useState<StatusIntent | null>(null);

  const chargePointsQ = useQuery({
    queryKey: ['chargePoints', 'station', selectedStationId],
    queryFn: () => (selectedStationId ? api.chargePoints.list(selectedStationId) : Promise.resolve([])),
    enabled: Boolean(selectedStationId),
  });
  const connectorsQ = useQuery({
    queryKey: ['connectors', 'station', selectedStationId],
    queryFn: () => (selectedStationId ? api.connectors.list(undefined, selectedStationId) : Promise.resolve([])),
    enabled: Boolean(selectedStationId),
  });

  const isLoading = chargePointsQ.isLoading || connectorsQ.isLoading;
  const error = chargePointsQ.error || connectorsQ.error;

  const groups: ChargePointGroup[] = useMemo(() => {
    const cps = chargePointsQ.data ?? [];
    const conns = connectorsQ.data ?? [];
    return cps.map((cp) => ({
      chargePoint: cp,
      connectors: conns.filter((c) => c.chargePointId === cp.id),
    }));
  }, [chargePointsQ.data, connectorsQ.data]);

  const updateChargePoint = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { stationId?: string; name?: string; zoneLabel?: string };
    }) => api.chargePoints.update(id, patch),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('chargePoints.updateSuccess', { id: cp.id }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const changeOperationalStatus = useMutation({
    mutationFn: ({
      id,
      stationId,
      operationalStatus,
      reason,
    }: {
      id: string;
      stationId: string;
      operationalStatus: OperationalChargePointStatus;
      reason: string;
    }) => api.chargePoints.changeOperationalStatus(id, { stationId, operationalStatus, reason }),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('chargePoints.updateSuccess', { id: cp.id }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const updateConnector = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { stationId?: string; chargePointId?: string; runtimeStatus?: Connector['runtimeStatus']; reason?: string };
    }) => api.connectors.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connectors'] }),
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const downloadQr = (c: Connector) => toast(t('connectors.downloadToast', { id: c.connectorCode || c.id }), 'info');

  const selected = groups.find((g) => g.chargePoint.id === selectedId) ?? null;

  /** Status controls never mutate directly — they raise an intent for confirmation. */
  const askChargePoint = (cp: ChargePoint, target?: OperationalChargePointStatus) => {
    if (cp.provisioningStatus !== 'ACTIVE') return;
    const next = target && target !== cp.operationalStatus ? target : nextOperationalStatus(cp.operationalStatus);
    setIntent({
      kind: 'chargePoint',
      chargePoint: cp,
      connectors: groups.find((g) => g.chargePoint.id === cp.id)?.connectors ?? [],
      next,
    });
  };

  const askConnector = (cp: ChargePoint, c: Connector) => {
    const next = nextConnectorStatus(c.runtimeStatus);
    setIntent({ kind: 'connector', chargePoint: cp, connector: c, next });
  };

  const applyIntent = (i: StatusIntent) => {
    const reasonText =
      i.reason?.trim() ||
      (i.next === 'MAINTENANCE'
        ? 'Bảo trì thiết bị'
        : i.next === 'OFFLINE'
          ? 'Tạm ngắt vận hành'
          : 'Mở hoạt động thiết bị');

    if (i.kind === 'chargePoint') {
      changeOperationalStatus.mutate(
        {
          id: i.chargePoint.id,
          stationId: i.chargePoint.stationId,
          operationalStatus: i.next,
          reason: reasonText,
        },
        { onSuccess: () => setIntent(null) },
      );
    } else {
      updateConnector.mutate(
        {
          id: i.connector.id,
          patch: {
            stationId: i.chargePoint.stationId,
            chargePointId: i.chargePoint.id,
            runtimeStatus: i.next,
            reason: reasonText,
          },
        },
        {
          onSuccess: () => {
            toast(t('connectors.updateSuccess', { id: i.connector.connectorCode || i.connector.id }), 'success');
            setIntent(null);
          },
        },
      );
    }
  };

  return (
    <>
      <PageHeader
        title={t('chargers.title')}
        subtitle={
          currentStation
            ? `${t('chargers.subtitle')} · ${currentStation.name}`
            : t('chargers.subtitle')
        }
      />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('chargers.loadError', { message: (error as Error).message })}
        </Card>
      ) : isLoading ? (
        <ChargersSkeleton />
      ) : (
        <>
          <ChargerStatsStrip groups={groups} />

          <div className="mb-[13px] flex items-center gap-2 text-[12px] font-medium text-muted">
            <IconLock size={15} className="shrink-0 text-warn" />
            <span>{t('chargers.description')}</span>
          </div>

          <div
            className="grid items-start gap-[13px]"
            style={{ gridTemplateColumns: selected ? 'minmax(0,1.5fr) minmax(0,1fr)' : '1fr' }}
          >
            <ChargerTable
              groups={groups}
              selectedId={selectedId}
              onSelect={(cp) => setSelectedId(cp.id)}
              onRename={(id, name) =>
                updateChargePoint.mutate({
                  id,
                  patch: {
                    stationId: groups.find((g) => g.chargePoint.id === id)?.chargePoint.stationId,
                    name,
                  },
                })
              }
              onCycleStatus={askChargePoint}
              onCycleConnectorStatus={(c) => {
                const cp = groups.find((g) => g.connectors.some((x) => x.id === c.id))?.chargePoint;
                if (cp) askConnector(cp, c);
              }}
              onDownloadQr={downloadQr}
            />

            {selected && (
              <ChargerDetailPanel
                chargePoint={selected.chargePoint}
                connectors={selected.connectors}
                saving={updateChargePoint.isPending || changeOperationalStatus.isPending}
                onClose={() => setSelectedId(null)}
                onSave={(id, patch) =>
                  updateChargePoint.mutate({
                    id,
                    patch: {
                      ...patch,
                      stationId: selected.chargePoint.stationId,
                    },
                  })
                }
                onCycleStatus={askChargePoint}
                onCycleConnectorStatus={(c) => askConnector(selected.chargePoint, c)}
                onDownloadQr={downloadQr}
              />
            )}
          </div>
        </>
      )}

      <StatusChangeDialog
        intent={intent}
        saving={updateChargePoint.isPending || changeOperationalStatus.isPending || updateConnector.isPending}
        onClose={() => setIntent(null)}
        onConfirm={applyIntent}
      />
    </>
  );
}

function ChargersSkeleton() {
  return (
    <>
      <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-[11px]" />
        ))}
      </div>
      <Skeleton className="h-[320px] rounded-card" />
    </>
  );
}
