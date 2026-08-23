import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  IconAlertTriangle,
  IconBolt,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconCopy,
  IconPin,
  IconRefreshCw,
  IconShield,
  IconUsers,
  IconX,
  SegmentedControl,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import {
  formatDateVn,
  formatDateTimeVn,
  useApi,
  type AdminStationDetail,
  type AdminStationListItem,
  type StationStatus,
} from '@chargeops/api';

export interface StationDetailDrawerProps {
  open: boolean;
  stationId: string | null;
  initialData?: AdminStationListItem | null;
  onClose: () => void;
  onSuspend?: (station: AdminStationDetail | AdminStationListItem) => void;
  onReactivate?: (station: AdminStationDetail | AdminStationListItem) => void;
  onManageLicense?: (stationId: string) => void;
  onManageProvisioning?: (stationId: string) => void;
}

type StationTab = 'overview' | 'owner' | 'hardware' | 'history';

const STATUS_META: Record<
  string,
  { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }
> = {
  ACTIVE: { label: 'Đang hoạt động', tone: 'good' },
  active: { label: 'Đang hoạt động', tone: 'good' },
  PENDING_APPROVAL: { label: 'Chờ xét duyệt', tone: 'warn' },
  pending: { label: 'Chờ xét duyệt', tone: 'warn' },
  SUSPENDED: { label: 'Tạm ngưng vận hành', tone: 'warn' },
  suspended: { label: 'Tạm ngưng vận hành', tone: 'warn' },
  REJECTED: { label: 'Từ chối duyệt', tone: 'bad' },
  rejected: { label: 'Từ chối duyệt', tone: 'bad' },
  WITHDRAWN: { label: 'Đã rút hồ sơ', tone: 'neutral' },
  withdrawn: { label: 'Đã rút hồ sơ', tone: 'neutral' },
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Thứ Hai',
  TUESDAY: 'Thứ Ba',
  WEDNESDAY: 'Thứ Tư',
  THURSDAY: 'Thứ Năm',
  FRIDAY: 'Thứ Sáu',
  SATURDAY: 'Thứ Bảy',
  SUNDAY: 'Chủ Nhật',
};

