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

  const totalChargePoints = groups.length;
  const available = connectors.filter((c) => c.runtimeStatus === 'AVAILABLE').length;
  const inuse = connectors.filter((c) => c.runtimeStatus === 'IN_USE').length;
  const offline = connectors.filter((c) => c.runtimeStatus === 'OFFLINE').length;
  const incidentCount = connectors.filter((c) => Boolean(c.activeIncidentId)).length;

  return (
    <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-3 xl:grid-cols-5">
      <MetricCard label={t('connectors.stats.chargePoints', 'TỔNG TRỤ SẠC')} value={String(totalChargePoints)} accent="#5b54e8" />
      <MetricCard label={t('connectors.stats.available', 'SẴN SÀNG')} value={String(available)} accent="#12a150" />
      <MetricCard label={t('connectors.stats.inuse', 'ĐANG SẠC')} value={String(inuse)} accent="#3b82f6" />
      <MetricCard label={t('connectors.stats.offline', 'NGOẠI TUYẾN')} value={String(offline)} accent="#f59e0b" />
      <MetricCard
        label={t('connectors.stats.incidents', 'CÓ SỰ CỐ')}
        value={String(incidentCount)}
        sub={incidentCount > 0 ? t('connectors.stats.needAction', 'Cần khắc phục') : t('connectors.stats.allNormal', 'Bình thường')}
        accent={incidentCount > 0 ? '#ef4444' : '#64748b'}
      />
    </div>
  );
}
