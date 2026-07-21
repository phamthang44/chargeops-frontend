import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatVndCompact, useApi, type AdminDashboard } from '@chargeops/api';
import { Card, KpiCard, PageHeader, SidePanel, Skeleton, TrendChart } from '@chargeops/ui';

/** Admin dashboard — platform-wide; data from the service layer (mock now, REST later). */
export function Dashboard() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.dashboard.admin(),
  });

  return (
    <>
      <PageHeader
        title={t('console.nav.dashboard.title')}
        subtitle={t('console.nav.dashboard.subtitle')}
      />
      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('dashboard.error', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <DashboardBody data={data} />
      )}
    </>
  );
}

function DashboardBody({ data }: { data: AdminDashboard }) {
  const { t } = useTranslation('admin');
  const { kpis, actionQueue, topStations } = data;
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        <KpiCard
          label={t('dashboard.kpi.activeStations')}
          value={String(kpis.activeStations)}
          delta={t('dashboard.kpi.activeStationsDelta', { count: kpis.stationsDeltaWeek })}
          deltaClass="text-good"
        />
        <KpiCard
          label={t('dashboard.kpi.pendingApprovals')}
          value={String(kpis.pendingApprovals)}
          delta={t('dashboard.kpi.pendingApprovalsDelta', { count: kpis.newApprovalsToday })}
          deltaClass="text-warn"
        />
        <KpiCard
          label={t('dashboard.kpi.bookingsToday')}
          value={String(kpis.bookingsToday)}
          delta={t('dashboard.kpi.bookingsDelta', { pct: kpis.bookingsDeltaPct })}
          deltaClass="text-good"
        />
        <KpiCard
          label={t('dashboard.kpi.revenueMonth')}
          value={formatVndCompact(kpis.revenueMonthVnd).replace('tr', '')}
          suffix="tr"
          delta={t('dashboard.kpi.revenueDelta', { pct: kpis.revenueDeltaPct })}
          deltaClass="text-good"
        />
      </div>

      <div className="grid gap-[13px] lg:grid-cols-[1fr_340px]">
        <TrendChart
          title={t('dashboard.charts.trendTitle')}
          axis={['15/06', '28/06']}
          legend={[
            { label: t('dashboard.charts.trendLegend.revenue'), colorClass: 'bg-brand' },
            { label: t('dashboard.charts.trendLegend.bookings'), colorClass: 'bg-brand-tint' },
          ]}
        />
        <div className="flex flex-col gap-[13px]">
          <SidePanel
            title={t('dashboard.actionQueue.title')}
            tone="warn"
            link={t('dashboard.actionQueue.link')}
            rows={[
              { label: t('dashboard.actionQueue.pendingStations'), value: String(actionQueue.pendingStations), dotClass: 'bg-warn', valueClass: 'text-warn' },
              { label: t('dashboard.actionQueue.expiringLicenses'), value: t('dashboard.actionQueue.expiringLicensesVal', { count: actionQueue.expiringLicenses, days: actionQueue.expiringDaysMin }), dotClass: 'bg-warn', valueClass: 'text-warn' },
              { label: t('dashboard.actionQueue.expiredLicenses'), value: String(actionQueue.expiredLicenses), dotClass: 'bg-bad', valueClass: 'text-bad' },
              { label: t('dashboard.actionQueue.reportedFaults'), value: String(actionQueue.reportedFaults), dotClass: 'bg-bad', valueClass: 'text-bad' },
            ]}
          />
          <SidePanel
            title={t('dashboard.charts.stationRevenue')}
            link={t('dashboard.charts.stationRevenueLink')}
            rows={topStations.map((s, i) => ({
              label: s.name,
              value: formatVndCompact(s.revenueVnd),
              dotClass: i < 2 ? 'bg-brand' : 'bg-brand-tint',
            }))}
          />
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-card" />
        ))}
      </div>
      <div className="grid gap-[13px] lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-[260px] rounded-card" />
        <div className="flex flex-col gap-[13px]">
          <Skeleton className="h-[160px] rounded-card" />
          <Skeleton className="h-[150px] rounded-card" />
        </div>
      </div>
    </>
  );
}
