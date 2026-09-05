import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  IconBolt,
  IconCheck,
  IconCopy,
  IconPhone,
  IconPin,
  IconShield,
  IconShieldAlert,
  IconShieldCheck,
  IconUsers,
  SegmentedControl,
  Skeleton,
  StationGallery,
  StationStatusBadge,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import {
  AMENITY_CATALOG,
  AMENITY_EMOJI,
  formatDateVn,
  formatDateTimeVn,
  isStationDriverEligible,
  resolveOperatingState,
  useApi,
  type Amenity,
  type ChargePoint,
  type Connector,
  type Station,
  type StationStatusHistory,
  type StationStaffMember,
} from '@chargeops/api';
import { ChangeOperationalStatusModal } from './ChangeOperationalStatusModal';

export interface StationDetailDrawerProps {
  open: boolean;
  station: Station | null;
  onClose: () => void;
  onSelectActive?: (stationId: string) => void;
  isActiveInContext?: boolean;
}

type StationTab = 'overview' | 'gallery' | 'hardware' | 'hours_amenities' | 'license' | 'staff' | 'timeline';

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Thứ Hai',
  TUESDAY: 'Thứ Ba',
  WEDNESDAY: 'Thứ Tư',
  THURSDAY: 'Thứ Năm',
  FRIDAY: 'Thứ Sáu',
  SATURDAY: 'Thứ Bảy',
  SUNDAY: 'Chủ Nhật',
  T2: 'Thứ Hai',
  T3: 'Thứ Ba',
  T4: 'Thứ Tư',
  T5: 'Thứ Năm',
  T6: 'Thứ Sáu',
  T7: 'Thứ Bảy',
  CN: 'Chủ Nhật',
};

