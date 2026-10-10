import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApi, type AdminOperationsSummary } from '@chargeops/api';
import { MetricCard, PageHeader, SidePanel, Skeleton, type SidePanelRow } from '@chargeops/ui';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
import { ResourceRetryButton, ResourceStateCard } from '../../shared/components/ResourceStateCard';

/** Platform operations dashboard (V1). Owner booking and finance stay in their own scope. */
export function Dashboard() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch, isFetching } = useQuery<AdminOperationsSummary>({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.dashboard.admin(),
    refetchInterval: 30000,
  });

  // Action Queues: Pending approvals (5 items)
  const pendingApprovalsQ = useQuery({
    queryKey: ['admin', 'queue', 'pendingStations'],
    queryFn: () => api.stations.adminList({ status: 'PENDING_APPROVAL' as any, pageSize: 5 }),
    refetchInterval: 30000,
  });

  // Action Queues: Open platform tickets (5 items)
  const platformTicketsQ = useQuery({
    queryKey: ['admin', 'queue', 'platformTickets'],
    queryFn: () =>
      api.tickets.list({
        role: 'admin',
        workstream: 'platform',
        status: 'open',
        pageSize: 5,
      }),
    refetchInterval: 30000,
  });

  // Action Queues: Escalated open cases (5 items)
  const escalatedCasesQ = useQuery({
    queryKey: ['admin', 'queue', 'escalatedTickets'],
    queryFn: () =>
      api.tickets.list({
        role: 'admin',
        workstream: 'station',
        pageSize: 5,
      }),
    refetchInterval: 30000,
  });

  // User Overview: Summary of users by role & status (UM-01)
  const userSummaryQ = useQuery({
    queryKey: ['users', 'summary', 'adminDashboard'],
    queryFn: () => api.users.summary(),
    refetchInterval: 30000,
  });

  const pendingStations = (pendingApprovalsQ.data as any)?.items ?? (pendingApprovalsQ.data as any)?.data ?? [];
  const pendingRows: SidePanelRow[] =
    pendingStations.length === 0
      ? [{ label: t('dashboard.queue.noPendingStations', { defaultValue: 'Không có trạm chờ duyệt' }), value: '✓' }]
      : pendingStations.slice(0, 5).map((s: any) => ({
          label: s.name,
          value: s.provinceName || s.ownerDisplayName || s.stationCode || '',
          dotClass: 'bg-warn',
        }));

  const platformTickets = (platformTicketsQ.data as any)?.items ?? [];
  const platformRows: SidePanelRow[] =
    platformTickets.length === 0
      ? [{ label: t('dashboard.queue.noPlatformTickets', { defaultValue: 'Không có ticket nền tảng' }), value: '✓' }]
      : platformTickets.slice(0, 5).map((tk: any) => ({
          label: `#${String(tk.id).slice(-6)} · ${tk.subject}`,
          value: tk.reporterName || tk.status,
          dotClass: 'bg-brand',
        }));

  const escalatedCases = (escalatedCasesQ.data as any)?.items ?? [];
  const escalatedRows: SidePanelRow[] =
    escalatedCases.length === 0
      ? [{ label: t('dashboard.queue.noEscalatedCases', { defaultValue: 'Không có vụ việc leo thang' }), value: '✓' }]
      : escalatedCases.slice(0, 5).map((c: any) => ({
          label: `#${String(c.id).slice(-6)} · ${c.subject}`,
          value: c.stationName || t('dashboard.queue.actionNeeded', { defaultValue: 'Cần xem xét' }),
          dotClass: 'bg-bad',
          valueClass: 'text-bad font-semibold',
        }));

  return (
    <>
      <PageHeader title={t('console.nav.dashboard.title')} subtitle={t('console.nav.dashboard.subtitle')} />
      {error ? (
        <ApiErrorState
          error={error}
          eyebrow={t('console.nav.dashboard.title')}
          title={t('dashboard.error', { defaultValue: 'Không thể tải dữ liệu tổng quan' })}
          missingEyebrow={t('console.nav.dashboard.title')}
          missingTitle={t('dashboard.missingTitle', { defaultValue: 'Dashboard chưa được kết nối dữ liệu' })}
          missingDescription={t('dashboard.missingDescription', {
            defaultValue: 'Endpoint tổng quan nền tảng (admin/dashboard/summary) chưa có số liệu.',
          })}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[104px] rounded-card" />
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[220px] rounded-card" />
            ))}
          </div>
        </div>
      ) : !data ? (
        <ResourceStateCard
          tone="brand"
          eyebrow={t('console.nav.dashboard.title')}
          title={t('dashboard.missingTitle', { defaultValue: 'Dashboard chưa được kết nối dữ liệu' })}
          description={t('dashboard.missingDescription', {
            defaultValue: 'Endpoint tổng quan nền tảng (admin/dashboard/summary) chưa có số liệu.',
          })}
          action={<ResourceRetryButton onClick={() => refetch()} isRetrying={isFetching} />}
        />
      ) : (
        <div className="space-y-4">
          {/* 4 Operations KPI Cards with deep links */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => navigate('/admin/stations?status=ACTIVE')}
              className="text-left w-full cursor-pointer transition hover:opacity-90"
            >
              <MetricCard
                label={t('dashboard.kpi.activeStations')}
                value={String(data.activeStations)}
                accent="#5b54e8"
              />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/stations?status=PENDING_APPROVAL')}
              className="text-left w-full cursor-pointer transition hover:opacity-90"
            >
              <MetricCard
                label={t('dashboard.kpi.pendingApprovals')}
                value={String(data.pendingApprovals)}
                accent="#9a6b16"
              />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/tickets?scope=PLATFORM&status=OPEN')}
              className="text-left w-full cursor-pointer transition hover:opacity-90"
            >
              <MetricCard
                label={t('dashboard.ops.platformOpenTickets', { defaultValue: 'Ticket nền tảng đang mở' })}
                value={String(data.platformOpenTickets)}
                accent="#0d8a5a"
              />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/tickets?escalated=true')}
              className="text-left w-full cursor-pointer transition hover:opacity-90"
            >
              <MetricCard
                label={t('dashboard.ops.escalatedOpenCases', { defaultValue: 'Case trạm cần xem xét' })}
                value={String(data.escalatedOpenCases)}
                accent="#c0392b"
              />
            </button>
          </div>

          {/* User Overview Section (UM-01) with deep links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                {t('dashboard.usersOverview.title', { defaultValue: 'Người dùng nền tảng' })}
              </span>
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="text-[11.5px] font-medium text-brand transition hover:underline"
              >
                {t('dashboard.queue.seeAll', { defaultValue: 'Xem tất cả →' })}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="text-left w-full cursor-pointer transition hover:opacity-90"
              >
                <MetricCard
                  label={t('users.kpi.total', { defaultValue: 'Tổng tài khoản' })}
                  value={userSummaryQ.isLoading ? '…' : String(userSummaryQ.data?.totalProfiles ?? 0)}
                  accent="#5b54e8"
                />
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/users?role=DRIVER')}
                className="text-left w-full cursor-pointer transition hover:opacity-90"
              >
                <MetricCard
                  label={t('users.kpi.drivers', { defaultValue: 'Tài xế' })}
                  value={userSummaryQ.isLoading ? '…' : String(userSummaryQ.data?.byRole?.DRIVER ?? 0)}
                  accent="#0d8a5a"
                />
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/users?role=STAFF')}
                className="text-left w-full cursor-pointer transition hover:opacity-90"
              >
                <MetricCard
                  label={t('users.kpi.staff', { defaultValue: 'Nhân viên trạm' })}
                  value={userSummaryQ.isLoading ? '…' : String(userSummaryQ.data?.byRole?.STAFF ?? 0)}
                  accent="#b7791f"
                />
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/users?role=OWNER')}
                className="text-left w-full cursor-pointer transition hover:opacity-90"
              >
                <MetricCard
                  label={t('users.roles.OWNER', { defaultValue: 'Chủ trạm' })}
                  value={userSummaryQ.isLoading ? '…' : String(userSummaryQ.data?.byRole?.OWNER ?? 0)}
                  accent="#3b82f6"
                />
              </button>
            </div>
          </div>

          {/* 3 Workload Action Queues */}
          <div className="grid gap-3 lg:grid-cols-3">
            <SidePanel
              title={t('dashboard.queue.pendingApprovals', { defaultValue: 'Hồ sơ trạm chờ duyệt' })}
              link={t('dashboard.queue.seeAll', { defaultValue: 'Xem tất cả →' })}
              onLink={() => navigate('/admin/stations?status=PENDING_APPROVAL')}
              rows={pendingRows}
              tone={pendingStations.length > 0 ? 'warn' : 'white'}
            />
            <SidePanel
              title={t('dashboard.queue.platformTickets', { defaultValue: 'Ticket nền tảng cần hỗ trợ' })}
              link={t('dashboard.queue.seeAll', { defaultValue: 'Xem tất cả →' })}
              onLink={() => navigate('/admin/tickets?scope=PLATFORM&status=OPEN')}
              rows={platformRows}
            />
            <SidePanel
              title={t('dashboard.queue.escalatedCases', { defaultValue: 'Vụ việc khiếu nại leo thang' })}
              link={t('dashboard.queue.seeAll', { defaultValue: 'Xem tất cả →' })}
              onLink={() => navigate('/admin/tickets?escalated=true')}
              rows={escalatedRows}
              tone={escalatedCases.length > 0 ? 'warn' : 'white'}
            />
          </div>
        </div>
      )}
    </>
  );
}