export function StationDetailDrawer({
  open,
  stationId,
  initialData,
  onClose,
  onSuspend,
  onReactivate,
  onManageLicense,
  onManageProvisioning,
}: StationDetailDrawerProps) {
  const api = useApi();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<StationTab>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch full detail of station
  const { data: stationData, isLoading: isStationLoading } = useQuery({
    queryKey: ['admin', 'stations', 'detail', stationId],
    queryFn: () => (stationId ? api.stations.adminDetail(stationId) : Promise.reject('No ID')),
    enabled: Boolean(stationId) && open,
  });

  const station = stationData || (initialData as any as AdminStationDetail | undefined);

  // Fetch status history timeline
  const { data: historyList, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['admin', 'stations', 'history', stationId],
    queryFn: () => (stationId ? api.stations.statusHistory(stationId) : Promise.resolve([])),
    enabled: Boolean(stationId) && open && activeTab === 'history',
  });

  // Fetch charge points for hardware tab
  const { data: chargePoints, isLoading: isCpsLoading } = useQuery({
    queryKey: ['admin', 'stations', 'chargePoints', stationId],
    queryFn: () => (stationId ? api.chargePoints.list(stationId) : Promise.resolve([])),
    enabled: Boolean(stationId) && open && activeTab === 'hardware',
  });

  // Fetch connectors for hardware tab
  const { data: allConnectors } = useQuery({
    queryKey: ['admin', 'stations', 'connectors', stationId, (chargePoints ?? []).map((cp) => cp.id).join(',')],
    queryFn: async () => {
      const cps = chargePoints ?? [];
      if (cps.length === 0) return [];
      const results = await Promise.all(
        cps.map((cp) => api.connectors.list(cp.id, stationId ?? undefined).catch(() => [])),
      );
      return results.flat();
    },
    enabled: Boolean(stationId && open && activeTab === 'hardware' && chargePoints && chargePoints.length > 0),
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast('Đã sao chép vào bộ nhớ tạm', 'success');
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const normStatus = String(station?.status ?? 'active').toUpperCase();
  const statusMeta = STATUS_META[normStatus] || { label: normStatus, tone: 'neutral' };
  const license = station?.licenseSummary;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={station?.name ?? 'Chi tiết Trạm Sạc'}
      width="640px"
    >
      {isStationLoading && !station ? (
        <div className="flex flex-col gap-4 p-5">
          <Skeleton className="h-28 w-full rounded-[10px]" />
          <Skeleton className="h-44 w-full rounded-[10px]" />
          <Skeleton className="h-44 w-full rounded-[10px]" />
        </div>
      ) : !station ? (
        <div className="flex flex-col items-center gap-3 p-6">
          <EmptyState
            title="Không tìm thấy trạm"
            description="Thông tin trạm không tồn tại hoặc đã bị xóa."
          />
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-5 text-[13px] text-body">
          {/* Top Hero Station Card */}
          <div className="relative overflow-hidden rounded-[12px] border border-line-2 bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-bold text-brand">
                    {station.stationCode || station.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(station.stationCode || station.id, 'code')}
                    className="text-faint hover:text-ink transition"
                    title="Sao chép mã trạm"
                  >
                    {copiedKey === 'code' ? <IconCheck size={13} className="text-good" /> : <IconCopy size={13} />}
                  </button>
                  <StatusPill tone={statusMeta.tone} label={statusMeta.label} />
                </div>
                <h3 className="mt-1 text-[16px] font-bold tracking-tight text-ink truncate">
                  {station.name}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                  <IconPin size={13} className="shrink-0 text-faint" />
                  <span className="truncate">{station.addressLine || 'Địa chỉ đang cập nhật'}</span>
                </div>
              </div>

              {/* Quick action buttons in hero */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                {normStatus === 'ACTIVE' && onSuspend && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSuspend(station)}
                    className="text-warn hover:border-warn text-[12px] h-[30px]"
                  >
                    Tạm ngưng trạm
                  </Button>
                )}
                {normStatus === 'SUSPENDED' && onReactivate && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onReactivate(station)}
                    className="text-[12px] h-[30px]"
                  >
                    Kích hoạt lại
                  </Button>
                )}
              </div>
            </div>

            {/* Sub-strip: Quick Stats */}
            <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-[11.5px]">
              <div>
                <span className="text-faint">Chủ sở hữu:</span>
                <div className="font-semibold text-ink truncate">{station.ownerDisplayName || '—'}</div>
              </div>
              <div>
                <span className="text-faint">Trụ quy hoạch:</span>
                <div className="font-semibold text-ink">{station.plannedChargePointCount ?? 0} Trụ</div>
              </div>
              <div>
                <span className="text-faint">Gói License:</span>
                <div className="font-semibold text-brand">
                  {license?.plan ? `Gói ${license.plan === 'YEARLY' ? 'Năm' : 'Tháng'}` : 'Chưa kích hoạt'}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <SegmentedControl<StationTab>
            segments={[
              { key: 'overview', label: 'Tổng quan & Vị trí' },
              { key: 'owner', label: 'Chủ trạm' },
              { key: 'hardware', label: 'Trụ & Súng sạc' },
              { key: 'history', label: 'Lịch sử trạng thái' },
            ]}
            active={activeTab}
            onChange={(tab) => setActiveTab(tab)}
          />

          {/* TAB 1: OVERVIEW & LOCATION */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4">
              {/* Location & GPS Card */}
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-ink">Vị trí & Địa chỉ</span>
                  {station.latitude && station.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11.5px] font-semibold text-brand hover:underline flex items-center gap-1"
                    >
                      <span>Mở Google Maps</span>
                      <span>↗</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <span className="text-faint">Tỉnh / Thành phố:</span>
                    <div className="font-medium text-body">{station.provinceName || '—'}</div>
                  </div>
                  <div>
                    <span className="text-faint">Phường / Xã:</span>
                    <div className="font-medium text-body">{station.wardName || '—'}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-faint">Địa chỉ chi tiết:</span>
                    <div className="font-medium text-body">{station.addressLine || '—'}</div>
                  </div>
                  <div>
                    <span className="text-faint">Tọa độ Vĩ độ (Lat):</span>
                    <div className="font-mono font-medium text-ink">{station.latitude ?? '—'}</div>
                  </div>
                  <div>
                    <span className="text-faint">Tọa độ Kinh độ (Lng):</span>
                    <div className="font-mono font-medium text-ink">{station.longitude ?? '—'}</div>
                  </div>
                  <div>
                    <span className="text-faint">Hotline liên hệ trạm:</span>
                    <div className="font-medium text-body">{station.contactPhone || '—'}</div>
                  </div>
                  <div>
                    <span className="text-faint">Ngày khởi tạo hồ sơ:</span>
                    <div className="font-medium text-body">{station.createdAt ? formatDateVn(station.createdAt) : '—'}</div>
                  </div>
                </div>
              </Card>

              {/* Operating Periods */}
              <Card className="p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
                  <IconClock size={15} className="text-brand" />
                  <span>Khung giờ hoạt động</span>
                </div>
                {!station.operatingPeriods || station.operatingPeriods.length === 0 ? (
                  <div className="py-2 text-[12px] text-muted">Mở cửa 24/7 toàn bộ các ngày trong tuần.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[12px] pt-1">
                    {station.operatingPeriods.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="flex items-center justify-between rounded-[6px] border border-line-2 bg-surface-2 px-2.5 py-1.5"
                      >
                        <span className="font-medium text-body">{DAY_LABELS[p.dayOfWeek] || p.dayOfWeek}</span>
                        <span className="font-mono font-semibold text-ink">
                          {p.openTime} - {p.closeTime}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Station Images Gallery */}
              {station.assets && station.assets.length > 0 && (
                <Card className="p-4 flex flex-col gap-2.5">
                  <span className="text-[12.5px] font-bold text-ink">Hình ảnh trạm sạc & giấy tờ ({station.assets.length})</span>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {station.assets.map((asset, idx) => (
                      <a
                        key={idx}
                        href={asset.assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-video overflow-hidden rounded-[8px] border border-line-2 bg-canvas transition hover:border-brand"
                      >
                        <img
                          src={asset.assetUrl}
                          alt={`Asset ${idx + 1}`}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        {asset.isPrimary && (
                          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            Ảnh chính
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* TAB 2: OWNER INFO */}
          {activeTab === 'owner' && (
            <div className="flex flex-col gap-4">
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[13px] font-bold text-ink">
                  <IconUsers size={16} className="text-brand" />
                  <span>Hồ sơ Chủ sở hữu trạm (CPO)</span>
                </div>

                <div className="flex flex-col gap-2.5 text-[12px] pt-1">
                  <div className="flex items-center justify-between border-b border-hairline pb-2">
                    <span className="text-faint">Tên đại diện CPO:</span>
                    <span className="font-semibold text-ink">{station.ownerDisplayName || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-hairline pb-2">
                    <span className="text-faint">Email tài khoản:</span>
                    <span className="font-mono text-body">{station.ownerEmail || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-hairline pb-2">
                    <span className="text-faint">Số điện thoại liên hệ:</span>
                    <span className="font-medium text-body">{station.ownerPhoneNumber || station.contactPhone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-faint">Mã định danh CPO (UUID):</span>
                    <span className="font-mono text-[11px] text-faint truncate max-w-[240px]">
                      {station.ownerId || '—'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* License Status for this Owner's Station */}
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-ink">
                    <IconShield size={16} className="text-brand" />
                    <span>Giấy phép hoạt động (Subscription License)</span>
                  </div>
                  {onManageLicense && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onManageLicense(station.id)}
                      className="text-[11.5px] h-[28px]"
                    >
                      Quản lý License ↗
                    </Button>
                  )}
                </div>

                {license ? (
                  <div className="rounded-[8px] border border-brand/30 bg-brand-soft/10 p-3 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand">
                        Gói {license.plan === 'YEARLY' ? 'Năm (12 Tháng)' : 'Tháng (30 Ngày)'}
                      </span>
                      <StatusPill tone="good" label="Đang hiệu lực" />
                    </div>
                    <div className="mt-2 text-[11.5px] text-body">
                      <span>Thời hạn kết thúc: </span>
                      <span className="font-semibold text-ink">
                        {license.expiresAt ? formatDateVn(license.expiresAt) : '—'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[8px] border border-line-2 bg-surface-2 p-3 text-center text-[12px] text-muted">
                    Trạm chưa được cấp hoặc chưa kích hoạt License.
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 3: HARDWARE & CHARGEPOINTS */}
          {activeTab === 'hardware' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[12.5px] font-bold text-ink">
                  Danh sách Trụ sạc ({chargePoints?.length ?? 0}/{station.plannedChargePointCount ?? 0})
                </span>
                {onManageProvisioning && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onManageProvisioning(station.id)}
                    className="text-[11.5px] h-[28px] flex items-center gap-1"
                  >
                    <IconBolt size={13} />
                    <span>Cấu hình trụ sạc ↗</span>
                  </Button>
                )}
              </div>

              {isCpsLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-20 w-full rounded-[8px]" />
                  <Skeleton className="h-20 w-full rounded-[8px]" />
                </div>
              ) : !chargePoints || chargePoints.length === 0 ? (
                <div className="rounded-[10px] border border-line-2 bg-surface-2 py-8 text-center text-[12.5px] text-faint">
                  Chưa có trụ sạc nào được cấu hình cho trạm này.
                </div>
              ) : (
                chargePoints.map((cp) => {
                  const cpConnectors = (allConnectors ?? []).filter((c) => c.chargePointId === cp.id);
                  const provStatus = String(cp.provisioningStatus || '').toUpperCase();
                  const isPending = provStatus === 'PENDING_ACTIVATION' || provStatus === 'UNCLAIMED' || provStatus === 'PENDING';
                  const isActive = provStatus === 'ACTIVE';
                  const isSuspended = provStatus === 'SUSPENDED';

                  return (
                    <Card key={cp.id} className="p-3.5 flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-brand-soft mt-0.5">
                            <IconBolt size={15} className="text-brand" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-[13.5px] text-ink">{cp.name || 'Trụ sạc'}</span>
                              <span className="font-mono text-[11px] font-bold text-brand">{cp.chargePointCode || cp.id}</span>
                              {cp.zoneLabel && (
                                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9.5px] font-medium text-faint border border-line-2">
                                  {cp.zoneLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-[11.5px] text-muted mt-0.5 font-mono">
                              Công suất: {cp.maxPowerKw} kW · {cpConnectors.length} Súng sạc
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPending && <StatusPill tone="neutral" label="Chờ kích hoạt" />}
                          {isActive && <StatusPill tone="good" label="Đang hoạt động" />}
                          {isSuspended && <StatusPill tone="warn" label="Tạm ngưng vận hành" />}
                        </div>
                      </div>

                      {/* Connectors preview */}
                      {cpConnectors.length > 0 && (
                        <div className="border-t border-hairline pt-2 flex flex-col gap-1.5">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-faint">Danh sách súng sạc:</span>
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {cpConnectors.map((c) => {
                              const rStatus = String(c.runtimeStatus || 'AVAILABLE').toUpperCase();
                              let cTone: 'good' | 'brand' | 'bad' | 'neutral' | 'warn' = 'good';
                              let cLabel = 'Sẵn sàng';
                              if (isPending) {
                                cTone = 'neutral';
                                cLabel = 'Chưa mở sạc';
                              } else if (isSuspended) {
                                cTone = 'neutral';
                                cLabel = 'Tạm dừng theo trụ';
                              } else if (rStatus === 'IN_USE' || rStatus === 'INUSE') {
                                cTone = 'brand';
                                cLabel = 'Đang sạc';
                              } else if (rStatus === 'OFFLINE') {
                                cTone = 'bad';
                                cLabel = 'Offline';
                              }

                              return (
                                <div key={c.id} className="flex items-center justify-between gap-1.5 rounded-[6px] border border-line-2 bg-surface-2 px-2.5 py-1.5 text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-brand">{c.connectorCode || c.id}</span>
                                    <span className="text-muted">({c.powerKw} kW - {c.connectorType})</span>
                                  </div>
                                  <StatusPill tone={cTone} label={cLabel} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: STATUS HISTORY TIMELINE */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-3">
              <span className="text-[12.5px] font-bold text-ink px-1">Lịch sử biến động trạng thái trạm</span>
              {isHistoryLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-16 w-full rounded-[8px]" />
                  <Skeleton className="h-16 w-full rounded-[8px]" />
                </div>
              ) : !historyList || historyList.length === 0 ? (
                <div className="rounded-[10px] border border-line-2 bg-surface-2 py-8 text-center text-[12.5px] text-faint">
                  Chưa có sự kiện biến động trạng thái nào được ghi nhận.
                </div>
              ) : (
                <div className="relative pl-5 border-l-2 border-line-2 flex flex-col gap-3.5 my-1">
                  {historyList.map((evt, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={evt.id || idx} className="relative group">
                        <div
                          className={`absolute -left-[27px] top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow-sm ${
                            isLatest ? 'border-brand bg-brand text-white ring-4 ring-brand/20' : 'border-line-2 bg-surface-2 text-muted'
                          }`}
                        >
                          {historyList.length - idx}
                        </div>
                        <div className="rounded-[9px] border border-line-2 bg-surface-2 p-3 text-[12px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink">{evt.eventType}</span>
                              {evt.fromStatus && (
                                <span className="text-[11px] text-muted">
                                  ({evt.fromStatus} → <b className="text-ink">{evt.toStatus}</b>)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-faint">
                              {evt.performedAt ? formatDateTimeVn(evt.performedAt) : '—'}
                            </span>
                          </div>

                          {evt.reason && (
                            <div className="mt-2 rounded-[6px] border border-line-2 bg-surface p-2 text-[11.5px] text-body">
                              <span className="font-semibold text-faint">Lý do: </span>
                              {evt.reason}
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between text-[10.5px] text-faint border-t border-hairline pt-1.5">
                            <span>
                              Thực hiện bởi: <b className="text-body">{evt.performedByName || 'Quản trị viên'}</b>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
