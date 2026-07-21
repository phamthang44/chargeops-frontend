import { useTranslation } from 'react-i18next';
import { formatVndCompact, type BookingSummary } from '@chargeops/api';
import { MetricCard } from '@chargeops/ui';

/** Five-metric strip above the bookings table. */
export function BookingSummaryStrip({ summary }: { summary: BookingSummary }) {
  const { t } = useTranslation('owner');
  const active = summary.byStatus.confirmed + summary.byStatus.checkedin + summary.byStatus.charging;
  return (
    <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-3 xl:grid-cols-5">
      <MetricCard label={t('bookings.metrics.totalBookings')} value={String(summary.total)} accent="#5b54e8" />
      <MetricCard label={t('bookings.metrics.activeBookings')} value={String(active)} sub={t('bookings.metrics.activeSub')} accent="#12a150" />
      <MetricCard label={t('bookings.metrics.completed')} value={String(summary.byStatus.completed)} accent="var(--color-ink)" />
      <MetricCard label={t('bookings.metrics.cancelled')} value={String(summary.byStatus.cancelled)} accent="#c0392b" />
      <MetricCard label={t('bookings.metrics.grossRevenue')} value={formatVndCompact(summary.grossVnd)} sub={t('bookings.metrics.revenueSub')} accent="#0d8a5a" />
    </div>
  );
}
