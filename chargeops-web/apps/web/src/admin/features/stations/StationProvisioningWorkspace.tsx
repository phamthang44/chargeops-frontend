import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  type AdminStationDetail,
  type AdminStationListItem,
  type ChargePoint,
  type Connector,
  type ConnectorType,
  type Station,
} from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  IconAlertTriangle,
  IconArrowLeft,
  IconBolt,
  IconCheck,
  IconEdit,
  IconHistory,
  IconLock,
  IconPause,
  IconPin,
  IconPlay,
  IconPlusCircle,
  IconTrash,
  Modal,
  Select,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../../i18n';
import {
  EquipmentStatusHistoryDrawer,
  type EquipmentStatusTarget,
} from '../../../shared/equipment/EquipmentStatusHistoryDrawer';

const CONNECTORS = [
  { value: 'CCS2', label: 'CCS2 (DC Fast Charging)' },
  { value: 'CHADEMO', label: 'CHAdeMO (DC)' },
  { value: 'TYPE2', label: 'Type 2 AC (Standard)' },
  { value: 'GBT', label: 'GB/T (China Standard)' },
];

const POWERS = [11, 22, 50, 60, 120, 150, 180, 240, 360].map((p) => ({
  value: String(p),
  label: `${p} kW`,
}));

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
      toast(t('provisioning.activateSuccess', { id: cp.id, defaultValue: `Trụ ${cp.id} đã kích hoạt thành công.` }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const suspendCp = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.chargePoints.suspend(id, station.id, reason),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      setStatusActionCp(null);
      toast(t('provisioning.suspendSuccess', { id: cp.id, defaultValue: `Trụ ${cp.id} đã tạm ngưng thành công.` }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const reactivateCp = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.chargePoints.reactivate(id, station.id, reason),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      setStatusActionCp(null);
      toast(t('provisioning.reactivateSuccess', { id: cp.id, defaultValue: `Trụ ${cp.id} đã được kích hoạt lại.` }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const deleteCp = useMutation({
    mutationFn: (id: string) => api.chargePoints.remove(id, station.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      qc.invalidateQueries({ queryKey: ['connectors'] });
      setDeletingTarget(null);
      toast('Đã xóa bản nháp Trụ sạc và các Súng bên trong.', 'success');
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
      toast('Đã xóa Súng sạc bản nháp.', 'success');
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
    'Chủ trạm';

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
          <span>Quay lại danh sách trạm sạc</span>
        </button>

        {onManageLicense && (
          <Button size="sm" variant="secondary" onClick={onManageLicense} className="text-[12px]">
            Xem giấy phép License ↗
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
            <StatusPill tone="good" label="Không gian Cấp trụ (FR14)" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
            <span className="flex items-center gap-1">
              <IconPin size={13} className="text-faint" />
              {addressText}
            </span>
            <span>·</span>
            <span>Chủ trạm: <b className="text-ink">{ownerName}</b></span>
            <span>·</span>
            <span>Quy hoạch duyệt: <b className="text-ink font-mono">{station.plannedChargePointCount ?? 0} Trụ</b></span>
          </div>
        </div>

        <Button
          icon={<IconPlusCircle size={15} strokeWidth={2} />}
          onClick={() => setCreatingCp(true)}
          className="px-4 cursor-pointer"
        >
          {t('provisioning.chargePoint.createBtn', 'Thêm Trụ sạc mới')}
        </Button>
      </Card>

      {/* FR14 Step flow guideline */}
      <Card className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 bg-surface-2 border-line-2">
        {[
          { step: 1, title: '1. Tạo Trụ kèm sẵn Súng sạc' },
          { step: 2, title: '2. Rà soát / sửa cấu hình bản nháp' },
          { step: 3, title: '3. Kích hoạt và khóa phần cứng' },
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

      {/* Charge Point List Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-[15px] font-bold text-ink">
            Danh mục Trụ sạc đã cấp ({cps.length}/{station.plannedChargePointCount ?? cps.length} Trụ quy hoạch)
          </h3>
          <p className="text-[11.5px] text-muted">
            Đã cấp {cps.length} trụ thực tế trên tổng số {station.plannedChargePointCount ?? 0} trụ được duyệt quy hoạch
          </p>
        </div>
        <span className="text-[12px] text-muted font-medium">
          {cps.filter((c) => c.provisioningStatus === 'ACTIVE' && c.operationalStatus === 'AVAILABLE').length} trụ đang mở cho tài xế
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
            title="Trạm sạc này chưa có trụ nào"
            description="Bắt đầu cấp hạ tầng bằng cách tạo mã Trụ sạc đầu tiên cho trạm."
          />
          <div className="mt-4 flex justify-center">
            <Button
              icon={<IconPlusCircle size={15} strokeWidth={2} />}
              onClick={() => setCreatingCp(true)}
            >
              Tạo Trụ sạc ngay
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

function ChargePointItemCard({
  chargePoint: cp,
  connectors,
  activating,
  onAddConnector,
  onEditConnector,
  onDeleteConnector,
  onDeleteCp,
  onActivate,
  onSuspend,
  onReactivate,
  onViewCpHistory,
  onViewConnectorHistory,
}: {
  chargePoint: ChargePoint;
  connectors: Connector[];
  activating: boolean;
  onAddConnector: () => void;
  onEditConnector: (connector: Connector) => void;
  onDeleteConnector: (connector: Connector) => void;
  onDeleteCp: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onViewCpHistory: () => void;
  onViewConnectorHistory: (connector: Connector) => void;
}) {
  const { t } = useTranslation('admin');
  const provStatus = String(cp.provisioningStatus || '').toUpperCase();
  const operStatus = String(cp.operationalStatus || 'AVAILABLE').toUpperCase();

  const isPendingActivation =
    provStatus === 'PENDING_ACTIVATION' || provStatus === 'UNCLAIMED' || provStatus === 'PENDING';
  const isActive = provStatus === 'ACTIVE';
  const isSuspended = provStatus === 'SUSPENDED';

  const canActivate = isPendingActivation && connectors.length > 0;

  return (
    <Card
      className={`overflow-hidden border transition duration-150 ${
        isSuspended
          ? 'border-warn/40 bg-surface shadow-sm ring-1 ring-warn/10'
          : isPendingActivation
          ? 'border-brand/30 bg-surface shadow-sm'
          : 'border-line-2 bg-surface shadow-sm'
      }`}
    >
      {/* Top Header of CP */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 bg-surface border-b border-hairline">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
              isSuspended
                ? 'bg-warn-soft text-warn-deep'
                : isPendingActivation
                ? 'bg-brand-soft text-brand'
                : 'bg-good-soft text-good'
            }`}
          >
            <IconBolt size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[15px] text-ink">{cp.name || 'Trụ sạc'}</span>
              <span className="font-mono text-[12px] font-bold text-brand">{cp.chargePointCode || cp.id}</span>
              {cp.zoneLabel && (
                <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-faint border border-line-2">
                  <IconPin size={11} className="inline mr-1 text-faint" />
                  {cp.zoneLabel}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
              <span>
                Công suất tối đa: <b className="text-ink font-mono">{cp.maxPowerKw} kW</b>
              </span>
              <span>·</span>
              <span>
                Số súng sạc: <b className="text-ink">{connectors.length} Súng</b>
              </span>
              {isPendingActivation && (
                <span className="text-[11px] font-semibold text-brand bg-brand-soft/40 px-1.5 py-0.2 rounded">
                  ⚙️ Đang cấu hình phần cứng
                </span>
              )}
              {isActive && (
                <span className="text-[11px] text-faint flex items-center gap-1">
                  <IconLock size={11} />
                  Phần cứng đã khóa
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Provisioning Status Pill */}
          {isPendingActivation && <StatusPill tone="neutral" label="Chờ kích hoạt" />}
          {isActive && <StatusPill tone="good" label="Đang hoạt động" />}
          {isSuspended && <StatusPill tone="warn" label="Tạm ngưng vận hành" />}

          {/* Operational Status Pill if Active ONLY */}
          {isActive && (
            <StatusPill
              tone={operStatus === 'AVAILABLE' ? 'good' : operStatus === 'MAINTENANCE' ? 'warn' : 'bad'}
              label={operStatus === 'AVAILABLE' ? 'Sẵn sàng' : operStatus === 'MAINTENANCE' ? 'Bảo trì' : 'Ngoại tuyến'}
            />
          )}
        </div>
      </div>

      {/* Connector List */}
      <div className="bg-surface-2 p-3.5">
        {connectors.length === 0 ? (
          <div className="flex items-start gap-2.5 rounded-[9px] border border-warn-border bg-warn-soft p-3.5 text-[12px] text-warn-deep leading-relaxed">
            <IconLock size={16} className="mt-0.5 shrink-0" />
            <span>
              Trụ sạc này chưa có súng sạc nào. Vui lòng nhấn nút <b>"Thêm súng sạc"</b> bên dưới để thiết lập chuẩn kết nối và công suất trước khi kích hoạt mở cho tài xế.
            </span>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {connectors.map((c) => {
              const runStatus = String(c.runtimeStatus || 'AVAILABLE').toUpperCase();
              let connTone: 'good' | 'brand' | 'bad' | 'neutral' = 'good';
              let connLabel = 'Sẵn sàng';

              if (isPendingActivation) {
                connTone = 'neutral';
                connLabel = 'Chưa mở sạc';
              } else if (isSuspended) {
                connTone = 'neutral';
                connLabel = 'Tạm dừng theo trụ';
              } else {
                if (runStatus === 'IN_USE' || runStatus === 'INUSE') {
                  connTone = 'brand';
                  connLabel = 'Đang sạc';
                } else if (runStatus === 'OFFLINE') {
                  connTone = 'bad';
                  connLabel = 'Ngoại tuyến';
                }
              }

              const isAc = c.connectorType === 'TYPE2';

              return (
                <div
                  key={c.id}
                  className="group relative flex flex-col justify-between gap-2.5 rounded-[10px] border border-line-2 bg-surface p-3.5 shadow-sm transition hover:border-brand/40 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border ${
                          isAc
                            ? 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                            : 'border-brand/30 bg-brand-soft text-brand'
                        }`}
                      >
                        <IconBolt size={18} />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[12px] font-bold text-ink">
                            {c.connectorCode || c.id}
                          </span>
                          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-bold text-body border border-line-2">
                            {c.connectorType}
                          </span>
                          <span className="text-[10px] font-medium text-faint">
                            ({isAc ? 'AC Tiêu chuẩn' : 'DC Sạc nhanh'})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[12px]">
                          <span className="font-mono font-bold text-brand">{c.powerKw} kW</span>
                        </div>
                      </div>
                    </div>

                    <StatusPill tone={connTone} label={connLabel} />
                  </div>

                  <div className="flex items-center justify-between border-t border-hairline pt-2.5 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/simulator?connectorId=${c.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-[6px] border border-line-2 bg-surface-2 px-2 py-1 text-[11px] font-semibold text-muted hover:border-brand hover:text-brand transition cursor-pointer"
                        title="Mở màn hình giả lập Dynamic QR cho súng sạc này"
                      >
                        ⚡ Simulator ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => onViewConnectorHistory(c)}
                        className="inline-flex items-center gap-1 rounded-[6px] border border-line-2 bg-surface-2 px-2 py-1 text-[11px] font-semibold text-muted hover:border-brand hover:text-brand transition cursor-pointer"
                        title="Xem lịch sử thay đổi trạng thái súng sạc"
                      >
                        <IconHistory size={12} strokeWidth={2} />
                        <span>Lịch sử</span>
                      </button>
                    </div>

                    {isPendingActivation ? (
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditConnector(c)}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-brand/30 bg-brand-soft/50 px-2.5 py-1 text-[11px] font-semibold text-brand hover:bg-brand hover:text-white transition cursor-pointer"
                          title="Chỉnh sửa chuẩn kết nối và công suất trước khi kích hoạt"
                        >
                          <IconEdit size={12} strokeWidth={2.2} />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteConnector(c)}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-bad/30 bg-bad-soft/40 px-2.5 py-1 text-[11px] font-semibold text-bad hover:bg-bad hover:text-white transition cursor-pointer"
                          title="Xóa súng sạc bản nháp"
                        >
                          <IconTrash size={12} strokeWidth={2.2} />
                          <span>Xóa</span>
                        </button>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-faint bg-surface-2 px-2 py-0.5 rounded border border-line-2"
                        title="Sau khi trụ kích hoạt ACTIVE, cấu hình phần cứng súng sạc được cố định"
                      >
                        <IconLock size={11} />
                        <span>Cố định phần cứng</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 bg-surface">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<IconHistory size={13} strokeWidth={2} />}
            onClick={onViewCpHistory}
            className="text-[12px] cursor-pointer"
            title="Xem toàn bộ lịch sử trạng thái của trụ sạc"
          >
            Lịch sử trụ
          </Button>

          {isPendingActivation && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<IconPlusCircle size={14} strokeWidth={2} />}
                onClick={onAddConnector}
                className="text-[12px] cursor-pointer"
              >
                {t('provisioning.connector.addBtn', 'Thêm súng sạc')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<IconTrash size={13} strokeWidth={2.2} />}
                onClick={onDeleteCp}
                className="cursor-pointer"
              >
                Xóa bản nháp trụ
              </Button>
            </>
          )}

          {isActive && (
            <Button
              variant="danger"
              size="sm"
              icon={<IconPause size={13} strokeWidth={2.2} />}
              onClick={onSuspend}
              className="text-[12px] cursor-pointer bg-red-600/90 hover:bg-red-700 text-white shadow-sm"
            >
              Tạm ngưng trụ sạc
            </Button>
          )}

          {isSuspended && (
            <Button
              variant="secondary"
              size="sm"
              icon={<IconPlay size={13} strokeWidth={2.2} />}
              onClick={onReactivate}
              className="text-[12px] font-bold text-good border-good/40 bg-good-soft/30 hover:bg-good hover:text-white transition cursor-pointer shadow-sm"
            >
              Mở lại hoạt động
            </Button>
          )}
        </div>

        {canActivate && (
          <Button
            size="sm"
            icon={<IconCheck size={14} strokeWidth={2.4} />}
            onClick={onActivate}
            disabled={activating}
            className="text-[12.5px] font-bold px-3.5 cursor-pointer shadow-sm"
          >
            {activating
              ? t('provisioning.chargePoint.activating', 'Đang kích hoạt...')
              : t('provisioning.chargePoint.activateBtn', 'Kích hoạt mở trụ')}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function ActivateChargePointModal({
  chargePoint,
  actualConnectorCount,
  isSubmitting,
  onSubmit,
  onClose,
}: {
  chargePoint: ChargePoint;
  actualConnectorCount: number;
  isSubmitting: boolean;
  onSubmit: (expectedConnectorCount: number) => void;
  onClose: () => void;
}) {
  const [expectedCount, setExpectedCount] = useState('');
  const parsedCount = Number(expectedCount);
  const isPositiveInteger = Number.isInteger(parsedCount) && parsedCount >= 1;
  const countMatches = isPositiveInteger && parsedCount === actualConnectorCount;

  return (
    <Modal open onClose={onClose} maxWidth={480}>
      <div className="flex flex-col gap-4 text-[13px] text-body">
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">Xác nhận cấu hình trước khi kích hoạt</h3>
          <p className="mt-0.5 text-[12px] text-muted">
            Trụ: <b className="text-ink">{chargePoint.name || chargePoint.chargePointCode || chargePoint.id}</b>
          </p>
        </div>

        <div className="rounded-xl border border-warn-border bg-warn-soft p-3.5 text-xs leading-relaxed text-warn-deep">
          Sau khi kích hoạt, cấu hình phần cứng súng sạc sẽ được <b>khóa cố định</b> (Hardware Immutable) để đảm bảo an toàn vận hành và tương thích hệ thống đặt lịch. Hệ thống hiện ghi nhận <b>{actualConnectorCount} súng sạc</b>.
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase text-faint">
            Nhập tổng số súng sạc đã lắp đặt *
          </label>
          <input
            autoFocus
            type="number"
            min={1}
            step={1}
            value={expectedCount}
            onChange={(event) => setExpectedCount(event.target.value)}
            placeholder={`Nhập ${actualConnectorCount} để xác nhận`}
            className="w-full rounded-xl border border-line-2 bg-surface p-3 text-xs text-ink placeholder:text-faint focus:border-brand focus:outline-none"
          />
          {isPositiveInteger && !countMatches && (
            <p className="mt-1.5 text-xs text-bad font-medium">
              Số xác nhận phải khớp đúng {actualConnectorCount} súng sạc đang có.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            size="sm"
            disabled={!countMatches || isSubmitting}
            onClick={() => onSubmit(parsedCount)}
          >
            {isSubmitting ? 'Đang kích hoạt...' : 'Xác nhận và kích hoạt'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SuspendReactivateChargePointModal({
  chargePoint,
  action,
  isSubmitting,
  onSubmit,
  onClose,
}: {
  chargePoint: ChargePoint;
  action: 'suspend' | 'reactivate';
  isSubmitting: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const isSuspend = action === 'suspend';

  return (
    <Modal open onClose={onClose} maxWidth={500}>
      <div className="flex flex-col gap-4 text-[13px] text-body">
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">
            {isSuspend ? 'Tạm ngưng hoạt động Trụ sạc' : 'Mở lại hoạt động Trụ sạc'}
          </h3>
          <p className="text-[12px] text-muted mt-0.5">
            Trụ: <b className="text-ink">{chargePoint.name || chargePoint.chargePointCode || chargePoint.id}</b>
          </p>
        </div>

        <div
          className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs leading-relaxed ${
            isSuspend ? 'border-warn-border bg-warn-soft text-warn-deep' : 'border-good/30 bg-good-soft/30 text-ink'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {isSuspend ? <IconAlertTriangle size={18} /> : <IconBolt size={18} className="text-good" />}
          </div>
          <div>
            {isSuspend ? (
              <span>
                Khi tạm ngưng trụ <b>{chargePoint.name || chargePoint.chargePointCode || chargePoint.id}</b>, tất cả các súng sạc thuộc trụ này sẽ tạm dừng tiếp nhận lượt sạc mới và cập nhật trạng thái trên app tài xế.
              </span>
            ) : (
              <span>
                Xác nhận mở lại trụ <b>{chargePoint.name || chargePoint.chargePointCode || chargePoint.id}</b> để tiếp tục phục vụ người dùng và nhận đặt lịch sạc.
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-faint mb-1.5">
            Lý do {isSuspend ? 'tạm ngưng' : 'mở lại'} *
          </label>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={
              isSuspend
                ? 'Nhập lý do tạm ngưng (vd: Bảo trì định kỳ, sự cố nguồn điện, thay thế linh kiện...)'
                : 'Nhập lý do mở lại (vd: Đã kiểm tra an toàn điện và sẵn sàng phục vụ...)'
            }
            className="w-full rounded-xl border border-line-2 bg-surface p-3 text-xs text-ink placeholder:text-faint focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            variant={isSuspend ? 'danger' : 'primary'}
            size="sm"
            disabled={!reason.trim() || isSubmitting}
            onClick={() => onSubmit(reason.trim())}
          >
            {isSubmitting ? 'Đang xử lý...' : isSuspend ? 'Xác nhận tạm ngưng' : 'Xác nhận mở lại'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CreateChargePointModal({
  stationId,
  stationName,
  onClose,
}: {
  stationId: string;
  stationName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [zoneLabel, setZoneLabel] = useState('');
  const [connectorType, setConnectorType] = useState<ConnectorType>('CCS2');
  const [powerKw, setPowerKw] = useState(120);
  const [quantity, setQuantity] = useState(2);

  const create = useMutation({
    mutationFn: () =>
      api.chargePoints.provision({
        stationId,
        name: name.trim() || undefined,
        zoneLabel: zoneLabel.trim() || undefined,
        connectorGroups: [{ connectorType, powerKw, quantity }],
      }),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('provisioning.chargePoint.toastSuccess', { id: cp.id, defaultValue: `Tạo trụ ${cp.id} thành công` }), 'success');
      onClose();
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  return (
    <Modal open onClose={onClose} maxWidth={480}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="flex flex-col gap-4 text-[13px] text-body"
      >
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">Khởi tạo Trụ sạc mới</h3>
          <p className="text-[12px] text-muted mt-0.5">Trạm: <b className="text-ink">{stationName}</b></p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              Tên / Ký hiệu vị trí (không bắt buộc)
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Trụ A, Khu B, Tầng hầm 1"
              className="w-full rounded-[8px] border border-line-2 bg-surface p-2.5 text-[12.5px] text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              Vị trí / Zone gợi ý cho tài xế
            </label>
            <input
              value={zoneLabel}
              onChange={(e) => setZoneLabel(e.target.value)}
              placeholder="Ví dụ: Cạnh cổng bảo vệ, Tầng hầm B1 khu A"
              className="w-full rounded-[8px] border border-line-2 bg-surface p-2.5 text-[12.5px] text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">Chuẩn sạc</label>
              <Select value={connectorType} onChange={(value) => setConnectorType(value as ConnectorType)} options={CONNECTORS} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">Công suất mỗi súng</label>
              <Select value={String(powerKw)} onChange={(value) => setPowerKw(Number(value))} options={POWERS} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">Số lượng súng</label>
              <input type="number" min={1} max={8} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required className="w-full rounded-[8px] border border-line-2 bg-surface p-2.5 text-[12.5px] text-ink focus:border-brand focus:outline-none" />
            </div>
          </div>

          <div className="rounded-[8px] bg-surface-2 p-3 text-[11.5px] text-muted border border-line-2">
            Trụ và toàn bộ Súng sạc được tạo cùng một giao dịch. Mã CP và C-01… được hệ thống cấp tự động; công suất trụ được suy ra từ Súng mạnh nhất.
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2.5 border-t border-hairline pt-3">
          <Button variant="secondary" type="button" onClick={onClose} disabled={create.isPending}>
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Đang tạo...' : 'Xác nhận tạo trụ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddConnectorModal({
  stationId,
  chargePoint,
  onClose,
}: {
  stationId?: string;
  chargePoint: ChargePoint;
  onClose: () => void;
}) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [connectorCode, setConnectorCode] = useState('C-01');
  const [connectorType, setConnectorType] = useState<ConnectorType>('CCS2');
  const [powerKw, setPowerKw] = useState(60);

  const create = useMutation({
    mutationFn: () =>
      api.connectors.provision({
        stationId: stationId || chargePoint.stationId,
        chargePointId: chargePoint.id,
        connectorCode: connectorCode.trim() || 'C-01',
        connectorType,
        powerKw,
      }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['connectors'] });
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('provisioning.connector.toastSuccess', { id: c.connectorCode || c.id, defaultValue: `Thêm súng ${c.connectorCode || c.id} thành công` }), 'success');
      onClose();
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  return (
    <Modal open onClose={onClose} maxWidth={480}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="flex flex-col gap-4 text-[13px] text-body"
      >
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">Thêm Súng sạc vào Trụ</h3>
          <p className="text-[12px] text-muted mt-0.5">
            Trụ: <b className="font-mono text-brand">{chargePoint.chargePointCode || chargePoint.id}</b> ({chargePoint.name})
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              Mã súng sạc (Connector Code) *
            </label>
            <input
              autoFocus
              value={connectorCode}
              onChange={(e) => setConnectorCode(e.target.value)}
              placeholder="Ví dụ: C-01, C-02"
              required
              className="w-full rounded-[8px] border border-line-2 bg-surface p-2.5 text-[12.5px] font-mono text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              Loại chuẩn kết nối súng *
            </label>
            <Select
              value={connectorType}
              onChange={(val) => setConnectorType(val as ConnectorType)}
              options={CONNECTORS}
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">
                Công suất sạc (kW) *
              </label>
              <Select
                value={String(powerKw)}
                onChange={(val) => setPowerKw(Number(val))}
                options={POWERS}
              />
            </div>
          </div>

          <div className="rounded-[8px] bg-surface-2 p-3 text-[11.5px] text-muted border border-line-2">
            Hệ thống tự động liên kết <b>Dynamic QR Check-in</b> cho súng sạc này khi tài xế cắm sạc thực tế.
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2.5 border-t border-hairline pt-3">
          <Button variant="secondary" type="button" onClick={onClose} disabled={create.isPending}>
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Đang thêm...' : 'Xác nhận thêm súng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditConnectorModal({
  stationId,
  chargePoint,
  connector,
  onClose,
}: {
  stationId?: string;
  chargePoint: ChargePoint;
  connector: Connector;
  onClose: () => void;
}) {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const [connectorType, setConnectorType] = useState<ConnectorType>(
    (connector.connectorType as ConnectorType) || 'CCS2'
  );
  const [powerKw, setPowerKw] = useState<number>(Number(connector.powerKw) || 60);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.connectors.update(connector.id, {
        stationId: stationId || chargePoint.stationId,
        chargePointId: chargePoint.id,
        connectorType,
        powerKw,
      }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['connectors'] });
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(`Cập nhật súng ${updated.connectorCode || updated.id} thành công`, 'success');
      onClose();
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  return (
    <Modal open onClose={onClose} maxWidth={480}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate();
        }}
        className="flex flex-col gap-4 text-[13px] text-body"
      >
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">Chỉnh sửa thông số Súng sạc</h3>
          <p className="text-[12px] text-muted mt-0.5">
            Mã súng: <b className="font-mono text-brand">{connector.connectorCode || connector.id}</b> · Trụ: <b>{chargePoint.name}</b>
          </p>
        </div>

        <div className="rounded-[8px] border border-brand/30 bg-brand-soft/20 p-3 text-[11.5px] leading-relaxed text-brand-strong">
          ⚙️ Trụ sạc đang ở trạng thái <b>Chờ kích hoạt (PENDING_ACTIVATION)</b>. Admin có thể tùy chỉnh chuẩn sạc và công suất định mức trước khi kích hoạt khóa phần cứng.
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              Loại chuẩn kết nối súng *
            </label>
            <Select
              value={connectorType}
              onChange={(val) => setConnectorType(val as ConnectorType)}
              options={CONNECTORS}
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">
                Công suất sạc (kW) *
              </label>
              <Select
                value={String(powerKw)}
                onChange={(val) => setPowerKw(Number(val))}
                options={POWERS}
              />
            </div>
          </div>

        </div>

        <div className="mt-2 flex justify-end gap-2.5 border-t border-hairline pt-3">
          <Button variant="secondary" type="button" onClick={onClose} disabled={updateMutation.isPending}>
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmDeleteModal({
  open,
  type,
  chargePoint,
  connector,
  isSubmitting,
  onConfirm,
  onClose,
}: {
  open: boolean;
  type: 'chargePoint' | 'connector';
  chargePoint: ChargePoint;
  connector?: Connector;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isCp = type === 'chargePoint';
  const title = isCp ? 'Xóa bản nháp Trụ sạc' : 'Xóa bản nháp Súng sạc';
  const cpName = chargePoint.name || chargePoint.chargePointCode || chargePoint.id;
  const connCode = connector?.connectorCode || connector?.id || 'Súng sạc';

  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <div className="flex flex-col gap-4 text-[13px] text-body">
        <div className="border-b border-hairline pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bad-soft text-bad">
              <IconTrash size={15} />
            </span>
            <h3 className="text-[16px] font-bold text-ink">{title}</h3>
          </div>
          <p className="text-[12px] text-muted mt-1">
            {isCp ? (
              <>
                Trụ sạc: <b className="font-mono text-ink">{cpName}</b>
              </>
            ) : (
              <>
                Mã súng: <b className="font-mono text-brand">{connCode}</b> · Trụ: <b className="text-ink">{cpName}</b>
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-[10px] border border-bad/20 bg-bad-soft/30 p-3.5 text-xs leading-relaxed text-bad-deep">
          <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-bad" />
          <div>
            {isCp ? (
              <span>
                Bạn đang thực hiện xóa trụ sạc <b>{cpName}</b> và <b>toàn bộ súng sạc bên trong</b> khỏi cấu hình nháp của trạm. Hành động này không thể hoàn tác.
              </span>
            ) : (
              <span>
                Súng sạc <b>{connCode}</b> ({connector?.connectorType} · {connector?.powerKw} kW) sẽ bị xóa vĩnh viễn khỏi trụ sạc <b>{cpName}</b>.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-hairline pt-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <IconTrash size={13} strokeWidth={2.2} />
            <span>{isSubmitting ? 'Đang xóa...' : isCp ? 'Xác nhận xóa trụ' : 'Xác nhận xóa súng'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
