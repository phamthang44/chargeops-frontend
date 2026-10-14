import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatTimeVn, useApi, type OwnerOperationsSummary } from '@chargeops/api';
import {
  Button,
  IconRefreshCw,
  KpiCard,
  PageHeader,
  SidePanel,
  Skeleton,
  type SidePanelRow,
} from '@chargeops/ui';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
import { ResourceRetryButton, ResourceStateCard } from '../../shared/components/ResourceStateCard';

/** Owner operations dashboard (V1) — connects to /owner/dashboard/summary. */
export function Dashboard() {
  const { t, i18n } = useTranslation('ownerDashboard');
  const api = useApi();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard', 'owner'],
    queryFn: () => api.dashboard.owner(),
  });

  const todayFormatted = new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitleFormatted', {
          date: todayFormatted,
          defaultValue: `Tổng quan vận hành toàn bộ danh mục trạm · ${todayFormatted}`,
        })}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            icon={<IconRefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />}
          >
            <span>
              {isFetching
                ? t('actions.refreshing', { defaultValue: 'Đang cập nhật...' })
                : t('actions.refresh', { defaultValue: 'Làm mới' })}
            </span>
          </Button>
        }
      />
      {error ? (
        <ApiErrorState
          error={error}
          eyebrow={t('dashboard.error.eyebrow', { defaultValue: 'Bảng điều khiển' })}
          title={t('dashboard.error.title', { defaultValue: 'Không thể tải bảng điều khiển' })}
          missingEyebrow={t('dashboard.error.missingEyebrow', { defaultValue: 'Bảng điều khiển' })}
          missingTitle={t('dashboard.error.missingTitle', { defaultValue: 'Dashboard chưa được kết nối dữ liệu' })}
          missingDescription={t('dashboard.error.missingDescription', {
            defaultValue:
              'Endpoint của bảng điều khiển (owner/dashboard/summary) chưa được kết nối dữ liệu.',
          })}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading ? (
        <DashboardSkeleton />
      ) : !data ? (
        <ResourceStateCard
          tone="brand"
          eyebrow={t('dashboard.error.missingEyebrow', { defaultValue: 'Bảng điều khiển' })}
          title={t('dashboard.error.missingTitle', { defaultValue: 'Dashboard chưa được kết nối dữ liệu' })}
          description={t('dashboard.error.missingDescription', {
            defaultValue:
              'Endpoint của bảng điều khiển (owner/dashboard/summary) chưa được kết nối dữ liệu.',
          })}
          action={<ResourceRetryButton onClick={() => refetch()} isRetrying={isFetching} />}
        />
      ) : (
        <DashboardBody data={data} />
      )}
    </>
  );
}

