import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  type AdminStationDetail,
  type AdminStationListItem,
  type ChargePoint,
  type Connector,
  type Station,
} from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  IconArrowLeft,
  IconPin,
  IconPlusCircle,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../../i18n';
import {
  EquipmentStatusHistoryDrawer,
  type EquipmentStatusTarget,
} from '../../../shared/equipment/EquipmentStatusHistoryDrawer';
import {
  ActivateChargePointModal,
  AddConnectorModal,
  ChargePointItemCard,
  ConfirmDeleteModal,
  CreateChargePointModal,
  EditConnectorModal,
  ProvisioningStatusLegend,
  SuspendReactivateChargePointModal,
} from './provisioning';

// Re-export modals for backward compatibility with external consumers (e.g. Provisioning.tsx)
export { ActivateChargePointModal, ConfirmDeleteModal };

export interface StationProvisioningWorkspaceProps {
  station: AdminStationListItem | AdminStationDetail | Station;
  onBack: () => void;
  onManageLicense?: () => void;
}

export function StationProvisioningWorkspace({
  station,
  onBack,
  onManageLicense,
}: StationProvisioningWorkspaceProps) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const [creatingCp, setCreatingCp] = useState(false);
  const [addingToCp, setAddingToCp] = useState<ChargePoint | null>(null);
  const [editingConnector, setEditingConnector] = useState<{
    connector: Connector;
    chargePoint: ChargePoint;
  } | null>(null);
  const [activatingCp, setActivatingCp] = useState<{ cp: ChargePoint; connectorCount: number } | null>(null);
  const [statusActionCp, setStatusActionCp] = useState<{ cp: ChargePoint; action: 'suspend' | 'reactivate' } | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<{
    type: 'chargePoint' | 'connector';
    chargePoint: ChargePoint;
    connector?: Connector;
  } | null>(null);
  const [historyTarget, setHistoryTarget] = useState<EquipmentStatusTarget | null>(null);

  // Fetch charge points for this specific station
  const { data: chargePoints, isLoading: isCpsLoading } = useQuery({
    queryKey: ['chargePoints', station.id],
    queryFn: () => api.chargePoints.list(station.id),
  });

  // Fetch all connectors for this station's charge points
  const { data: allConnectors } = useQuery({
    queryKey: ['connectors', station.id, (chargePoints ?? []).map((cp) => cp.id).join(',')],
    queryFn: async () => {
      const cps = chargePoints ?? [];
      if (cps.length === 0) return [];
      const results = await Promise.all(
        cps.map((cp) => api.connectors.list(cp.id, station.id).catch(() => [] as Connector[])),
      );
      return results.flat();
    },
    enabled: Boolean(chargePoints && chargePoints.length > 0),
  });

  const activateCp = useMutation({
    mutationFn: ({ id, expectedConnectorCount }: { id: string; expectedConnectorCount: number }) =>
      api.chargePoints.activate(id, station.id, expectedConnectorCount),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      setActivatingCp(null);
      toast(t('provisioning.activateSuccess', { id: cp.id }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const suspendCp = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.chargePoints.suspend(id, station.id, reason),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      setStatusActionCp(null);
      toast(t('provisioning.suspendSuccess', { id: cp.id }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const reactivateCp = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.chargePoints.reactivate(id, station.id, reason),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      setStatusActionCp(null);
      toast(t('provisioning.reactivateSuccess', { id: cp.id }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const deleteCp = useMutation({
    mutationFn: (id: string) => api.chargePoints.remove(id, station.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      qc.invalidateQueries({ queryKey: ['connectors'] });
      setDeletingTarget(null);
      toast(t('provisioning.draftDeleteSuccess'), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const deleteConnector = useMutation({
    mutationFn: ({ id, chargePointId }: { id: string; chargePointId: string }) =>
      api.connectors.remove(id, station.id, chargePointId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      qc.invalidateQueries({ queryKey: ['connectors'] });
      setDeletingTarget(null);
      toast(t('provisioning.draftConnectorDeleteSuccess'), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const cps = chargePoints ?? [];
  const connectors = allConnectors ?? [];

  const addressText =
    (station as AdminStationListItem).addressLine ||
    (station as Station).address ||
    (station as AdminStationListItem).provinceName ||
    '—';

  const ownerName =
    (station as AdminStationListItem).ownerDisplayName ||
    (station as Station).ownerName ||
    t('provisioning.workspace.ownerFallback');

  return (
    <div className="flex flex-col gap-4">
      {/* Top Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink transition cursor-pointer"
        >
          <IconArrowLeft size={15} strokeWidth={2.2} />
          <span>{t('provisioning.workspace.backToList')}</span>
        </button>

        {onManageLicense && (
          <Button size="sm" variant="secondary" onClick={onManageLicense} className="text-[12px]">
            {t('provisioning.workspace.viewLicense')}
          </Button>
        )}
      </div>

      {/* Station Header Workspace Card */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold text-ink">{station.name}</h2>
            <span className="font-mono text-[12px] font-bold text-brand">
              {station.stationCode || station.id}
            </span>
            <StatusPill tone="good" label={t('provisioning.workspace.fr14Badge')} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
            <span className="flex items-center gap-1">
              <IconPin size={13} className="text-faint" />
              {addressText}
            </span>
            <span>·</span>
            <span>{t('provisioning.workspace.ownerLabel')} <b className="text-ink">{ownerName}</b></span>
            <span>·</span>
            <span>
              {t('provisioning.workspace.plannedLabel')}{' '}
              <b className="text-ink font-mono">
                {t('provisioning.workspace.plannedCount', { count: station.plannedChargePointCount ?? 0 })}
              </b>
            </span>
          </div>
        </div>

        <Button
          icon={<IconPlusCircle size={15} strokeWidth={2} />}
          onClick={() => setCreatingCp(true)}
          className="px-4 cursor-pointer"
        >
          {t('provisioning.chargePoint.createBtn')}
        </Button>
      </Card>

      {/* FR14 Step flow guideline */}
      <Card className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 bg-surface-2 border-line-2">
        {[
          { step: 1, title: t('provisioning.workspace.steps.step1') },
          { step: 2, title: t('provisioning.workspace.steps.step2') },
          { step: 3, title: t('provisioning.workspace.steps.step3') },
        ].map((item, idx) => (
          <span key={item.step} className="flex items-center gap-2">
            {idx > 0 && <span className="text-[12px] text-disabled">→</span>}
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
              {item.step}
            </span>
            <span className="text-[11.5px] font-medium text-body">{item.title}</span>
          </span>
        ))}
      </Card>

      {/* Status Legend & Guideline Card */}
      <ProvisioningStatusLegend />

      {/* Charge Point List Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-[15px] font-bold text-ink">
            {t('provisioning.workspace.listTitle', {
              count: cps.length,
              planned: station.plannedChargePointCount ?? cps.length,
            })}
          </h3>
          <p className="text-[11.5px] text-muted">
            {t('provisioning.workspace.listSubtitle', {
              count: cps.length,
              planned: station.plannedChargePointCount ?? 0,
            })}
          </p>
        </div>
        <span className="text-[12px] text-muted font-medium">
          {t('provisioning.workspace.openForDrivers', {
            count: cps.filter((c) => c.provisioningStatus === 'ACTIVE' && c.operationalStatus === 'AVAILABLE').length,
          })}
        </span>
      </div>

      {isCpsLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full rounded-[10px]" />
          <Skeleton className="h-32 w-full rounded-[10px]" />
        </div>
      ) : cps.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title={t('provisioning.workspace.emptyTitle')}
            description={t('provisioning.workspace.emptyDescription')}
          />
          <div className="mt-4 flex justify-center">
            <Button
              icon={<IconPlusCircle size={15} strokeWidth={2} />}
              onClick={() => setCreatingCp(true)}
            >
              {t('provisioning.workspace.emptyCreateBtn')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {cps.map((cp) => {
            const cpConnectors = connectors.filter((c) => c.chargePointId === cp.id);
            return (
              <ChargePointItemCard
                key={cp.id}
                chargePoint={cp}
                connectors={cpConnectors}
                activating={activateCp.isPending}
                onAddConnector={() => setAddingToCp(cp)}
                onEditConnector={(connector) => setEditingConnector({ connector, chargePoint: cp })}
                onDeleteConnector={(connector) =>
                  setDeletingTarget({ type: 'connector', chargePoint: cp, connector })
                }
                onDeleteCp={() => setDeletingTarget({ type: 'chargePoint', chargePoint: cp })}
                onActivate={() => setActivatingCp({ cp, connectorCount: cpConnectors.length })}
                onSuspend={() => setStatusActionCp({ cp, action: 'suspend' })}
                onReactivate={() => setStatusActionCp({ cp, action: 'reactivate' })}
                onViewCpHistory={() =>
                  setHistoryTarget({
                    type: 'chargePoint',
                    chargePointId: cp.id,
                    chargePointName: cp.name,
                    chargePointCode: cp.chargePointCode,
                  })
                }
                onViewConnectorHistory={(connector) =>
                  setHistoryTarget({
                    type: 'connector',
                    chargePointId: cp.id,
                    chargePointName: cp.name,
                    connectorId: connector.id,
                    connectorCode: connector.connectorCode,
                  })
                }
              />
            );
          })}
        </div>
      )}

      {/* Drawer: Equipment Status History Timeline */}
      <EquipmentStatusHistoryDrawer
        open={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        stationId={station.id}
        target={historyTarget}
      />

      {/* Modal: Create Charge Point */}
      {creatingCp && (
        <CreateChargePointModal
          stationId={station.id}
          stationName={station.name}
          onClose={() => setCreatingCp(false)}
        />
      )}

      {/* Modal: Add Connector */}
      {addingToCp && (
        <AddConnectorModal
          stationId={station.id}
          chargePoint={addingToCp}
          onClose={() => setAddingToCp(null)}
        />
      )}

      {/* Modal: Edit Connector (When CP is PENDING_ACTIVATION) */}
      {editingConnector && (
        <EditConnectorModal
          stationId={station.id}
          chargePoint={editingConnector.chargePoint}
          connector={editingConnector.connector}
          onClose={() => setEditingConnector(null)}
        />
      )}

      {/* Modal: Confirm Delete Charge Point or Connector Draft */}
      {deletingTarget && (
        <ConfirmDeleteModal
          open
          type={deletingTarget.type}
          chargePoint={deletingTarget.chargePoint}
          connector={deletingTarget.connector}
          isSubmitting={deleteCp.isPending || deleteConnector.isPending}
          onConfirm={() => {
            if (deletingTarget.type === 'chargePoint') {
              deleteCp.mutate(deletingTarget.chargePoint.id);
            } else if (deletingTarget.connector) {
              deleteConnector.mutate({
                id: deletingTarget.connector.id,
                chargePointId: deletingTarget.chargePoint.id,
              });
            }
          }}
          onClose={() => setDeletingTarget(null)}
        />
      )}

      {/* Modal: Confirm and seal Connector inventory before activation */}
      {activatingCp && (
        <ActivateChargePointModal
          chargePoint={activatingCp.cp}
          actualConnectorCount={activatingCp.connectorCount}
          isSubmitting={activateCp.isPending}
          onSubmit={(expectedConnectorCount) =>
            activateCp.mutate({ id: activatingCp.cp.id, expectedConnectorCount })
          }
          onClose={() => setActivatingCp(null)}
        />
      )}

      {/* Modal: Suspend or Reactivate Charge Point */}
      {statusActionCp && (
        <SuspendReactivateChargePointModal
          chargePoint={statusActionCp.cp}
          action={statusActionCp.action}
          isSubmitting={suspendCp.isPending || reactivateCp.isPending}
          onSubmit={(reason) => {
            if (statusActionCp.action === 'suspend') {
              suspendCp.mutate({ id: statusActionCp.cp.id, reason });
            } else {
              reactivateCp.mutate({ id: statusActionCp.cp.id, reason });
            }
          }}
          onClose={() => setStatusActionCp(null)}
        />
      )}
    </div>
  );
}
