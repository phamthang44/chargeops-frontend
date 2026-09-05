import { useTranslation } from 'react-i18next';
import {
  formatDateVn,
  isStationDriverEligible,
  resolveOperatingState,
  type LicenseSummary,
  type Station,
} from '@chargeops/api';
import {
  Button,
  Card,
  IconCheck,
  IconClock,
  IconPin,
  IconShieldAlert,
  StationStatusBadge,
} from '@chargeops/ui';

function formatLicense(license: string | LicenseSummary | null | undefined): {
  text: string;
  isExpired?: boolean;
  daysLeft?: number;
} {
  if (!license) return { text: 'Chưa có License' };
  if (typeof license === 'string') return { text: license };
  if (typeof license === 'object') {
    const planText =
      license.plan === 'YEARLY' ? 'Gói Năm' : license.plan === 'MONTHLY' ? 'Gói Tháng' : license.plan || '—';
    if (license.expiresAt) {
      const expDate = new Date(license.expiresAt);
      const isExpired = expDate.getTime() <= Date.now();
      const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        text: `${planText} · hết hạn ${formatDateVn(license.expiresAt)}`,
        isExpired,
        daysLeft,
      };
    }
    return { text: planText };
  }
  return { text: '—' };
}

export interface StationCardProps {
  station: Station;
  isActiveContext?: boolean;
  onSelectStation?: (stationId: string) => void;
  onOpenDetail?: (station: Station) => void;
  onChangeOperationalStatus?: (station: Station) => void;
}