export function StationDetailDrawer({
  open,
  station,
  onClose,
  onSelectActive,
  isActiveInContext = false,
}: StationDetailDrawerProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<StationTab>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [changeOperationalStatusOpen, setChangeOperationalStatusOpen] = useState(false);

  // Local state for amenities editing in tab 3
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);
  const [amenitiesDirty, setAmenitiesDirty] = useState(false);

  // Sync amenities when station changes
  useEffect(() => {
    if (station?.amenities) {
      setSelectedAmenities(station.amenities);
    } else {
      setSelectedAmenities([]);
    }
  }, [station]);

  const stationId = station?.id;

  // 1. Hardware & Chargers
  const chargePointsQ = useQuery({
    queryKey: ['chargePoints', 'station', stationId],
    queryFn: () => (stationId ? api.chargePoints.list(stationId) : Promise.resolve([])),
    enabled: Boolean(stationId) && open && (activeTab === 'hardware' || activeTab === 'overview'),
  });

  const connectorsQ = useQuery({
    queryKey: ['connectors', 'station', stationId],
    queryFn: () => (stationId ? api.connectors.list(undefined, stationId) : Promise.resolve([])),
    enabled: Boolean(stationId) && open && activeTab === 'hardware',
  });

  // 2. License & History
  const licenseQ = useQuery({
    queryKey: ['license', 'mine', stationId],
    queryFn: () => (stationId ? api.licenses.mine(stationId) : Promise.resolve(null)),
    enabled: Boolean(stationId) && open && (activeTab === 'license' || activeTab === 'overview'),
  });

  // 3. Staff members
  const staffQ = useQuery({
    queryKey: ['staff', 'station', stationId],
    queryFn: () => (stationId ? api.staff.list(stationId) : Promise.resolve([])),
    enabled: Boolean(stationId) && open && activeTab === 'staff',
  });

  // 4. Status Transition History / Timeline
  const statusHistoryQ = useQuery({
    queryKey: ['stations', 'statusHistory', stationId],
    queryFn: () => (stationId ? api.stations.statusHistory(stationId) : Promise.resolve([])),
    enabled: Boolean(stationId) && open && activeTab === 'timeline',
  });

  const assetsQ = useQuery({
    queryKey: ['stations', 'assets', stationId],
    queryFn: () => (stationId ? api.stations.getAssets(stationId) : Promise.resolve([])),
    enabled: Boolean(stationId) && open,
  });

  // Update amenities mutation
  const updateAmenitiesMutation = useMutation({
    mutationFn: (amenities: Amenity[]) =>
      stationId ? api.stations.updateAmenities(stationId, amenities) : Promise.reject('No ID'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stations'] });
      setAmenitiesDirty(false);
      toast(t('stations.amenitiesUpdateSuccess', { defaultValue: 'Cập nhật tiện ích thành công!' }), 'success');
    },
    onError: () => {
      toast(t('stations.amenitiesUpdateError', { defaultValue: 'Không thể cập nhật tiện ích' }), 'error');
    },
  });

  if (!station) return null;

  const fullAddress =
    station.address ||
    [station.addressLine, station.wardName, station.provinceName].filter(Boolean).join(', ') ||
    station.addressLine ||
    '—';

  const actualChargers =
    chargePointsQ.data?.length ??
    station.actualChargePointCount ??
    station.chargerCount ??
    0;
  const onlineChargers =
    chargePointsQ.data?.filter((c) => c.operationalStatus === 'AVAILABLE').length ??
    station.onlineActualChargePointCount ??
    station.onlineChargePointCount ??
    station.onlineCount ??
    0;

  const eligibility = isStationDriverEligible(station.status, station.licenseSummary, new Date(), {
    actualChargePointCount: actualChargers,
    onlineChargePointCount: onlineChargers,
    chargerCount: actualChargers,
    onlineCount: onlineChargers,
  });

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const toggleAmenity = (amenity: Amenity) => {
    setSelectedAmenities((prev) => {
      const next = prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity];
      setAmenitiesDirty(true);
      return next;
    });
  };

  const stationStaff = (staffQ.data ?? []).filter(
    (m: StationStaffMember) => m.stationId === station.id || m.stationName === station.name,
  );

  const operatingState = resolveOperatingState(station);
  const isActive = station.status === 'active' || station.status === 'ACTIVE';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-bold text-ink">{station.name}</span>
            <StationStatusBadge
              status={station.status}
              eligibility={eligibility}
              operatingState={operatingState}
              variant="detailed"
            />
          </div>
          <div className="text-[12px] font-mono text-faint">
            {station.stationCode || station.id} {station.city || station.provinceName ? `· ${station.city || station.provinceName}` : ''}
          </div>
        </div>
      }
      width="720px"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isActiveInContext ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-owner-soft px-3 py-1 text-[12px] font-semibold text-owner-deep">
                <IconCheck size={14} strokeWidth={2.4} />
                <span>Trạm đang quản lý trong ngữ cảnh</span>
              </span>
            ) : (
              onSelectActive && (
                <Button
                  accent="owner"
                  size="sm"
                  onClick={() => {
                    onSelectActive(station.id);
                    toast(`Đã chọn ${station.name} làm trạm quản lý hiện tại.`, 'success');
                  }}
                >
                  Chọn làm trạm hiện tại
                </Button>
              )
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs */}
        <SegmentedControl<StationTab>
          segments={[
            { key: 'overview', label: 'Tổng quan' },
            { key: 'gallery', label: 'Thư viện ảnh' },
            { key: 'hardware', label: 'Thiết bị & Trụ sạc' },
            { key: 'hours_amenities', label: 'Giờ & Tiện ích' },
            { key: 'license', label: 'Giấy phép' },
            { key: 'staff', label: 'Nhân viên' },
            { key: 'timeline', label: 'Tiến trình' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
          accent="owner"
        />

        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4">
            {/* Operational Status Control Card */}
            {(station.status === 'ACTIVE' || station.status === 'active') && (
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-ink">
                      {t('stations.operationalModal.currentOperationalStatus', { defaultValue: 'Trạng thái vận hành trạm' })}
                    </span>
                    {station.operationalStatus === 'PAUSED' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 border border-rose-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Tạm dừng đón khách
                      </span>
                    ) : station.operationalStatus === 'MAINTENANCE' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 border border-amber-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Đang bảo trì
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đang vận hành bình thường
                      </span>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setChangeOperationalStatusOpen(true)}
                  >
                    {t('stations.operationalModal.changeStatusBtn', { defaultValue: 'Đổi trạng thái vận hành' })}
                  </Button>
                </div>

                {station.operationalStatus !== 'OPERATING' && station.operationalStatus && (
                  <div className="rounded-[8px] border border-line-2 bg-surface-2 p-2.5 text-[12px] leading-relaxed text-muted">
                    <span className="font-semibold text-ink">
                      {t('stations.operationalModal.reason', { defaultValue: 'Lý do:' })}{' '}
                    </span>
                    <span>{station.operationalStatusReason || 'Chủ trạm tạm thời dừng tiếp nhận đặt chỗ mới.'}</span>
                  </div>
                )}
              </Card>
            )}

            {/* Warning Callout when Station is Active but not Driver-Eligible */}
            {(station.status === 'ACTIVE' || station.status === 'active') && !eligibility.isEligible && (
              <div className="rounded-[10px] border border-warn-border bg-warn-soft/60 p-3 text-[12px] leading-relaxed text-warn-deep">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <IconShieldAlert size={16} className="text-warn shrink-0" />
                  <span>Trạm đang tạm ẩn khỏi tìm kiếm của tài xế</span>
                </div>
                <div className="mt-1 text-muted">
                  {eligibility.details || 'Gói License của trạm chưa sẵn sàng để tiếp nhận đặt chỗ mới.'}{' '}
                  <span className="font-semibold text-ink">Các phiên sạc đang chạy vẫn được bảo đảm.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('license')}
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-warn-deep hover:underline"
                >
                  <span>Xem chi tiết License & Gia hạn</span>
                  <span>→</span>
                </button>
              </div>
            )}

            {/* Rejection Reason Alert */}
            {(station.status === 'REJECTED' || station.status === 'rejected') && station.rejectionReason && (
              <div className="rounded-[10px] border border-bad-border bg-bad-soft p-3 text-[12px] text-bad-deep">
                <div className="font-bold">Lý do từ chối phê duyệt từ Quản trị viên:</div>
                <div className="mt-1">{station.rejectionReason}</div>
              </div>
            )}

            {/* Basic Info Card */}
            <Card className="p-4 flex flex-col gap-3">
              <div className="text-[13px] font-bold text-ink">Thông tin Định danh & Liên hệ</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12.5px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-faint font-medium">Mã trạm hệ thống</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-ink">
                    <span>{station.stationCode || station.id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(station.stationCode || station.id, 'code')}
                      className="text-faint hover:text-ink cursor-pointer"
                    >
                      {copiedField === 'code' ? <IconCheck size={14} className="text-good" /> : <IconCopy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-faint font-medium">Số điện thoại liên hệ</span>
                  <div className="flex items-center gap-1.5 font-medium text-ink">
                    <IconPhone size={14} className="text-faint" />
                    <span>{(station as any).contactPhone || '—'}</span>
                  </div>
                </div>

                <div className="col-span-full flex flex-col gap-0.5 border-t border-hairline pt-2.5">
                  <span className="text-faint font-medium">Địa chỉ chi tiết</span>
                  <div className="flex items-start gap-1.5 font-medium text-ink">
                    <IconPin size={15} className="text-faint mt-0.5 shrink-0" />
                    <span>{fullAddress}</span>
                  </div>
                </div>

                {((station as any).latitude || (station as any).longitude) && (
                  <div className="col-span-full flex items-center justify-between border-t border-hairline pt-2.5">
                    <div className="flex items-center gap-2 text-faint">
                      <span>Tọa độ GPS:</span>
                      <span className="font-mono text-ink">
                        {(station as any).latitude}, {(station as any).longitude}
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${(station as any).latitude},${(station as any).longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                    >
                      <span>Xem trên Google Maps</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}

                {(station as any).description && (
                  <div className="col-span-full flex flex-col gap-0.5 border-t border-hairline pt-2.5">
                    <span className="text-faint font-medium">Mô tả & Chỉ dẫn tiếp cận</span>
                    <span className="text-body leading-relaxed">{(station as any).description}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="rounded-[9px] border border-line-3 bg-surface p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">Số trụ dự kiến</div>
                <div className="mt-1 text-[18px] font-bold text-ink">
                  {station.plannedChargePointCount ?? '—'}
                </div>
              </div>

              <div className="rounded-[9px] border border-line-3 bg-surface p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">Trụ đang Online</div>
                <div className="mt-1 text-[18px] font-bold text-ink">
                  {onlineChargers}/{actualChargers}
                </div>
              </div>

              <div className="rounded-[9px] border border-line-3 bg-surface p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">Lượt đặt hôm nay</div>
                <div className="mt-1 text-[18px] font-bold text-ink">
                  {station.bookingsToday ?? 0}
                </div>
              </div>

              <div className="rounded-[9px] border border-line-3 bg-surface p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">Tỷ lệ sử dụng</div>
                <div className="mt-1 text-[18px] font-bold text-ink">
                  {station.utilizationPct ?? 0}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: GALLERY ==================== */}
        {activeTab === 'gallery' && (
          <Card className="p-4">
            <StationGallery
              stationId={station.id}
              stationName={station.name}
              assets={assetsQ.data ?? station.assets ?? []}
              getAuthParams={() => api.media.getImageKitAuth()}
              onUploadSuccess={async (res, isPrimary) => {
                await api.stations.registerAsset(station.id, {
                  assetUrl: res.url,
                  storageKey: res.fileId,
                  assetType: 'IMAGE',
                  altText: station.name,
                  primary: isPrimary,
                });
                qc.invalidateQueries({ queryKey: ['stations', 'assets', station.id] });
                qc.invalidateQueries({ queryKey: ['stations'] });
                toast('Tải ảnh trạm sạc lên thành công!', 'success');
              }}
              onDeleteAsset={async (assetId) => {
                await api.stations.deleteAsset(station.id, assetId);
                qc.invalidateQueries({ queryKey: ['stations', 'assets', station.id] });
                qc.invalidateQueries({ queryKey: ['stations'] });
                toast('Đã xóa ảnh khỏi trạm sạc.', 'success');
              }}
              onSetPrimaryAsset={async (assetId) => {
                await api.stations.setPrimaryAsset(station.id, assetId);
                qc.invalidateQueries({ queryKey: ['stations', 'assets', station.id] });
                qc.invalidateQueries({ queryKey: ['stations'] });
                toast('Đã cập nhật ảnh chính cho trạm sạc!', 'success');
              }}
            />
          </Card>
        )}

        {/* ==================== TAB 2: HARDWARE & CHARGERS ==================== */}
        {activeTab === 'hardware' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-ink">Trụ sạc & Cổng sạc (Connectors)</div>
                <div className="text-[12px] text-muted">
                  Danh sách trụ sạc được quản trị viên cấp phát cho trạm này.
                </div>
              </div>
              <Button
                accent="owner"
                size="sm"
                icon={<IconBolt size={14} />}
                onClick={() => {
                  if (onSelectActive) onSelectActive(station.id);
                  onClose();
                  navigate('/owner/chargers');
                }}
              >
                Quản lý chi tiết Trụ sạc →
              </Button>
            </div>

            {chargePointsQ.isLoading ? (
              <div className="flex flex-col gap-2.5">
                <Skeleton className="h-[80px] rounded-card" />
                <Skeleton className="h-[80px] rounded-card" />
              </div>
            ) : (chargePointsQ.data ?? []).length === 0 ? (
              <EmptyState
                title="Chưa có trụ sạc nào"
                description="Trạm chưa được quản trị viên cấp phát trụ sạc hoặc đang chờ kích hoạt phần cứng."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {(chargePointsQ.data ?? []).map((cp: ChargePoint) => {
                  const cpConnectors = (connectorsQ.data ?? []).filter((c: Connector) => c.chargePointId === cp.id);
                  const isCpOnline = cp.operationalStatus === 'AVAILABLE';

                  return (
                    <Card key={cp.id} className="p-3.5 flex flex-col gap-2.5 border border-line-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${isCpOnline ? 'bg-good' : cp.operationalStatus === 'MAINTENANCE' ? 'bg-warn' : 'bg-bad'}`}
                          />
                          <span className="font-bold text-[14px] text-ink">{cp.name}</span>
                          <span className="font-mono text-[11px] text-faint">({cp.chargePointCode || cp.id})</span>
                          {cp.zoneLabel && (
                            <span className="rounded bg-chip px-1.5 py-0.5 text-[10.5px] font-medium text-body">
                              {cp.zoneLabel}
                            </span>
                          )}
                        </div>
                        <StatusPill
                          tone={isCpOnline ? 'good' : cp.operationalStatus === 'MAINTENANCE' ? 'warn' : 'bad'}
                          label={cp.operationalStatus}
                        />
                      </div>

                      {/* Connectors list */}
                      {cpConnectors.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-hairline pt-2.5">
                          {cpConnectors.map((conn: Connector) => {
                            const isAvailable = conn.runtimeStatus === 'AVAILABLE';
                            const isInUse = conn.runtimeStatus === 'IN_USE';

                            return (
                              <div
                                key={conn.id}
                                className="flex items-center justify-between rounded-[7px] border border-line-3 bg-surface-2 p-2 text-[12px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-good' : isInUse ? 'bg-brand' : 'bg-bad'}`}
                                  />
                                  <div>
                                    <div className="font-semibold text-ink">
                                      {conn.connectorCode || conn.name}
                                    </div>
                                    <div className="font-mono text-[10.5px] text-faint">
                                      {conn.connectorType} · {conn.powerKw} kW
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[11px] font-medium text-body">
                                  {isAvailable ? 'Sẵn sàng' : isInUse ? 'Đang sạc' : 'Ngoại tuyến'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: HOURS & AMENITIES ==================== */}
        {activeTab === 'hours_amenities' && (
          <div className="flex flex-col gap-4">
            {/* Operating Hours */}
            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13.5px] font-bold text-ink">Giờ mở cửa hoạt động</div>
                  <div className="text-[11.5px] text-muted">
                    Khung giờ trạm mở cửa tiếp nhận tài xế đến sạc.
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (onSelectActive) onSelectActive(station.id);
                    onClose();
                    navigate('/owner/pricing');
                  }}
                >
                  Cấu hình giờ & giá →
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                  <div key={day} className="rounded-[8px] border border-line-3 bg-surface-2 p-2 text-center text-[12px]">
                    <div className="font-semibold text-ink">{DAY_LABELS[day] || day}</div>
                    <div className="mt-0.5 text-[11px] font-mono text-good font-medium">00:00 – 24:00 (24/7)</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Self-Service Amenities Manager */}
            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13.5px] font-bold text-ink">Tiện ích xung quanh trạm</div>
                  <div className="text-[11.5px] text-muted">
                    Chủ trạm có thể tự chọn tiện ích để hiển thị cho tài xế trên ứng dụng di động.
                  </div>
                </div>
                {amenitiesDirty && (
                  <Button
                    accent="owner"
                    size="sm"
                    disabled={updateAmenitiesMutation.isPending}
                    onClick={() => updateAmenitiesMutation.mutate(selectedAmenities)}
                  >
                    {updateAmenitiesMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {AMENITY_CATALOG.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`flex items-center gap-2 rounded-[8px] border p-2.5 text-left text-[12.5px] transition-colors cursor-pointer ${
                        isChecked
                          ? 'border-owner bg-owner-soft/50 font-semibold text-owner-deep'
                          : 'border-line-3 bg-surface hover:bg-surface-2 text-body'
                      }`}
                    >
                      <span className="text-[15px]">{AMENITY_EMOJI[amenity]}</span>
                      <span className="flex-1 truncate">{t(`stations.amenities.${amenity}`, { defaultValue: amenity })}</span>
                      {isChecked && <IconCheck size={14} className="text-owner shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ==================== TAB 4: LICENSE & VISIBILITY ==================== */}
        {activeTab === 'license' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-ink">Giấy phép Vận hành (License)</div>
                <div className="text-[12px] text-muted">
                  Gói dịch vụ nền tảng duy trì kết nối & khả năng hiển thị trạm cho tài xế.
                </div>
              </div>
              <Button
                accent="owner"
                size="sm"
                icon={<IconShield size={14} />}
                onClick={() => {
                  if (onSelectActive) onSelectActive(station.id);
                  onClose();
                  navigate('/owner/license');
                }}
              >
                Quản lý Giấy phép →
              </Button>
            </div>

            {/* License Details Card */}
            {licenseQ.isLoading ? (
              <Skeleton className="h-[120px] rounded-card" />
            ) : licenseQ.data ? (
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconShieldCheck size={18} className="text-owner" />
                    <span className="font-bold text-[14px] text-ink">
                      Gói {licenseQ.data.plan === 'YEARLY' ? 'Năm' : 'Tháng'}
                    </span>
                    <StatusPill tone="good" label={licenseQ.data.status} />
                  </div>
                  {licenseQ.data.daysLeft !== undefined && (
                    <span className="rounded-full bg-owner-soft px-2.5 py-0.5 text-[11px] font-bold text-owner-deep">
                      Còn {licenseQ.data.daysLeft} ngày
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12.5px] border-t border-hairline pt-3">
                  <div>
                    <span className="text-faint">Ngày bắt đầu hiệu lực:</span>
                    <div className="font-medium text-ink">{formatDateVn(licenseQ.data.startAt)}</div>
                  </div>
                  <div>
                    <span className="text-faint">Ngày hết hạn:</span>
                    <div className="font-medium text-ink">{formatDateVn(licenseQ.data.expiresAt)}</div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="rounded-[10px] border border-warn-border bg-warn-soft p-3.5 text-[12px] text-warn-deep">
                <div className="font-bold">Trạm chưa kích hoạt gói License nào</div>
                <div className="mt-1">
                  Vui lòng liên hệ Quản trị viên để cấp phát và kích hoạt License cho trạm này nhằm mở khả năng nhận khách.
                </div>
              </div>
            )}

            {/* Driver Search Eligibility Explanation */}
            <Card className="p-4 flex flex-col gap-2.5">
              <div className="text-[13px] font-bold text-ink">Điều kiện Hiển thị Tìm kiếm Tài xế</div>
              <div className="flex items-center justify-between text-[12.5px] py-1 border-b border-hairline">
                <span>1. Trạng thái Trạm được Duyệt (ACTIVE)</span>
                <span className="font-semibold text-good">
                  {station.status === 'ACTIVE' || station.status === 'active' ? '✓ Đạt' : '✗ Chưa đạt'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12.5px] py-1 border-b border-hairline">
                <span>2. Gói License còn hiệu lực</span>
                <span className="font-semibold text-good">
                  {station.licenseSummary ? '✓ Đạt' : '✗ Chưa có'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12.5px] py-1">
                <span>3. Trụ sạc sẵn sàng tiếp nhận đặt chỗ</span>
                <span className="font-semibold text-good">
                  {actualChargers > 0 ? `✓ Có ${actualChargers} trụ` : '✗ Chưa có trụ'}
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* ==================== TAB 5: STAFF ==================== */}
        {activeTab === 'staff' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-ink">Nhân viên Phụ trách Trạm</div>
                <div className="text-[12px] text-muted">
                  Danh sách nhân viên được phân quyền vận hành và hỗ trợ tài xế tại trạm.
                </div>
              </div>
              <Button
                accent="owner"
                size="sm"
                icon={<IconUsers size={14} />}
                onClick={() => {
                  if (onSelectActive) onSelectActive(station.id);
                  onClose();
                  navigate('/owner/staff');
                }}
              >
                Mời nhân viên mới →
              </Button>
            </div>

            {staffQ.isLoading ? (
              <Skeleton className="h-[100px] rounded-card" />
            ) : stationStaff.length === 0 ? (
              <EmptyState
                title="Chưa có nhân viên phụ trách"
                description="Trạm chưa được gán nhân viên vận hành nào. Bạn có thể phân công nhân viên từ trang Quản lý nhân viên."
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {stationStaff.map((m: StationStaffMember) => {
                  const staffName = m.displayName || m.name || m.email;
                  return (
                    <Card key={m.assignmentId || m.userId} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 text-[12px] font-bold text-ink">
                          {staffName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-ink">{staffName}</div>
                          <div className="text-[11.5px] text-faint">{m.email}</div>
                        </div>
                      </div>
                      <span className="rounded bg-good-soft px-2 py-0.5 text-[11px] font-semibold text-good">
                        {m.status === 'ACTIVE' ? 'Đang trực' : 'Đã thu hồi'}
                      </span>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 6: TIMELINE & AUDIT HISTORY ==================== */}
        {activeTab === 'timeline' && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[14px] font-bold text-ink">Tiến trình Phê duyệt & Lịch sử Trạng thái</div>
              <div className="text-[12px] text-muted">
                Toàn bộ các mốc thay đổi trạng thái của hồ sơ trạm từ lúc nộp đến khi vận hành.
              </div>
            </div>

            {statusHistoryQ.isLoading ? (
              <Skeleton className="h-[140px] rounded-card" />
            ) : (statusHistoryQ.data ?? []).length === 0 ? (
              <Card className="p-4 text-center text-[12.5px] text-muted">
                Chưa có dữ liệu lịch sử trạng thái được ghi nhận cho trạm này.
              </Card>
            ) : (
              <div className="relative flex flex-col gap-4 pl-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-0.5 before:bg-line-2">
                {(statusHistoryQ.data ?? []).map((event: StationStatusHistory, idx: number) => {
                  const isReject = event.eventType === 'REJECTED';
                  const isApprove = event.eventType === 'APPROVED';
                  const isSubmit = event.eventType === 'SUBMITTED';

                  return (
                    <div key={event.id || idx} className="relative flex flex-col gap-1">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-surface ${
                          isApprove ? 'bg-good' : isReject ? 'bg-bad' : isSubmit ? 'bg-brand' : 'bg-warn'
                        }`}
                      />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[13px] text-ink">{event.eventType}</span>
                        <span className="text-[11px] font-mono text-faint">
                          {formatDateTimeVn(event.performedAt)}
                        </span>
                      </div>
                      <div className="text-[12px] text-body">
                        Thực hiện bởi: <span className="font-medium text-ink">{event.performedByName || 'Hệ thống'}</span>
                        {event.performedByRole && (
                          <span className="ml-1 text-[11px] text-faint">({event.performedByRole})</span>
                        )}
                      </div>
                      {event.reason && (
                        <div
                          className={`mt-1 rounded-[7px] p-2 text-[11.5px] leading-relaxed ${
                            isReject ? 'bg-bad-soft text-bad-deep font-medium' : 'bg-surface-2 text-body'
                          }`}
                        >
                          {event.reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ChangeOperationalStatusModal
        open={changeOperationalStatusOpen}
        station={station}
        onClose={() => setChangeOperationalStatusOpen(false)}
      />
    </Drawer>
  );
}