function DashboardBody({ data }: { data: OwnerOperationsSummary }) {
  const { t } = useTranslation('ownerDashboard');
  const api = useApi();
  const navigate = useNavigate();

  // Upcoming confirmed bookings (max 5)
  const nowIso = new Date().toISOString();
  const upcomingQ = useQuery({
    queryKey: ['owner', 'bookings', 'upcoming'],
    queryFn: () =>
      api.ownerBookings.list({
        status: 'confirmed' as any,
        from: nowIso,
        sort: 'startAt,asc',
        windowMode: 'START_IN_WINDOW',
        pageSize: 5,
      }),
  });

  // Ticket status summary for owner action items
  const ticketsQ = useQuery({
    queryKey: ['owner', 'tickets', 'summary'],
    queryFn: () => api.tickets.summary({ role: 'owner' }),
  });

  const stations = data.stations ?? {
    totalStations: 0,
    activeStations: 0,
    visibleToDrivers: 0,
    pendingApproval: 0,
    onlineChargePoints: 0,
    totalChargePoints: 0,
  };

  const hardware = data.hardware ?? {
    totalConnectors: 0,
    availableConnectors: 0,
    chargingConnectors: 0,
    offlineConnectors: 0,
    unavailableConnectors: 0,
    sessionsToday: 0,
    averageUtilizationPercent: 0,
  };

  const upcomingItems = upcomingQ.data?.items ?? [];
  const upcomingRows: SidePanelRow[] =
    upcomingItems.length === 0
      ? [{ label: t('panel.noUpcoming', { defaultValue: 'Không có đặt chỗ sắp tới' }), value: '' }]
      : upcomingItems.map((b) => ({
          label: `${b.bookingCode || b.bookingId} · ${formatTimeVn(b.startAt)}`,
          value: b.driverDisplayName,
        }));

  const offlineCps = Math.max(0, stations.totalChargePoints - stations.onlineChargePoints);
  const openTickets = ticketsQ.data?.open ?? ticketsQ.data?.byStatus?.open ?? 0;

  const actionRows: SidePanelRow[] = [];
  if (stations.pendingApproval > 0) {
    actionRows.push({
      label: t('panel.pendingStations', { defaultValue: 'Hồ sơ trạm chờ duyệt' }),
      value: String(stations.pendingApproval),
      dotClass: 'bg-warn',
      valueClass: 'text-warn-deep font-bold',
    });
  }
  if (hardware.offlineConnectors > 0) {
    actionRows.push({
      label: t('panel.offlineConnectors', { defaultValue: 'Cổng sạc ngoại tuyến' }),
      value: String(hardware.offlineConnectors),
      dotClass: 'bg-bad',
      valueClass: 'text-bad font-bold',
    });
  }
  if (openTickets > 0) {
    actionRows.push({
      label: t('panel.openTickets', { defaultValue: 'Yêu cầu hỗ trợ đang mở' }),
      value: String(openTickets),
      dotClass: 'bg-brand',
      valueClass: 'text-brand font-bold',
    });
  }
  if (actionRows.length === 0) {
    actionRows.push({
      label: t('panel.noActionItems', { defaultValue: 'Không có việc tồn đọng' }),
      value: '✓',
      dotClass: 'bg-good',
      valueClass: 'text-good',
    });
  }

  return (
    <>
      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        <button
          type="button"
          onClick={() => navigate('/owner/stations?status=ACTIVE')}
          className="text-left w-full cursor-pointer transition hover:opacity-95"
        >
          <KpiCard
            label={t('kpi.activeStations', { defaultValue: 'Trạm đang mở' })}
            value={`${stations.activeStations}/${stations.totalStations}`}
            delta={
              stations.pendingApproval > 0
                ? t('kpi.pendingNote', {
                    count: stations.pendingApproval,
                    defaultValue: `${stations.pendingApproval} trạm chờ duyệt`,
                  })
                : t('kpi.allApproved', { defaultValue: 'Đã duyệt toàn bộ' })
            }
            deltaClass={stations.pendingApproval > 0 ? 'text-warn' : 'text-good'}
          />
        </button>

        <button
          type="button"
          onClick={() => navigate('/owner/chargers')}
          className="text-left w-full cursor-pointer transition hover:opacity-95"
        >
          <KpiCard
            label={t('kpi.chargersOnline', { defaultValue: 'Trụ sạc Online' })}
            value={`${stations.onlineChargePoints}/${stations.totalChargePoints}`}
            delta={
              offlineCps > 0
                ? t('kpi.chargersOffline', {
                    count: offlineCps,
                    defaultValue: `${offlineCps} trụ ngoại tuyến/bảo trì`,
                  })
                : t('kpi.allOnline', { defaultValue: 'Tất cả trụ đang hoạt động' })
            }
            deltaClass={offlineCps > 0 ? 'text-bad' : 'text-good'}
          />
        </button>

        <button
          type="button"
          onClick={() => navigate('/owner/chargers')}
          className="text-left w-full cursor-pointer transition hover:opacity-95"
        >
          <KpiCard
            label={t('kpi.connectorsAvailable', { defaultValue: 'Cổng khả dụng' })}
            value={`${hardware.availableConnectors}/${hardware.totalConnectors}`}
            delta={t('kpi.connectorsDelta', {
              charging: hardware.chargingConnectors,
              offline: hardware.offlineConnectors,
              defaultValue: `${hardware.chargingConnectors} đang sạc · ${hardware.offlineConnectors} ngoại tuyến`,
            })}
            deltaClass={hardware.offlineConnectors > 0 ? 'text-bad' : 'text-good'}
          />
        </button>

        <button
          type="button"
          onClick={() => navigate('/owner/sessions?range=today')}
          className="text-left w-full cursor-pointer transition hover:opacity-95"
        >
          <KpiCard
            label={t('kpi.sessionsToday', { defaultValue: 'Phiên sạc hôm nay' })}
            value={String(hardware.sessionsToday)}
            delta={t('kpi.utilizationDelta', {
              pct: Number(hardware.averageUtilizationPercent ?? 0).toFixed(1),
              defaultValue: `Hiệu suất: ${Number(hardware.averageUtilizationPercent ?? 0).toFixed(1)}%`,
            })}
            deltaClass="text-brand"
          />
        </button>
      </div>

      {/* Hardware Status Breakdown */}
      {hardware.totalConnectors > 0 && (
        <div className="mb-4 rounded-card border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
              {t('hardwareDistribution.title', {
                count: hardware.totalConnectors,
                defaultValue: `Tình trạng cổng sạc hạ tầng (${hardware.totalConnectors} cổng)`,
              })}
            </span>
            <div className="flex flex-wrap items-center gap-4 text-[12px] font-medium text-body">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-good" />
                <span className="text-muted">{t('hardwareDistribution.available', { defaultValue: 'Sẵn sàng' })}:</span>
                <strong className="font-semibold text-ink">{hardware.availableConnectors}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" />
                <span className="text-muted">{t('hardwareDistribution.charging', { defaultValue: 'Đang sạc' })}:</span>
                <strong className="font-semibold text-ink">{hardware.chargingConnectors}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-bad" />
                <span className="text-muted">{t('hardwareDistribution.offline', { defaultValue: 'Ngoại tuyến' })}:</span>
                <strong className="font-semibold text-ink">{hardware.offlineConnectors}</strong>
              </span>
              {hardware.unavailableConnectors > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warn" />
                  <span className="text-muted">{t('hardwareDistribution.maintenance', { defaultValue: 'Bảo trì' })}:</span>
                  <strong className="font-semibold text-ink">{hardware.unavailableConnectors}</strong>
                </span>
              )}
            </div>
          </div>
          {/* Visual Progress Bar */}
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-chip border border-line">
            {hardware.availableConnectors > 0 && (
              <div
                style={{ width: `${(hardware.availableConnectors / hardware.totalConnectors) * 100}%` }}
                className="bg-good transition-all duration-500"
                title={`${t('hardwareDistribution.available', { defaultValue: 'Sẵn sàng' })}: ${hardware.availableConnectors}`}
              />
            )}
            {hardware.chargingConnectors > 0 && (
              <div
                style={{ width: `${(hardware.chargingConnectors / hardware.totalConnectors) * 100}%` }}
                className="bg-brand transition-all duration-500"
                title={`${t('hardwareDistribution.charging', { defaultValue: 'Đang sạc' })}: ${hardware.chargingConnectors}`}
              />
            )}
            {hardware.offlineConnectors > 0 && (
              <div
                style={{ width: `${(hardware.offlineConnectors / hardware.totalConnectors) * 100}%` }}
                className="bg-bad transition-all duration-500"
                title={`${t('hardwareDistribution.offline', { defaultValue: 'Ngoại tuyến' })}: ${hardware.offlineConnectors}`}
              />
            )}
            {hardware.unavailableConnectors > 0 && (
              <div
                style={{ width: `${(hardware.unavailableConnectors / hardware.totalConnectors) * 100}%` }}
                className="bg-warn transition-all duration-500"
                title={`${t('hardwareDistribution.maintenance', { defaultValue: 'Bảo trì' })}: ${hardware.unavailableConnectors}`}
              />
            )}
          </div>
        </div>
      )}

      {/* Action queues & upcoming side panels */}
      <div className="grid gap-[13px] lg:grid-cols-2">
        <SidePanel
          title={t('panel.upcomingBookings', { defaultValue: 'Lịch đặt sắp tới' })}
          link={t('panel.allLink', { defaultValue: 'Xem tất cả →' })}
          onLink={() => navigate('/owner/bookings')}
          rows={upcomingRows}
        />
        <SidePanel
          title={t('panel.actionItems', { defaultValue: 'Việc cần xử lý' })}
          link={t('panel.allLink', { defaultValue: 'Xem tất cả →' })}
          onLink={() => {
            if (stations.pendingApproval > 0) {
              navigate('/owner/stations?status=PENDING_APPROVAL');
            } else if (hardware.offlineConnectors > 0) {
              navigate('/owner/chargers');
            } else {
              navigate('/owner/tickets?status=OPEN');
            }
          }}
          rows={actionRows}
          tone={actionRows.some((r) => r.dotClass === 'bg-bad' || r.dotClass === 'bg-warn') ? 'warn' : 'white'}
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
        <Skeleton className="h-[200px] rounded-card" />
        <Skeleton className="h-[200px] rounded-card" />
      </div>
    </>
  );
}
