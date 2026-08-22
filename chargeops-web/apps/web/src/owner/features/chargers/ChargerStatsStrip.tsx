import { useTranslation } from 'react-i18next';
import { MetricCard } from '@chargeops/ui';
import type { ChargePointGroup } from './ChargerTable';
import { effectiveConnectorStatus } from './chargerStatus';

/**
 * Five-metric summary above the charger list. Counts are taken over the
 * *effective* connector status (BR-CHG-01), so ports on an offline/suspended
 * device are reported as offline here too — otherwise the strip would claim
 * capacity that cannot actually accept a booking.
 */
export function ChargerStatsStrip({ groups }: { groups: ChargePointGroup[] }) {
  const { t } = useTranslation('owner');

  const connectors = groups.flatMap(({ chargePoint, connectors: list }) =>
    list.map((c) => ({
      ...c,
      runtimeStatus: effectiveConnectorStatus(chargePoint.provisioningStatus, chargePoint.operationalStatus, c.runtimeStatus),
    })),
  );

  const available = connectors.filter((c) => c.runtimeStatus === 'AVAILABLE');
  const inuse = connectors.filter((c) => c.runtimeStatus === 'IN_USE').length;
  const offline = connectors.filter((c) => c.runtimeStatus === 'OFFLINE').length;
  const avgUtil = available.length
    ? Math.round(available.reduce((s, c) => s + (c.utilizationPct ?? 0), 0) / available.length)
    : 0;
  const sessions = connectors.reduce((s, c) => s + (c.sessionsToday ?? 0), 0);

  return (
    <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-3 xl:grid-cols-5">
      <MetricCard label={t('connectors.stats.total')} value={String(connectors.length)} accent="#5b54e8" />
      <MetricCard label={t('connectors.stats.available')} value={String(available.length)} accent="#12a150" />
      <MetricCard label={t('connectors.stats.inuse')} value={String(inuse)} accent="#5b54e8" />
      <MetricCard label="OFFLINE" value={String(offline)} accent="#c0392b" />
      <MetricCard label={t('connectors.stats.sessions')} value={String(sessions)} sub={t('connectors.stats.sessionsSub', { util: avgUtil })} accent="var(--color-ink)" />
    </div>
  );
}
