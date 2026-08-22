import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CHARGE_POINT_STATUS,
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
  IconArrowLeft,
  IconBolt,
  IconCheck,
  IconLock,
  IconPin,
  IconPlusCircle,
  Modal,
  Select,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../../i18n';

const CONNECTORS = [
  { value: 'CCS2', label: 'CCS2 (DC Fast Charging)' },
  { value: 'CHADEMO', label: 'CHAdeMO (DC)' },
  { value: 'TYPE2', label: 'Type 2 AC (Standard)' },
  { value: 'GBT', label: 'GB/T (China Standard)' },
];

const POWERS = [11, 22, 50, 60, 120, 150, 180, 240].map((p) => ({
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
  const [statusActionCp, setStatusActionCp] = useState<{ cp: ChargePoint; action: 'suspend' | 'reactivate' } | null>(null);

  // Fetch charge points for this specific station
  const { data: chargePoints, isLoading: isCpsLoading } = useQuery({
    queryKey: ['chargePoints', station.id],
    queryFn: () => api.chargePoints.list(station.id),
  });

  // Fetch all connectors for this station's charge points
  const { data: allConnectors, isLoading: isConnLoading } = useQuery({
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
    mutationFn: (id: string) => api.chargePoints.activate(id, station.id),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
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
          { step: 1, title: '1. Khởi tạo mã Trụ sạc' },
          { step: 2, title: '2. Thêm Súng sạc & Cấu hình kW' },
          { step: 3, title: '3. Kích hoạt trụ mở cho tài xế (Dynamic QR)' },
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

      {/* Charge Point List Section */}
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
        <div className="flex flex-col gap-3.5">
          {cps.map((cp) => {
            const cpConnectors = connectors.filter((c) => c.chargePointId === cp.id);
            return (
              <ChargePointItemCard
                key={cp.id}
                chargePoint={cp}
                connectors={cpConnectors}
                activating={activateCp.isPending}
                onAddConnector={() => setAddingToCp(cp)}
                onActivate={() => activateCp.mutate(cp.id)}
                onSuspend={() => setStatusActionCp({ cp, action: 'suspend' })}
                onReactivate={() => setStatusActionCp({ cp, action: 'reactivate' })}
              />
            );
          })}
        </div>
      )}

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
  onActivate,
  onSuspend,
  onReactivate,
}: {
  chargePoint: ChargePoint;
  connectors: Connector[];
  activating: boolean;
  onAddConnector: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  const { t } = useTranslation('admin');
  const provStatus = String(cp.provisioningStatus || '').toUpperCase();
  const operStatus = String(cp.operationalStatus || 'AVAILABLE').toUpperCase();

  const isPendingActivation = provStatus === 'PENDING_ACTIVATION' || provStatus === 'UNCLAIMED' || provStatus === 'PENDING';
  const isActive = provStatus === 'ACTIVE';
  const isSuspended = provStatus === 'SUSPENDED';

  const canActivate = isPendingActivation && connectors.length > 0;

  return (
    <Card className="overflow-hidden border-line-2 bg-surface">
      {/* Top Header of CP */}
      <div className="flex items-start justify-between gap-3 px-4 py-3.5 bg-surface">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft">
            <IconBolt size={18} className="text-brand" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14.5px] font-bold text-ink">{cp.name || 'Trụ sạc'}</span>
              <span className="font-mono text-[11.5px] font-bold text-brand">{cp.chargePointCode || cp.id}</span>
              {cp.zoneLabel && (
                <span className="rounded bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-faint border border-line-2">
                  <IconPin size={10} className="inline mr-1" />
                  {cp.zoneLabel}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-[12px] text-muted">
              <span>Công suất tối đa: <b className="text-ink font-mono">{cp.maxPowerKw} kW</b></span>
              <span>·</span>
              <span>Số súng sạc: <b className="text-ink">{connectors.length} Súng</b></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Provisioning Status Pill */}
          {isPendingActivation && <StatusPill tone="neutral" label="Chờ kích hoạt" />}
          {isActive && <StatusPill tone="good" label="Đã kích hoạt (Active)" />}
          {isSuspended && <StatusPill tone="bad" label="Tạm ngưng (Suspended)" />}

          {/* Operational Status Pill if Active */}
          {isActive && (
            <StatusPill
              tone={operStatus === 'AVAILABLE' ? 'good' : 'warn'}
              label={operStatus === 'AVAILABLE' ? 'Vận hành: Sẵn sàng' : 'Vận hành: Ngoại tuyến'}
            />
          )}
        </div>
      </div>

      {/* Connector List */}
      <div className="border-t border-hairline bg-surface-2 p-3.5">
        {connectors.length === 0 ? (
          <div className="flex items-start gap-2.5 rounded-[8px] border border-warn-border bg-warn-soft p-3 text-[12px] text-warn-deep">
            <IconLock size={15} className="mt-0.5 shrink-0" />
            <span>Trụ này chưa có súng sạc nào. Vui lòng thêm ít nhất 1 súng sạc trước khi kích hoạt mở cho tài xế.</span>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {connectors.map((c) => {
              const runStatus = String(c.runtimeStatus || 'AVAILABLE').toUpperCase();
              let connTone: 'good' | 'brand' | 'bad' = 'good';
              let connLabel = 'Sẵn sàng';
              if (runStatus === 'IN_USE' || runStatus === 'INUSE') {
                connTone = 'brand';
                connLabel = 'Đang sạc';
              } else if (runStatus === 'OFFLINE') {
                connTone = 'bad';
                connLabel = 'Offline';
              }

              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2.5 rounded-[9px] border border-line-2 bg-surface p-3 transition hover:border-brand/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-line-2 bg-surface-2">
                      <IconBolt size={16} className="text-brand" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11.5px] font-bold text-brand">{c.connectorCode || c.id}</span>
                        <span className="rounded bg-chip px-1.5 py-0.2 text-[10px] font-bold text-body">
                          {c.connectorType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11.5px] text-muted font-mono">{c.powerKw} kW</span>
                        <span className="text-hairline">·</span>
                        <StatusPill tone={connTone} label={connLabel} />
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/simulator?connectorId=${c.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-[7px] border border-line-2 bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-ink hover:border-brand hover:text-brand transition cursor-pointer"
                    title="Mở màn hình giả lập Dynamic QR cho súng sạc này"
                  >
                    ⚡ Simulator
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-2.5 bg-surface">
        <div className="flex items-center gap-2">
          {isPendingActivation && (
            <Button
              variant="secondary"
              size="sm"
              icon={<IconPlusCircle size={13} strokeWidth={2} />}
              onClick={onAddConnector}
              className="text-[12px] cursor-pointer"
            >
              {t('provisioning.connector.addBtn', 'Thêm súng sạc')}
            </Button>
          )}

          {isActive && (
            <Button
              variant="danger"
              size="sm"
              onClick={onSuspend}
              className="text-[12px] cursor-pointer"
            >
              ⏸️ Tạm ngưng trụ sạc
            </Button>
          )}

          {isSuspended && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onReactivate}
              className="text-[12px] text-brand border-brand/30 hover:bg-brand-soft cursor-pointer"
            >
              ▶️ Mở lại trụ sạc
            </Button>
          )}
        </div>

        {canActivate && (
          <Button
            size="sm"
            icon={<IconCheck size={14} strokeWidth={2.2} />}
            onClick={onActivate}
            disabled={activating}
            className="text-[12px] cursor-pointer"
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
    <Modal open onClose={onClose} maxWidth={480}>
      <div className="flex flex-col gap-4 text-[13px] text-body">
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">
            {isSuspend ? 'Tạm ngưng hoạt động Trụ sạc' : 'Mở lại hoạt động Trụ sạc'}
          </h3>
          <p className="text-[12px] text-muted mt-0.5">
            Trụ: <b className="text-ink">{chargePoint.name || chargePoint.chargePointCode || chargePoint.id}</b>
          </p>
        </div>
        <div className={`rounded-xl border p-3 text-xs leading-relaxed ${isSuspend ? 'border-warn-border bg-warn-soft text-warn-deep' : 'border-line-2 bg-surface-2 text-ink'}`}>
          {isSuspend ? (
            <span>
              ⚠️ Khi tạm ngưng trụ <b>{chargePoint.name || chargePoint.chargePointCode || chargePoint.id}</b>, tất cả các súng sạc thuộc trụ này sẽ tạm ngưng tiếp nhận lượt sạc mới.
            </span>
          ) : (
            <span>
              Xác nhận mở lại trụ <b>{chargePoint.name || chargePoint.chargePointCode || chargePoint.id}</b> để tiếp tục phục vụ người dùng.
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-faint mb-1.5">
            Lý do {isSuspend ? 'tạm ngưng' : 'mở lại'} *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={isSuspend ? 'Nhập lý do tạm ngưng (vd: Bảo trì định kỳ, sự cố nguồn điện...)' : 'Nhập lý do mở lại...'}
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

  const create = useMutation({
    mutationFn: () =>
      api.chargePoints.provision({
        stationId,
        name: name.trim() || undefined,
        zoneLabel: zoneLabel.trim() || undefined,
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
              Tên / Ký hiệu trụ sạc *
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Trụ 01 - Sạc nhanh DC"
              required
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

          <div className="rounded-[8px] bg-surface-2 p-3 text-[11.5px] text-muted border border-line-2">
            Mã trụ sạc (CP-ID) sẽ được hệ thống cấp tự động duy nhất theo trạm sạc.
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
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [name, setName] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.connectors.provision({
        stationId: stationId || chargePoint.stationId,
        chargePointId: chargePoint.id,
        connectorCode: connectorCode.trim() || 'C-01',
        connectorType,
        powerKw,
        slotMinutes,
        name: name.trim() || undefined,
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

          <div className="grid grid-cols-2 gap-2.5">
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
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">
                Thời lượng slot (phút)
              </label>
              <input
                type="number"
                min={5}
                max={240}
                value={slotMinutes}
                onChange={(e) => setSlotMinutes(Number(e.target.value))}
                className="w-full rounded-[8px] border border-line-2 bg-surface p-2.5 text-[12.5px] text-ink focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              Tên hiển thị súng (tùy chọn)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Súng 1 - CCS2 120kW"
              className="w-full rounded-[8px] border border-line-2 bg-surface p-2.5 text-[12.5px] text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div className="rounded-[8px] bg-surface-2 p-3 text-[11.5px] text-muted border border-line-2">
            Hệ thống áp dụng <b>Dynamic QR Check-in</b>: Mã challenge token sẽ tự động sinh động theo thời gian thực (TTL 60s) trên màn hình trụ sạc khi tài xế cắm sạc.
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
