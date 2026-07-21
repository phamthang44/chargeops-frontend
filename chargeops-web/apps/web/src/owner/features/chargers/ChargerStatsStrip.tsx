import { useTranslation } from 'react-i18next';
import type { Charger } from '@chargeops/api';
import { MetricCard } from '@chargeops/ui';

/** Five-metric status summary above the charger table. */
export function ChargerStatsStrip({ chargers }: { chargers: Charger[] }) {
  const { t } = useTranslation('owner');
  const available = chargers.filter((c) => c.status === 'available');
  const maintenance = chargers.filter((c) => c.status === 'maintenance').length;
  const offline = chargers.filter((c) => c.status === 'offline').length;
  const avgUtil = available.length
    ? Math.round(available.reduce((s, c) => s + c.utilizationPct, 0) / available.length)
    : 0;
  const sessions = chargers.reduce((s, c) => s + c.sessionsToday, 0);

  return (
    <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-3 xl:grid-cols-5">
      <MetricCard label={t('chargers.stats.total')} value={String(chargers.length)} accent="#5b54e8" />
      <MetricCard label={t('chargers.stats.available')} value={String(available.length)} accent="#12a150" />
      <MetricCard label={t('chargers.stats.maintenance')} value={String(maintenance)} accent="#9a6b16" />
      <MetricCard label="OFFLINE" value={String(offline)} accent="#c0392b" />
      <MetricCard label={t('chargers.stats.sessions')} value={String(sessions)} sub={t('chargers.stats.sessionsSub', { util: avgUtil })} accent="#16171a" />
    </div>
  );
}
