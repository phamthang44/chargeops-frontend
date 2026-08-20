import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  formatDateVn,
  formatVnd,
  LICENSE_STATUS,
  useApi,
  type License,
  type Station,
} from '@chargeops/api';
import {
  Card,
  EmptyState,
  IconAlertTriangle,
  IconBolt,
  IconClock,
  IconInfo,
  IconShield,
  IconShieldCheck,
  MetricCard,
  PageHeader,
  Select,
  Skeleton,
  StatusPill,
  type SelectOption,
} from '@chargeops/ui';

/**
 * FR12 — owner license, status display only. Purchase/renewal happens
 * off-platform; the admin records status manually.
 */
export function License() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const { data: stations, isLoading: stationsLoading } = useQuery({
    queryKey: ['stations', 'mine'],
    queryFn: () => api.stations.mine(),
  });

  const stationList = stations ?? [];
  const currentStationId = selectedStationId || (stationList[0]?.id ?? null);
  const currentStation = stationList.find((s) => s.id === currentStationId) ?? stationList[0] ?? null;

  const { data: license, isLoading: licenseLoading, error } = useQuery({
    queryKey: ['license', 'mine', currentStationId],
    queryFn: () => api.licenses.mine(currentStationId ?? undefined),
    enabled: Boolean(currentStationId) || stationList.length === 0,
  });

  const { data: history } = useQuery({
    queryKey: ['licenses', 'history', currentStationId],
    queryFn: () => (currentStationId ? api.licenses.history(currentStationId) : Promise.resolve([])),
    enabled: Boolean(currentStationId),
  });

  const isLoading = stationsLoading || licenseLoading;

  const stationOptions = useMemo<SelectOption[]>(
    () =>
      stationList.map((s) => ({
        value: s.id,
        label: `${s.name} (${s.stationCode || s.id})`,
      })),
    [stationList],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <PageHeader
        title={t('license.title', { defaultValue: 'Giấy phép Vận hành (License)' })}
        subtitle={t('license.subtitle', {
          defaultValue: 'Theo dõi hiệu lực các gói subscription License cho các trạm sạc của bạn.',
        })}
      />

      {/* High-End Station Selector Bar */}
      {stationList.length > 1 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-card border border-line-2 bg-surface p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-owner-soft text-owner-deep">
              <IconBolt size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-ink truncate">
                  {currentStation?.name || 'Trạm sạc'}
                </span>
                {currentStation?.stationCode && (
                  <span className="font-mono text-[11px] font-semibold text-faint">
                    ({currentStation.stationCode})
                  </span>
                )}
                {currentStation?.city && (
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-muted">
                    {currentStation.city}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-muted">
                Đang hiển thị gói giấy phép và lịch sử subscription của trạm đã chọn.
              </div>
            </div>
          </div>

          <div className="w-full sm:w-[280px] shrink-0">
            <Select
              value={currentStationId ?? ''}
              onChange={(v) => setSelectedStationId(v)}
              options={stationOptions}
              searchable={stationList.length > 3}
              searchPlaceholder="Tìm trạm sạc..."
              accent="owner"
            />
          </div>
        </div>
      ) : currentStation ? (
        <div className="flex items-center gap-3 rounded-card border border-line-2 bg-surface p-3 px-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-owner-soft text-owner-deep">
            <IconBolt size={18} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-bold text-ink">{currentStation.name}</span>
            {currentStation.stationCode && (
              <span className="font-mono text-[11px] font-semibold text-faint">({currentStation.stationCode})</span>
            )}
            {currentStation.city && (
              <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                {currentStation.city}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('license.loadError', { message: (error as Error).message })}
        </Card>
      ) : isLoading ? (
        <div className="grid gap-[13px]">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[96px] rounded-card" />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-[220px] rounded-card" />
            <Skeleton className="h-[220px] rounded-card" />
          </div>
        </div>
      ) : !license ? (
        <Card className="p-12">
          <EmptyState
            title="Chưa có thông tin giấy phép"
            description="Trạm chưa có gói License hoạt động. Việc mua và gia hạn giấy phép được thực hiện ngoài nền tảng và được Quản trị viên ghi nhận trên hệ thống."
          />
        </Card>
      ) : (
        <Body license={license} station={currentStation} history={history ?? []} />
      )}
    </div>
  );
}

function Body({ license, station, history }: { license: License; station: Station | null; history: License[] }) {
  const { t } = useTranslation('owner');
  const meta = LICENSE_STATUS[license.status] || { label: license.status, tone: 'neutral' };
  const isYear = String(license.plan).toUpperCase() === 'YEARLY';
  const fee = license.feeAmount ?? license.priceVnd ?? 0;
  const startDate = license.startAt || license.startDate;
  const expiryDate = license.expiresAt || license.expiryDate;
  const daysLeft = license.daysLeft ?? 0;

  const normStatus = String(license.status).toUpperCase();
  const isActive = normStatus === 'ACTIVE';
  const isExpired = normStatus === 'EXPIRED';
  const isSuspended = normStatus === 'SUSPENDED';
  const isPendingApproval = station?.status === 'pending' || station?.status === 'PENDING_APPROVAL';

  // Exclude current license from history list if present
  const pastLicenses = history.filter((h) => h.id !== license.id);

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        <MetricCard
          label="Trạng thái hiệu lực"
          value={meta.label}
          accent={isActive ? (daysLeft <= 30 ? '#9a6b16' : '#0d8a5a') : isExpired ? '#c0392b' : '#5b54e8'}
        />
        <MetricCard
          label="Gói Subscription"
          value={isYear ? 'Gói Năm' : 'Gói Tháng'}
          accent="#5b54e8"
        />
        <MetricCard
          label="Thời hạn còn lại"
          value={isActive ? `${daysLeft} ngày` : isExpired ? 'Đã hết hạn' : '—'}
          accent={daysLeft <= 15 ? '#c0392b' : daysLeft <= 30 ? '#9a6b16' : '#0d8a5a'}
        />
        <MetricCard
          label="Phí subscription"
          value={fee > 0 ? formatVnd(fee) : '—'}
          accent="#10111a"
        />
      </div>

      {/* Advisory Banners */}
      {isPendingApproval && isActive && (
        <div className="flex items-start gap-3 rounded-[11px] border border-brand-border bg-brand-soft/30 p-4 text-[13px] leading-relaxed text-ink shadow-sm">
          <IconShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <div className="font-bold text-brand-strong">Giấy phép đã được ghi nhận và kích hoạt thành công</div>
            <div className="mt-0.5 text-muted">
              Gói License của trạm đã có hiệu lực trên hệ thống. Hồ sơ trạm đang trong hàng đợi phê duyệt hành chính lần cuối của Quản trị viên trước khi hiển thị cho tài xế tìm kiếm.
            </div>
          </div>
        </div>
      )}

      {isActive && daysLeft <= 30 && (
        <div className="flex items-start gap-3 rounded-[11px] border border-warn-border bg-warn-soft p-4 text-[13px] leading-relaxed text-warn-deep shadow-sm">
          <IconClock size={20} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <div className="font-bold">
              {daysLeft < 0 ? `Giấy phép đã quá hạn ${-daysLeft} ngày` : `Gói License sắp hết hạn sau ${daysLeft} ngày`}
            </div>
            <div className="mt-0.5 text-warn-deep/90">
              Vui lòng hoàn tất thanh toán gia hạn ngoài nền tảng với Quản trị viên để duy trì trạng thái hoạt động liên tục cho trạm sạc của bạn.
            </div>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="flex items-start gap-3 rounded-[11px] border border-warn-border bg-warn-soft p-4 text-[13px] leading-relaxed text-warn-deep shadow-sm">
          <IconAlertTriangle size={20} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <div className="font-bold text-ink">Gói Giấy phép đang bị tạm ngưng (Suspended)</div>
            <div className="mt-0.5 text-muted">
              Trạm đang tạm thời bị ẩn khỏi ứng dụng tìm kiếm của tài xế và tạm dừng nhận đặt chỗ mới. <span className="font-semibold text-ink">Các phiên sạc đang diễn ra và lịch đặt chỗ đã thanh toán trước đó vẫn tiếp tục hoàn thành bình thường mà không bị ảnh hưởng.</span>
            </div>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="flex items-start gap-3 rounded-[11px] border border-bad-border bg-bad-soft p-4 text-[13px] leading-relaxed text-bad-deep shadow-sm">
          <IconAlertTriangle size={20} className="mt-0.5 shrink-0 text-bad" />
          <div>
            <div className="font-bold">Giấy phép vận hành đã hết hạn</div>
            <div className="mt-0.5 text-bad-deep/90">
              Trạm sạc đang tạm thời bị ẩn khỏi ứng dụng tìm kiếm của tài xế (theo quy tắc BR-STA-01). Các phiên sạc đang chạy vẫn được bảo đảm hoàn thành. Vui lòng liên hệ Quản trị viên để ghi nhận kỳ hạn mới.
            </div>
          </div>
        </div>
      )}

      {/* Main Content Split: Current License Details & Guidelines */}
      <div className="grid gap-[13px] md:grid-cols-2">
        {/* Current Active License Details */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-soft text-brand">
                  <IconShield size={22} />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-ink">
                    {isYear ? 'Gói Năm (1 năm lịch)' : 'Gói Tháng (1 tháng lịch)'}
                  </div>
                  <div className="text-[12px] font-mono text-faint">Mã License: <span className="font-bold text-brand">{license.licenseCode || license.id}</span></div>
                </div>
              </div>
              <StatusPill tone={meta.tone} label={meta.label} />
            </div>

            <div className="flex flex-col gap-3 text-[13px]">
              <DetailRow label="Trạm sạc áp dụng" value={station?.name || license.stationName || license.stationId} />
              <DetailRow label="Mã trạm" value={station?.stationCode || license.stationId} isMono />
              <DetailRow label="Ngày bắt đầu hiệu lực" value={startDate ? formatDateVn(startDate) : '—'} />
              <DetailRow label="Ngày kết thúc / Hết hạn" value={expiryDate ? formatDateVn(expiryDate) : '—'} isBold />
              <DetailRow label="Phí subscription đã ghi nhận" value={fee > 0 ? formatVnd(fee) : '—'} isBrand />
            </div>
          </div>

          <div className="mt-5 rounded-[8px] border border-hairline bg-surface-2 p-2.5 text-[11.5px] text-muted">
            Kỳ hạn hiện tại: <span className="font-semibold text-ink">{startDate ? formatDateVn(startDate) : '—'}</span> → <span className="font-semibold text-ink">{expiryDate ? formatDateVn(expiryDate) : '—'}</span>
          </div>
        </Card>

        {/* Operational Guidelines & Regulations */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[14px] font-bold text-ink border-b border-hairline pb-3">
              <IconInfo size={18} className="text-brand" />
              <span>Bảng giá & Quy định gia hạn</span>
            </div>

            {/* Pricing Packages Box */}
            <div className="mb-3.5 grid grid-cols-2 gap-2">
              <div className="rounded-[8px] border border-line-2 bg-surface-2 p-2.5">
                <div className="text-[11px] font-bold text-ink">Gói Tháng (1 tháng)</div>
                <div className="mt-0.5 text-[13px] font-extrabold text-ink">500.000 đ</div>
                <div className="text-[10px] text-muted">Linh hoạt theo tháng</div>
              </div>
              <div className="rounded-[8px] border border-brand bg-brand-soft/20 p-2.5 relative">
                <span className="absolute -top-2 right-1.5 rounded-full bg-brand px-1.5 py-0.2 text-[9.5px] font-bold text-white">
                  -16.7%
                </span>
                <div className="text-[11px] font-bold text-brand">Gói Năm (1 năm)</div>
                <div className="mt-0.5 text-[13px] font-extrabold text-brand">5.000.000 đ</div>
                <div className="text-[10px] text-brand-strong">Tiết kiệm 1.000.000 đ</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-[12px] leading-relaxed text-body">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>
                  <b>Thanh toán ngoài nền tảng:</b> Việc mua mới và gia hạn giấy phép được thực hiện trực tiếp giữa chủ trạm và đơn vị điều hành.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>
                  <b>Ghi nhận hệ thống:</b> Sau khi xác nhận giao dịch, Quản trị viên sẽ tạo kỳ hạn mới trên hệ thống để trạm vận hành liên tục.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                <span>
                  <b>Quyền hiển thị tìm kiếm:</b> Khi License hết hạn, trạm sẽ tạm thời ngưng nhận đặt chỗ mới cho tới khi gia hạn thành công (BR-STA-01).
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 rounded-[9px] border border-brand-border bg-brand-soft/20 p-2.5 text-[11.5px] text-brand-strong">
            Cần gia hạn hoặc nâng cấp gói? Vui lòng liên hệ Quản trị viên hệ thống ChargeOps.
          </div>
        </Card>
      </div>

      {/* License History Section */}
      {pastLicenses.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-hairline px-4 py-3 bg-surface-2 flex items-center justify-between">
            <div className="text-[13px] font-bold text-ink">
              Lịch sử các kỳ hạn License của trạm ({pastLicenses.length})
            </div>
            <span className="text-[11px] text-faint">Bao gồm các kỳ hạn trước và kỳ hạn chờ</span>
          </div>

          <div className="divide-y divide-hairline">
            {pastLicenses.map((h) => {
              const hMeta = LICENSE_STATUS[h.status] || { label: h.status, tone: 'neutral' };
              const hYear = String(h.plan).toUpperCase() === 'YEARLY';
              const hStart = h.startAt || h.startDate;
              const hExp = h.expiresAt || h.expiryDate;
              return (
                <div key={h.id} className="flex items-center justify-between px-4 py-3 text-[12.5px] transition-colors hover:bg-surface-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11.5px] font-bold text-brand">{h.licenseCode || h.id}</span>
                    <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-body">
                      {hYear ? 'Gói Năm' : 'Gói Tháng'}
                    </span>
                    <span className="text-muted">
                      {hStart ? formatDateVn(hStart) : '—'} → <span className="font-semibold text-ink">{hExp ? formatDateVn(hExp) : '—'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-ink">
                      {h.feeAmount ? formatVnd(h.feeAmount) : '—'}
                    </span>
                    <StatusPill tone={hMeta.tone} label={hMeta.label} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  isMono,
  isBold,
  isBrand,
}: {
  label: string;
  value?: string | number | null;
  isMono?: boolean;
  isBold?: boolean;
  isBrand?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-hairline pb-2.5">
      <span className="text-muted">{label}</span>
      <span
        className={`text-right ${isMono ? 'font-mono' : ''} ${isBold ? 'font-bold text-ink' : ''} ${
          isBrand ? 'font-mono font-bold text-brand' : 'text-ink font-medium'
        }`}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}
