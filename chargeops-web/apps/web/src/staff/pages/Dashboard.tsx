import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TICKET_STATUS, useApi, type StaffDashboard as StaffDashboardData } from '@chargeops/api';
import { Card, KpiCard, PageHeader, SidePanel, Skeleton, type SidePanelRow } from '@chargeops/ui';

/**
 * Ops-only — no revenue, license, or analytics anywhere on this screen or its
 * query. Station staff hit `dashboard.staff()`, a separate endpoint/DTO from
 * the owner dashboard, so there is nothing financial to leak via devtools
 * regardless of what this component chooses to render.
 */
export function Dashboard() {
  const { t } = useTranslation('staffDashboard');
  const navigate = useNavigate();
  const api = useApi();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'staff'],
    queryFn: () => api.dashboard.staff(),
  });

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('loadError', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <DashboardBody data={data} onManageChargers={() => navigate('../chargers')} onAllBookings={() => navigate('../bookings')} onAllTickets={() => navigate('../tickets')} />
      )}
    </>
  );
}

function DashboardBody({
  data,
  onManageChargers,
  onAllBookings,
  onAllTickets,
}: {
  data: StaffDashboardData;
  onManageChargers: () => void;
  onAllBookings: () => void;
  onAllTickets: () => void;
}) {
  const { t } = useTranslation('staffDashboard');
  const { kpis, chargers, upcomingBookings, recentTickets } = data;

  const chargerRow = (c: StaffDashboardData['chargers'][number]): SidePanelRow => {
    const status = String(c.runtimeStatus || '').toUpperCase().replace(/[-_]/g, '');
    return status === 'AVAILABLE'
      ? { label: `${c.id} · ${c.name}`, value: t('charger.available'), dotClass: 'bg-good', valueClass: 'text-good' }
      : status === 'INUSE'
        ? { label: `${c.id} · ${c.name}`, value: t('charger.inuse'), dotClass: 'bg-brand', valueClass: 'text-brand' }
        : { label: `${c.id} · ${c.name}`, value: t('charger.offline'), dotClass: 'bg-bad', valueClass: 'text-bad' };
  };

  const TONE_CLASS: Record<string, string> = { good: 'text-good', warn: 'text-warn', bad: 'text-bad', brand: 'text-brand', neutral: 'text-muted', ink: 'text-ink' };

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        <KpiCard
          label={t('kpi.bookingsToday')}
          value={String(kpis.bookingsToday)}
          delta={t('kpi.bookingsDelta', { count: kpis.bookingsDelta })}
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
          label={t('kpi.openTickets')}
          value={String(kpis.openTickets)}
          delta={t('kpi.openTicketsSub')}
          deltaClass={kpis.openTickets > 0 ? 'text-warn' : 'text-faint'}
        />
        <KpiCard
          label={t('kpi.pendingCheckins')}
          value={String(kpis.pendingCheckins)}
          delta={t('kpi.pendingCheckinsSub')}
          deltaClass="text-faint"
        />
      </div>

      <div className="grid gap-[13px] lg:grid-cols-2">
        <SidePanel title={t('panel.chargers')} link={t('panel.manageLink')} onLink={onManageChargers} rows={chargers.map(chargerRow)} />
        <SidePanel
          title={t('panel.upcomingBookings')}
          link={t('panel.allBookingsLink')}
          onLink={onAllBookings}
          rows={upcomingBookings.map((b) => ({ label: `${b.id} · ${b.startTime}`, value: b.driverName }))}
        />
      </div>

      <div className="mt-[13px]">
        <SidePanel
          title={t('panel.recentTickets')}
          link={t('panel.allTicketsLink')}
          onLink={onAllTickets}
          rows={
            recentTickets.length === 0
              ? [{ label: t('panel.noTickets'), value: '' }]
              : recentTickets.map((tk) => ({
                  label: `${tk.id} · ${tk.subject}`,
                  value: TICKET_STATUS[tk.status].label,
                  valueClass: TONE_CLASS[TICKET_STATUS[tk.status].tone],
                }))
          }
        />
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
      <div className="grid gap-[13px] lg:grid-cols-2">
        <Skeleton className="h-[170px] rounded-card" />
        <Skeleton className="h-[170px] rounded-card" />
      </div>
      <Skeleton className="mt-[13px] h-[150px] rounded-card" />
    </>
  );
}
