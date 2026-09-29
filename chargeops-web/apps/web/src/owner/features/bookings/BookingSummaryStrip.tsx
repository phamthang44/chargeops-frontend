import { useTranslation } from 'react-i18next';
import type { OwnerBookingSummary } from '@chargeops/api';
import { MetricCard } from '@chargeops/ui';

/** Five-metric count strip above the bookings table (BKG-047 / FE-15). */
export function BookingSummaryStrip({ summary }: { summary: OwnerBookingSummary }) {
  const { t } = useTranslation('owner');
  const active = summary.confirmed + summary.inSession;
  return (
    <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-3 xl:grid-cols-5">
      <MetricCard label={t('bookings.metrics.totalBookings')} value={String(summary.totalBookings)} accent="#5b54e8" />
      <MetricCard label={t('bookings.metrics.activeBookings')} value={String(active)} sub={t('bookings.metrics.activeSub')} accent="#12a150" />
      <MetricCard label={t('bookings.metrics.completed')} value={String(summary.completed)} accent="var(--color-ink)" />
      <MetricCard
        label={t('bookings.metrics.cancelled')}
        value={String(summary.cancelled)}
        sub={summary.noShow > 0 ? t('bookings.metrics.noShowSub', { count: summary.noShow }) : undefined}
        accent="#c0392b"
      />
      <MetricCard
        label={t('bookings.metrics.expired')}
        value={String(summary.expired)}
        sub={t('bookings.metrics.expiredSub')}
        accent="#e67e22"
      />
    </div>
  );
}
