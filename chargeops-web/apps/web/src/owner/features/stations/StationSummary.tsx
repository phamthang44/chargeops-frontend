import { useTranslation } from 'react-i18next';
import { MetricCard } from '@chargeops/ui';
import { isStationDriverEligible, type Station } from '@chargeops/api';

/** Four-metric strip above the station grid. */
export function StationSummary({ stations }: { stations: Station[] }) {
  const { t } = useTranslation('owner');
  const active = stations.filter((s) => s.status === 'active' || s.status === 'ACTIVE');
  const eligibleCount = stations.filter((s) =>
    isStationDriverEligible(s.status, s.licenseSummary, new Date(), {
      actualChargePointCount: s.actualChargePointCount ?? s.chargerCount,
      onlineChargePointCount: s.onlineActualChargePointCount ?? s.onlineChargePointCount ?? s.onlineCount,
      chargerCount: s.actualChargePointCount ?? s.chargerCount,
      onlineCount: s.onlineActualChargePointCount ?? s.onlineChargePointCount ?? s.onlineCount,
    }).isEligible,
  ).length;
  const pending = stations.filter((s) => s.status === 'pending' || s.status === 'PENDING_APPROVAL').length;
  const chargers = active.reduce(
    (n, s) => n + (s.actualChargePointCount ?? s.chargerCount ?? s.plannedChargePointCount ?? 0),
    0,
  );
  const online = active.reduce(
    (n, s) => n + (s.onlineActualChargePointCount ?? s.onlineChargePointCount ?? s.onlineCount ?? 0),
    0,
  );

  return (
    <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-4">
      <MetricCard label={t('stations.summary.total', { defaultValue: 'Tổng số trạm' })} value={String(stations.length)} accent="#5b54e8" />
      <MetricCard
        label={t('stations.summary.driverEligible', { defaultValue: 'Đang nhận khách' })}
        value={`${eligibleCount}/${active.length}`}
        accent="#0d8a5a"
      />
      <MetricCard label={t('stations.summary.pending', { defaultValue: 'Chờ duyệt' })} value={String(pending)} accent="#9a6b16" />
      <MetricCard label={t('stations.summary.online', { defaultValue: 'Trụ sạc Online' })} value={`${online}/${chargers}`} accent="var(--color-ink)" />
    </div>
  );
}
