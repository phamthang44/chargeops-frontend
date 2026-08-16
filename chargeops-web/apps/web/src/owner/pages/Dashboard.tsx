import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formatDateVn, formatVndCompact, useApi, type OwnerDashboard } from '@chargeops/api';
import {
  Banner,
  Card,
  KpiCard,
  PageHeader,
  SidePanel,
  Skeleton,
  StatusPill,
  TrendChart,
  type SidePanelRow,
} from '@chargeops/ui';

/** Owner dashboard — data comes from the service layer (mock now, REST later). */
export function Dashboard() {
  const { t } = useTranslation('ownerDashboard');
  const api = useApi();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'owner'],
    queryFn: () => api.dashboard.owner(),
  });

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle', { station: 'Trạm Hà Đông', date: 'Thứ Bảy, 28/06/2026' })}
      />
      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('loadError', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <DashboardBody data={data} />
      )}
    </>
  );
}

function DashboardBody({ data }: { data: OwnerDashboard }) {
  const { t } = useTranslation('ownerDashboard');
  const { license, kpis, chargers, upcomingBookings } = data;

  const chargerRow = (c: OwnerDashboard['chargers'][number]): SidePanelRow =>
    c.runtimeStatus === 'available'
      ? { label: `${c.id} · ${c.name}`, value: `${c.utilizationPct}%`, dotClass: 'bg-good' }
      : c.runtimeStatus === 'inuse'
        ? { label: `${c.id} · ${c.name}`, value: t('charger.inuse'), dotClass: 'bg-brand', valueClass: 'text-brand' }
        : { label: `${c.id} · ${c.name}`, value: t('charger.offline'), dotClass: 'bg-bad', valueClass: 'text-bad' };

  const isLicActive = license.status === 'ACTIVE' || license.status === 'active';
  const isLicExpired = license.status === 'EXPIRED' || license.status === 'expired';
  const isLicExpiring = license.expiringSoon || license.status === 'expiring' || (license.daysLeft != null && license.daysLeft <= 30 && isLicActive);

  const licenseStatusLabel = isLicExpiring
    ? t('license.expiring', { defaultValue: 'Sắp hết hạn' })
    : isLicActive
      ? t('license.active', { defaultValue: 'Đang hoạt động' })
      : isLicExpired
        ? t('license.expired', { defaultValue: 'Đã hết hạn' })
        : String(license.status);

  return (
    <>
      {/* License banner (BR-STA-01: expiry hides the station from drivers) */}
      <Banner
        status="warning"
        title={t('license.label', { status: licenseStatusLabel })}
        description={t('license.detail', { date: formatDateVn(license.expiryDate), days: license.daysLeft })}
        action={<StatusPill tone="warn" label={t('license.renewalSoon')} />}
      />

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        <KpiCard
          label={t('kpi.bookingsToday')}
          value={String(kpis.bookingsToday)}
          delta={t('kpi.bookingsDelta', { count: kpis.bookingsDelta })}
          deltaClass="text-good"
        />
        <KpiCard
          label={t('kpi.revenueToday')}
          value={formatVndCompact(kpis.revenueTodayVnd).replace('tr', '')}
          suffix="tr"
          delta={t('kpi.revenueDelta', { percent: kpis.revenueDeltaPct })}
          deltaClass="text-good"
        />
        <KpiCard
          label={t('kpi.chargersOnline')}
          value={String(kpis.chargersOnline)}
          suffix={`/${kpis.chargersTotal}`}
          delta={kpis.offlineChargerNote ?? t('kpi.allOnline')}
          deltaClass={kpis.offlineChargerNote ? 'text-bad' : 'text-good'}
        />
        <KpiCard
          label={t('kpi.avgUtilization')}
          value={String(kpis.avgUtilizationPct)}
          suffix="%"
          delta={t('kpi.utilizationDelta', { points: kpis.utilizationDeltaPts })}
          deltaClass="text-good"
        />
      </div>

      {/* Chart + side panels */}
      <div className="grid gap-[13px] lg:grid-cols-[1fr_340px]">
        <TrendChart
          title={t('chart.title')}
          axis={['15/06', '28/06']}
          legend={[
            { label: t('chart.revenue'), colorClass: 'bg-brand' },
            { label: t('chart.bookings'), colorClass: 'bg-brand-tint' },
          ]}
        />
        <div className="flex flex-col gap-[13px]">
          <SidePanel title={t('panel.chargers')} link={t('panel.manageLink')} rows={chargers.map(chargerRow)} />
          <SidePanel
            title={t('panel.upcomingBookings')}
            link={t('panel.allLink')}
            rows={upcomingBookings.map((b) => ({
              label: `${b.id} · ${b.startTime}`,
              value: b.driverName,
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
      <Skeleton className="mb-[18px] h-[52px] w-full rounded-[11px]" />
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-card" />
        ))}
      </div>
      <div className="grid gap-[13px] lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-[260px] rounded-card" />
        <div className="flex flex-col gap-[13px]">
          <Skeleton className="h-[170px] rounded-card" />
          <Skeleton className="h-[150px] rounded-card" />
        </div>
      </div>
    </>
  );
}