/** One station card with fast actions and detail hub trigger. */
export function StationCard({
  station,
  isActiveContext = false,
  onSelectStation,
  onOpenDetail,
  onChangeOperationalStatus,
}: StationCardProps) {
  const { t } = useTranslation('owner');
  if (!station) return null;

  const rawStatus = station.status || 'ACTIVE';

  const cityName = station.city || station.provinceName || '';
  const fullAddress =
    station.address ||
    [station.addressLine, station.wardName, station.provinceName].filter(Boolean).join(', ') ||
    station.addressLine ||
    '—';

  const totalChargers =
    station.actualChargePointCount ??
    station.chargerCount ??
    station.plannedChargePointCount ??
    0;
  const onlineChargers =
    station.onlineActualChargePointCount ??
    station.onlineChargePointCount ??
    station.onlineCount ??
    0;
  const isActive = rawStatus === 'active' || rawStatus === 'ACTIVE';
  const isPending = rawStatus === 'pending' || rawStatus === 'PENDING_APPROVAL';
  const isRejected = rawStatus === 'rejected' || rawStatus === 'REJECTED';

  const licenseInfo = formatLicense(station.licenseSummary);
  const actualChargers =
    station.actualChargePointCount ??
    station.chargerCount;

  const eligibility = isStationDriverEligible(rawStatus, station.licenseSummary as any, new Date(), {
    actualChargePointCount: actualChargers,
    onlineChargePointCount: onlineChargers,
    chargerCount: actualChargers,
    onlineCount: onlineChargers,
  });

  const operatingState = resolveOperatingState(station);

  return (
    <Card
      className={`p-[18px] flex flex-col justify-between transition-shadow hover:shadow-md ${
        isActiveContext ? 'ring-2 ring-owner/30 border-owner' : ''
      }`}
    >
      <div>
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[16px] font-bold text-ink hover:text-owner transition-colors cursor-pointer truncate"
                onClick={() => onOpenDetail?.(station)}
                title={station.name}
              >
                {station.name}
              </span>
              {isActiveContext && (
                <span className="inline-flex items-center gap-1 rounded-full bg-owner-soft px-2 py-0.5 text-[10px] font-bold text-owner-deep shrink-0 border border-owner-border/40">
                  <IconCheck size={11} strokeWidth={2.4} />
                  <span>Đang chọn</span>
                </span>
              )}
            </div>
            <div className="mt-0.5 font-mono text-[12px] text-faint truncate">
              {station.stationCode || station.id} {cityName ? `· ${cityName}` : ''}
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-end">
            <StationStatusBadge
              status={rawStatus}
              eligibility={eligibility}
              operatingState={operatingState}
              variant="detailed"
            />
          </div>
        </div>

        {/* Metrics row when active */}
        {isActive && (
          <div className="mb-[13px] grid grid-cols-3 gap-[9px]">
            <MiniStat label={t('stations.card.bookingsToday')} value={String(station.bookingsToday ?? 0)} />
            <MiniStat label={t('stations.card.chargersOnline')} value={`${onlineChargers}/${totalChargers}`} />
            <MiniStat label={t('stations.card.utilization')} value={`${station.utilizationPct ?? 0}%`} />
          </div>
        )}

        {/* Warning Callout when Station is Active but License is Inactive */}
        {isActive && !eligibility.isEligible && (
          <div className="mb-3 rounded-[9px] border border-warn-border bg-warn-soft/50 p-2.5 text-[11.5px] leading-relaxed text-warn-deep">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <IconShieldAlert size={15} className="shrink-0 text-warn" />
              <span>Trạm đang tạm ẩn khỏi tìm kiếm tài xế</span>
            </div>
            <div className="mt-1 text-muted">
              {eligibility.details || 'Gói License của trạm chưa sẵn sàng để tiếp nhận đặt chỗ mới.'}
            </div>
          </div>
        )}

        {/* Operational Status Callout when PAUSED or MAINTENANCE */}
        {isActive && station.operationalStatus === 'PAUSED' && (
          <div className="mb-3 rounded-[9px] border border-bad-border bg-bad-soft/60 p-2.5 text-[11.5px] leading-relaxed text-bad-deep">
            <div className="flex items-center justify-between font-bold text-ink">
              <div className="flex items-center gap-1.5">
                <span>⏸️</span>
                <span>{t('stations.operationalStatus.PAUSED', { defaultValue: 'Trạm đang tạm dừng đón khách' })}</span>
              </div>
              {onChangeOperationalStatus && (
                <button
                  type="button"
                  onClick={() => onChangeOperationalStatus(station)}
                  className="text-[11px] font-semibold text-bad-deep underline hover:opacity-80 cursor-pointer"
                >
                  {t('stations.operationalModal.changeStatusBtn', { defaultValue: 'Đổi trạng thái' })}
                </button>
              )}
            </div>
            <div className="mt-1 text-muted">
              {station.operationalStatusReason || t('stations.operationalModal.pausedDesc', { defaultValue: 'Chủ trạm tạm ngừng đón khách.' })}
            </div>
          </div>
        )}

        {isActive && station.operationalStatus === 'MAINTENANCE' && (
          <div className="mb-3 rounded-[9px] border border-warn-border bg-warn-soft/60 p-2.5 text-[11.5px] leading-relaxed text-warn-deep">
            <div className="flex items-center justify-between font-bold text-ink">
              <div className="flex items-center gap-1.5">
                <span>🛠️</span>
                <span>{t('stations.operationalStatus.MAINTENANCE', { defaultValue: 'Trạm đang bảo trì' })}</span>
              </div>
              {onChangeOperationalStatus && (
                <button
                  type="button"
                  onClick={() => onChangeOperationalStatus(station)}
                  className="text-[11px] font-semibold text-warn-deep underline hover:opacity-80 cursor-pointer"
                >
                  {t('stations.operationalModal.changeStatusBtn', { defaultValue: 'Đổi trạng thái' })}
                </button>
              )}
            </div>
            <div className="mt-1 text-muted">
              {station.operationalStatusReason || t('stations.operationalModal.maintenanceDesc', { defaultValue: 'Trạm đang trong quá trình bảo trì kỹ thuật.' })}
            </div>
          </div>
        )}

        {/* Details snippet */}
        <div className="flex flex-col gap-2 text-[12.5px] font-medium text-body">
          <div className="flex justify-between border-b border-hairline pb-[7px]">
            <span className="text-faint flex items-center gap-1">
              <IconPin size={13} className="text-faint" />
              {t('stations.card.addressLabel')}
            </span>
            <span className="text-right truncate max-w-[230px] font-normal" title={fullAddress}>
              {fullAddress}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-faint">{t('stations.card.licenseLabel')}</span>
            <div className="flex items-center gap-1.5">
              <span className="font-normal">{licenseInfo.text}</span>
              {licenseInfo.daysLeft !== undefined && licenseInfo.daysLeft <= 30 && licenseInfo.daysLeft > 0 && (
                <span className="rounded-full bg-warn-soft px-2 py-0.2 text-[10px] font-bold text-warn-deep">
                  Còn {licenseInfo.daysLeft} ngày
                </span>
              )}
            </div>
          </div>
        </div>

        {isRejected && station.rejectionReason && (
          <div className="mt-3 flex gap-2 rounded-[9px] border border-bad-border bg-bad-soft px-3 py-2.5 text-[11.5px] leading-[1.5] font-medium text-bad-deep">
            <span>{t('stations.card.rejectionReason', { reason: station.rejectionReason })}</span>
          </div>
        )}
        {isPending && (
          <div className="mt-3 flex items-center gap-2 rounded-[9px] border border-warn-border bg-warn-soft px-3 py-2.5 text-[11.5px] leading-[1.5] font-medium text-warn-deep">
            <IconClock size={15} className="shrink-0" />
            <span>{t('stations.card.pendingHelp')}</span>
          </div>
        )}
      </div>

      {/* Card Action Buttons */}
      <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-3">
        <Button
          accent="owner"
          size="sm"
          className="flex-1"
          onClick={() => onOpenDetail?.(station)}
        >
          {t('stations.card.viewDetailBtn', { defaultValue: 'Xem chi tiết trạm' })}
        </Button>

        {isActive && onChangeOperationalStatus && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChangeOperationalStatus(station)}
            title="Đổi trạng thái vận hành trạm (Operating / Paused / Maintenance)"
          >
            {t('stations.operationalModal.changeStatusBtn', { defaultValue: 'Vận hành' })}
          </Button>
        )}

        {!isActiveContext && onSelectStation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectStation(station.id)}
            title="Chọn trạm này làm ngữ cảnh hoạt động hiện tại"
          >
            {t('stations.card.selectBtn', { defaultValue: 'Chọn quản lý' })}
          </Button>
        )}
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[9px] border border-line-3 p-2.5">
      <div className="text-[9px] font-semibold uppercase tracking-[0.05em] text-faint">{label}</div>
      <div className="mt-[3px] text-[17px] font-bold text-ink">{value}</div>
    </div>
  );
}
