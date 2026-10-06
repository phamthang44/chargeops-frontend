import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatTimeVn, useApi, type StaffStationOverview } from '@chargeops/api';
import { KpiCard, PageHeader, SidePanel, Skeleton, type SidePanelRow } from '@chargeops/ui';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
import { useStaffStation } from '../context/StaffStationContext';
import { useStaffEquipment } from '../hooks/useStaffEquipment';

/** Local-day boundaries (ISO) so "today" matches the operator's clock. */
function todayRange(): { from: string; to: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

/**
 * Ops-only station overview (Ops-05). Reads the staff-scoped overview
 * (`/staff/stations/{id}`) — no revenue, licence or analytics DTO is touched by
 * this screen, so there is nothing financial to leak via devtools.
 */
export function Dashboard() {
  const { t } = useTranslation('staff');
  const api = useApi();
  const navigate = useNavigate();
  const { selectedStationId, currentStation } = useStaffStation();
  const equipment = useStaffEquipment(selectedStationId || undefined);
  const range = todayRange();

  const overviewQ = useQuery<StaffStationOverview>({
    queryKey: ['staff', 'overview', selectedStationId],
    queryFn: () => api.staffOperations.overview(selectedStationId as string),
    enabled: Boolean(selectedStationId),
  });

  // One page of today's bookings: `total` feeds the KPI, `items` the panel.
  const bookingsQ = useQuery({
    queryKey: ['staff', 'bookings', 'today', selectedStationId, range.from, range.to],
    queryFn: () =>
      api.staffOperations.listBookings(selectedStationId as string, {
        from: range.from,
        to: range.to,
        page: 0,
        size: 5,
      }),
    enabled: Boolean(selectedStationId),
  });

  const isLoading = overviewQ.isLoading || bookingsQ.isLoading || equipment.isLoading;
  const error = overviewQ.error || bookingsQ.error || equipment.error;

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={
          overviewQ.data
            ? t('dashboard.subtitle', {
                station: overviewQ.data.name,
                status: t(`stationStatus.${overviewQ.data.operationalStatus}`),
              })
            : currentStation?.name || t('dashboard.subtitleFallback')
        }
      />

      {error ? (
        <ApiErrorState
          error={error}
          eyebrow={t('dashboard.error.eyebrow', { defaultValue: 'Bảng điều khiển' })}
          title={t('dashboard.error.title', { defaultValue: 'Không thể tải bảng điều khiển' })}
          onRetry={() => {
            overviewQ.refetch();
            bookingsQ.refetch();
            equipment.refetch();
          }}
          isRetrying={overviewQ.isFetching || bookingsQ.isFetching}
        />
      ) : isLoading ? (
        <DashboardSkeleton />
      ) : (
        <DashboardBody
          overview={overviewQ.data}
          todayTotal={bookingsQ.data?.total ?? 0}
          todayRows={bookingsQ.data?.items ?? []}
          availableConnectors={
            equipment.connectors.filter((c) => c.runtimeStatus === 'AVAILABLE').length
          }
          connectorCount={equipment.connectors.length}
          offlineConnectors={equipment.offlineConnectors}
          onAllBookings={() => navigate('../bookings')}
          onAllChargers={() => navigate('../chargers')}
        />
      )}
    </>
  );
}

function DashboardBody({
  overview,
  todayTotal,
  todayRows,
  availableConnectors,
  connectorCount,
  offlineConnectors,
  onAllBookings,
  onAllChargers,
}: {
  overview?: StaffStationOverview;
  todayTotal: number;
  todayRows: { bookingId: string; bookingCode?: string; startAt: string; endAt: string; driverDisplayName: string; connectorCode?: string; status: string }[];
  availableConnectors: number;
  connectorCount: number;
  offlineConnectors: { id: string; code: string; runtimeStatus: string }[];
  onAllBookings: () => void;
  onAllChargers: () => void;
}) {
  const { t } = useTranslation('staff');

  const bookingRows: SidePanelRow[] =
    todayRows.length === 0
      ? [{ label: t('dashboard.panel.noBookings'), value: '' }]
      : todayRows.map((b) => ({
          label: `${b.bookingCode || b.bookingId} · ${formatTimeVn(b.startAt)}`,
          value: b.driverDisplayName,
        }));

  const incidentRows: SidePanelRow[] =
    offlineConnectors.length === 0
      ? [{ label: t('dashboard.panel.noIncidents'), value: '' }]
      : offlineConnectors.map((c) => ({
          label: c.code || c.id,
          value: t('runtimeStatus.OFFLINE'),
          dotClass: 'bg-bad',
          valueClass: 'text-bad',
        }));

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        <KpiCard
          label={t('dashboard.kpi.bookingsToday')}
          value={String(todayTotal)}
          delta={t('dashboard.kpi.bookingsTodaySub')}
          deltaClass={todayTotal > 0 ? 'text-brand' : 'text-faint'}
        />
        <KpiCard
          label={t('dashboard.kpi.chargePoints')}
          value={String(overview?.chargePointCount ?? 0)}
          delta={
            overview
              ? t('dashboard.kpi.chargePointsSub', {
                  status: t(`stationStatus.${overview.operationalStatus}`),
                })
              : undefined
          }
          deltaClass="text-faint"
        />
        <KpiCard
          label={t('dashboard.kpi.connectors')}
          value={String(connectorCount)}
          delta={t('dashboard.kpi.connectorsSub', { available: availableConnectors })}
          deltaClass={availableConnectors === connectorCount ? 'text-good' : 'text-warn'}
        />
        <KpiCard
          label={t('dashboard.kpi.openIncidents')}
          value={String(offlineConnectors.length)}
          delta={
            offlineConnectors.length > 0
              ? t('dashboard.kpi.openIncidentsSub')
              : t('dashboard.kpi.noIncidents')
          }
          deltaClass={offlineConnectors.length > 0 ? 'text-bad' : 'text-good'}
        />
      </div>

      <div className="grid gap-[13px] lg:grid-cols-2">
        <SidePanel
          title={t('dashboard.panel.todayBookings')}
          link={t('dashboard.panel.allBookingsLink')}
          onLink={onAllBookings}
          rows={bookingRows}
        />
        <SidePanel
          title={t('dashboard.panel.offlineConnectors')}
          link={t('dashboard.panel.allChargersLink')}
          onLink={onAllChargers}
          rows={incidentRows}
          tone={offlineConnectors.length > 0 ? 'warn' : 'white'}
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
        <Skeleton className="h-[190px] rounded-card" />
        <Skeleton className="h-[190px] rounded-card" />
      </div>
    </>
  );
}
