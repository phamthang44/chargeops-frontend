import { useTranslation } from 'react-i18next';
import { MetricCard } from '@chargeops/ui';
import type { Station } from '@chargeops/api';

/** Four-metric strip above the station grid. */
export function StationSummary({ stations }: { stations: Station[] }) {
  const { t } = useTranslation('owner');
  const active = stations.filter((s) => s.status === 'active' || s.status === 'ACTIVE');
  const pending = stations.filter((s) => s.status === 'pending' || s.status === 'PENDING_APPROVAL').length;
  const chargers = active.reduce((n, s) => n + (s.chargerCount ?? s.plannedChargePointCount ?? 0), 0);
  const online = active.reduce((n, s) => n + (s.onlineCount ?? 0), 0);

  return (
    <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-4">
      <MetricCard label={t('stations.summary.total')} value={String(stations.length)} accent="#5b54e8" />
      <MetricCard label={t('stations.summary.active')} value={String(active.length)} accent="#12a150" />
      <MetricCard label={t('stations.summary.pending')} value={String(pending)} accent="#9a6b16" />
      <MetricCard label={t('stations.summary.online')} value={`${online}/${chargers}`} accent="var(--color-ink)" />
    </div>
  );
}
