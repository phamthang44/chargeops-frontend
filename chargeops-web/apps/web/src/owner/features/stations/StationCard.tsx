import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  AMENITY_EMOJI,
  STATION_STATUS,
  formatDateVn,
  type LicenseSummary,
  type Station,
} from '@chargeops/api';
import { Card, IconClock, StatusPill } from '@chargeops/ui';
import { AmenitiesModal } from './AmenitiesModal';
import { StationTimelineModal } from './StationTimelineModal';

function formatLicense(license: string | LicenseSummary | null | undefined): string {
  if (!license) return '—';
  if (typeof license === 'string') return license;
  if (typeof license === 'object') {
    const planText = license.plan === 'YEARLY' ? 'Gói Năm' : license.plan === 'MONTHLY' ? 'Gói Tháng' : license.plan || '—';
    if (license.expiresAt) {
      return `${planText} · hết hạn ${formatDateVn(license.expiresAt)}`;
    }
    return planText;
  }
  return '—';
}

/** One station card — active shows stats; pending/rejected show a status note. */
export function StationCard({ station }: { station: Station }) {
  const { t } = useTranslation('owner');
  const meta = STATION_STATUS[station.status] ?? { label: station.status, tone: 'neutral' as const };
  const [editAmenities, setEditAmenities] = useState(false);
  const [viewTimeline, setViewTimeline] = useState(false);
  const amenities = station.amenities ?? [];

  const cityName = station.city || station.provinceName || '';
  const fullAddress =
    station.address ||
    [station.addressLine, station.wardName, station.provinceName].filter(Boolean).join(', ') ||
    station.addressLine ||
    '—';

  const totalChargers = station.chargerCount ?? station.plannedChargePointCount ?? 0;
  const onlineChargers = station.onlineCount ?? 0;
  const isActive = station.status === 'active' || station.status === 'ACTIVE';
  const isPending = station.status === 'pending' || station.status === 'PENDING_APPROVAL';
  const isRejected = station.status === 'rejected' || station.status === 'REJECTED';

  return (
    <Card className="p-[17px]">
      <div className="mb-3 flex items-start justify-between gap-2.5">
        <div>
          <div className="text-[16px] font-bold">{station.name}</div>
          <div className="mt-0.5 font-mono text-[12px] text-faint">
            {station.stationCode || station.id} {cityName ? `· ${cityName}` : ''}
          </div>
        </div>
        <StatusPill tone={meta.tone} label={meta.label} />
      </div>

      {isActive && (
        <div className="mb-[13px] grid grid-cols-3 gap-[9px]">
          <MiniStat label={t('stations.card.bookingsToday')} value={String(station.bookingsToday ?? 0)} />
          <MiniStat label={t('stations.card.chargersOnline')} value={`${onlineChargers}/${totalChargers}`} />
          <MiniStat label={t('stations.card.utilization')} value={`${station.utilizationPct ?? 0}%`} />
        </div>
      )}

      <div className="flex flex-col gap-2 text-[12.5px] font-medium text-body">
        <div className="flex justify-between border-b border-hairline pb-[7px]">
          <span className="text-faint">{t('stations.card.addressLabel')}</span>
          <span className="text-right">{fullAddress}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-faint">{t('stations.card.licenseLabel')}</span>
          <span>{formatLicense(station.licenseSummary)}</span>
        </div>
      </div>

      {/* Owner-managed amenities (FR10-adjacent self-service) */}
      {isActive && (
        <div className="mt-3 border-t border-hairline pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
              {t('stations.card.amenitiesLabel')}
            </span>
            <button
              type="button"
              onClick={() => setEditAmenities(true)}
              className="text-[12px] font-semibold text-owner hover:underline"
            >
              {amenities.length ? t('stations.card.editAmenities') : t('stations.card.addAmenities')}
            </button>
          </div>
          {amenities.length === 0 ? (
            <span className="text-[12px] text-faint">{t('stations.card.noAmenities')}</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 rounded-full border border-line-3 bg-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-body"
                >
                  <span className="text-[13px] leading-none">{AMENITY_EMOJI[a]}</span>
                  {t(`stations.amenities.${a}`)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {isRejected && station.rejectionReason && (
        <div className="mt-3 flex gap-2 rounded-[9px] border border-bad-border bg-bad-soft px-3 py-2.5 text-[11.5px] leading-[1.5] font-medium text-bad-deep">
          <span>
            {t('stations.card.rejectionReason', { reason: station.rejectionReason })}
          </span>
        </div>
      )}
      {isPending && (
        <div className="mt-3 flex items-center gap-2 rounded-[9px] border border-warn-border bg-warn-soft px-3 py-2.5 text-[11.5px] leading-[1.5] font-medium text-warn-deep">
          <IconClock size={15} className="shrink-0" />
          <span>{t('stations.card.pendingHelp')}</span>
        </div>
      )}

      {/* Button to view approval/status timeline */}
      <button
        type="button"
        onClick={() => setViewTimeline(true)}
        className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-line-2 bg-surface-2 py-2 text-[12px] font-semibold text-body transition-colors hover:border-brand hover:bg-surface-3 hover:text-brand"
      >
        <IconClock size={14} className="text-muted" />
        <span>{t('stations.card.viewTimeline', { defaultValue: 'Xem tiến trình duyệt & lịch sử' })}</span>
      </button>

      <AmenitiesModal station={station} open={editAmenities} onClose={() => setEditAmenities(false)} />
      <StationTimelineModal station={station} open={viewTimeline} onClose={() => setViewTimeline(false)} />
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[9px] border border-line-3 p-2.5">
      <div className="text-[9px] font-semibold uppercase tracking-[0.05em] text-faint">{label}</div>
      <div className="mt-[3px] text-[17px] font-bold">{value}</div>
    </div>
  );
}
