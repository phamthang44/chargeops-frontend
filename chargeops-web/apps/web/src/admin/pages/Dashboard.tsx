import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  useApi,
  formatDateTimeVn,
  type AdminOperationsSummary,
  type AdminDashboardApprovalItem,
  type AdminDashboardTicketItem,
  type AdminDashboardQueuePage,
  type AdminUserSummary,
} from '@chargeops/api';
import {
  Button,
  IconRefreshCw,
  IconClock,
  IconShield,
  IconShieldAlert,
  IconUsers,
  IconWrench,
  IconChevronLeft,
  IconChevronRight,
  IconArrowRight,
  PageHeader,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';
import { ApiErrorState } from '../../shared/components/ApiErrorState';

type QueueTab = 'approvals' | 'platform' | 'escalated';

/**
 * Pure helper to calculate human-readable waiting age relative to backend's generatedAt.
 * Never relies on client machine time as authoritative reference.
 */
function formatQueueAge(
  generatedAtStr?: string | null,
  timestampStr?: string | null,
  locale = 'vi',
): { age: string; full: string } | null {
  if (!timestampStr) return null;
  const targetDate = new Date(timestampStr);
  if (isNaN(targetDate.getTime())) return null;

  const refDate = generatedAtStr ? new Date(generatedAtStr) : new Date();
  const refTime = isNaN(refDate.getTime()) ? Date.now() : refDate.getTime();
  const diffMs = Math.max(0, refTime - targetDate.getTime());

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let age = '';
  if (locale === 'vi') {
    if (days > 0) {
      const remHours = hours % 24;
      age = remHours > 0 ? `${days} ngày ${remHours}h` : `${days} ngày`;
    } else if (hours > 0) {
      const remMin = minutes % 60;
      age = remMin > 0 ? `${hours}h ${remMin}p` : `${hours} giờ`;
    } else {
      age = `${Math.max(1, minutes)} phút`;
    }
  } else {
    if (days > 0) {
      const remHours = hours % 24;
      age = remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
    } else if (hours > 0) {
      const remMin = minutes % 60;
      age = remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
    } else {
      age = `${Math.max(1, minutes)}m`;
    }
  }

  const full = formatDateTimeVn(targetDate);
  return { age, full };
}

/**
 * Platform operations dashboard (V2 — High-End Visual Architecture).
 * Adheres strictly to the frontend-handoff contract, token system,
 * 1-based pagination, explicit OLDEST_FIRST sort, and double-bezel micro-aesthetics.
 */
export function Dashboard() {
  const { t, i18n } = useTranslation('admin');
  const api = useApi();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization: ?queue=approvals&approvalsPage=1&platformPage=1&escalatedPage=1
  const activeTab: QueueTab = useMemo(() => {
    const q = searchParams.get('queue');
    return q === 'platform' || q === 'escalated' ? q : 'approvals';
  }, [searchParams]);

  const approvalsPage = useMemo(() => {
    const p = parseInt(searchParams.get('approvalsPage') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const platformPage = useMemo(() => {
    const p = parseInt(searchParams.get('platformPage') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const escalatedPage = useMemo(() => {
    const p = parseInt(searchParams.get('escalatedPage') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const updateParam = useCallback(
    (key: string, val: string | number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, String(val));
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  // 1. Overall Platform Summary (4 KPI metrics + generatedAt)
  const summaryQ = useQuery<AdminOperationsSummary>({
    queryKey: ['dashboard', 'admin', 'summary'],
    queryFn: () => api.dashboard.admin(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // 2. Action Queue: Approvals (OLDEST_FIRST canonical sort)
  const approvalsQ = useQuery<AdminDashboardQueuePage<AdminDashboardApprovalItem>>({
    queryKey: ['admin', 'dashboard', 'queue', 'approvals', approvalsPage],
    queryFn: () => api.dashboard.adminApprovalsQueue({ page: approvalsPage, size: 5, sort: 'OLDEST_FIRST' }),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // 3. Action Queue: Platform Tickets (OLDEST_FIRST)
  const platformQ = useQuery<AdminDashboardQueuePage<AdminDashboardTicketItem>>({
    queryKey: ['admin', 'dashboard', 'queue', 'platform', platformPage],
    queryFn: () => api.dashboard.adminPlatformQueue({ page: platformPage, size: 5, sort: 'OLDEST_FIRST' }),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // 4. Action Queue: Escalated Cases (OLDEST_FIRST by requestedAt)
  const escalatedQ = useQuery<AdminDashboardQueuePage<AdminDashboardTicketItem>>({
    queryKey: ['admin', 'dashboard', 'queue', 'escalated', escalatedPage],
    queryFn: () => api.dashboard.adminEscalatedQueue({ page: escalatedPage, size: 5, sort: 'OLDEST_FIRST' }),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // 5. User Overview (UM-01)
  const userSummaryQ = useQuery<AdminUserSummary>({
    queryKey: ['users', 'summary', 'adminDashboard'],
    queryFn: () => api.users.summary(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // Safe clamp if total decreases beyond last page
  useEffect(() => {
    if (approvalsQ.data?.meta && approvalsPage > approvalsQ.data.meta.totalPages && approvalsQ.data.meta.totalPages > 0) {
      updateParam('approvalsPage', approvalsQ.data.meta.totalPages);
    }
  }, [approvalsQ.data, approvalsPage, updateParam]);

  useEffect(() => {
    if (platformQ.data?.meta && platformPage > platformQ.data.meta.totalPages && platformQ.data.meta.totalPages > 0) {
      updateParam('platformPage', platformQ.data.meta.totalPages);
    }
  }, [platformQ.data, platformPage, updateParam]);

  useEffect(() => {
    if (escalatedQ.data?.meta && escalatedPage > escalatedQ.data.meta.totalPages && escalatedQ.data.meta.totalPages > 0) {
      updateParam('escalatedPage', escalatedQ.data.meta.totalPages);
    }
  }, [escalatedQ.data, escalatedPage, updateParam]);

  const isGlobalFetching =
    summaryQ.isFetching ||
    approvalsQ.isFetching ||
    platformQ.isFetching ||
    escalatedQ.isFetching ||
    userSummaryQ.isFetching;

  const handleGlobalRefresh = () => {
    summaryQ.refetch();
    approvalsQ.refetch();
    platformQ.refetch();
    escalatedQ.refetch();
    userSummaryQ.refetch();
  };

  const referenceTime = summaryQ.data?.generatedAt || new Date().toISOString();
  const formattedRefTime = formatDateTimeVn(referenceTime);

  // Jump to specific queue section or switch mobile tab
  const scrollToQueue = (tab: QueueTab, elementId: string) => {
    updateParam('queue', tab);
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header with High-End Eyebrow and Reference Timestamp */}
      <PageHeader
        title={t('dashboard.title', { defaultValue: 'Điều phối nền tảng' })}
        subtitle={
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[12.5px] text-muted">
            <span>{t('dashboard.subtitle', { defaultValue: 'Hàng đợi điều phối hồ sơ, ticket nền tảng và các vụ việc leo thang cần xử lý.' })}</span>
            <span className="hidden sm:inline text-line">•</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-faint border border-line shadow-2xs">
              <IconClock size={11.5} className="text-brand" />
              <span>{t('dashboard.generatedAt', { time: formattedRefTime, defaultValue: `Dữ liệu tính đến ${formattedRefTime}` })}</span>
            </span>
          </div>
        }
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGlobalRefresh}
            disabled={isGlobalFetching}
            icon={<IconRefreshCw size={13} className={isGlobalFetching ? 'animate-spin text-brand' : ''} />}
            className="rounded-full shadow-2xs hover:shadow-xs"
          >
            <span>
              {isGlobalFetching
                ? t('dashboard.refreshing', { defaultValue: 'Đang cập nhật...' })
                : t('dashboard.refresh', { defaultValue: 'Làm mới' })}
            </span>
          </Button>
        }
      />

      {/* Global Error Banner if summary fails completely */}
      {summaryQ.error && (
        <ApiErrorState
          error={summaryQ.error}
          eyebrow={t('dashboard.title', { defaultValue: 'Điều phối nền tảng' })}
          title={t('dashboard.error', { defaultValue: 'Không thể tải dữ liệu tổng quan' })}
          onRetry={handleGlobalRefresh}
          isRetrying={isGlobalFetching}
        />
      )}

      {/* 4 Operations KPI Cards Strip (Double-Bezel Architecture) */}
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {/* KPI 1: Approvals */}
        <div
          onClick={() => scrollToQueue('approvals', 'queue-approvals')}
          className="group relative cursor-pointer overflow-hidden rounded-[16px] border border-line/80 bg-surface/40 p-1.5 shadow-2xs ring-1 ring-line/30 transition-all duration-300 hover:-translate-y-0.5 hover:border-warn hover:shadow-md"
        >
          <div className="flex h-full flex-col justify-between rounded-[11px] bg-surface p-4 border border-line/40 transition-colors group-hover:bg-warn-soft/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                {t('dashboard.kpi.approvals', { defaultValue: 'Hồ sơ chờ duyệt' })}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-warn-pill text-warn transition-transform group-hover:scale-110">
                <IconShield size={14} strokeWidth={2} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-[28px] font-bold tracking-tight text-ink tabular-nums font-mono">
                {summaryQ.isLoading ? (
                  <Skeleton className="h-8 w-14 rounded-md" />
                ) : (
                  summaryQ.data?.pendingApprovals ?? 0
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-warn opacity-80 group-hover:opacity-100 transition-opacity">
                <span>{t('dashboard.kpi.clickToFocus', { defaultValue: 'Xem hàng đợi' })}</span>
                <span className="transition-transform group-hover:translate-y-0.5">↓</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Platform Tickets */}
        <div
          onClick={() => scrollToQueue('platform', 'queue-platform')}
          className="group relative cursor-pointer overflow-hidden rounded-[16px] border border-line/80 bg-surface/40 p-1.5 shadow-2xs ring-1 ring-line/30 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <div className="flex h-full flex-col justify-between rounded-[11px] bg-surface p-4 border border-line/40 transition-colors group-hover:bg-brand-soft/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                {t('dashboard.kpi.platformTickets', { defaultValue: 'Ticket nền tảng' })}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand transition-transform group-hover:scale-110">
                <IconWrench size={14} strokeWidth={2} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-[28px] font-bold tracking-tight text-ink tabular-nums font-mono">
                {summaryQ.isLoading ? (
                  <Skeleton className="h-8 w-14 rounded-md" />
                ) : (
                  summaryQ.data?.platformOpenTickets ?? 0
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-brand opacity-80 group-hover:opacity-100 transition-opacity">
                <span>{t('dashboard.kpi.clickToFocus', { defaultValue: 'Xem hàng đợi' })}</span>
                <span className="transition-transform group-hover:translate-y-0.5">↓</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Escalated Cases */}
        <div
          onClick={() => scrollToQueue('escalated', 'queue-escalated')}
          className="group relative cursor-pointer overflow-hidden rounded-[16px] border border-line/80 bg-surface/40 p-1.5 shadow-2xs ring-1 ring-line/30 transition-all duration-300 hover:-translate-y-0.5 hover:border-bad hover:shadow-md"
        >
          <div className="flex h-full flex-col justify-between rounded-[11px] bg-surface p-4 border border-line/40 transition-colors group-hover:bg-bad-soft/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                {t('dashboard.kpi.escalatedCases', { defaultValue: 'Case escalation' })}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bad-soft text-bad transition-transform group-hover:scale-110">
                <IconShieldAlert size={14} strokeWidth={2} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-[28px] font-bold tracking-tight text-ink tabular-nums font-mono">
                {summaryQ.isLoading ? (
                  <Skeleton className="h-8 w-14 rounded-md" />
                ) : (
                  summaryQ.data?.escalatedOpenCases ?? 0
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-bad opacity-80 group-hover:opacity-100 transition-opacity">
                <span>{t('dashboard.kpi.clickToFocus', { defaultValue: 'Xem hàng đợi' })}</span>
                <span className="transition-transform group-hover:translate-y-0.5">↓</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Active Stations */}
        <div
          onClick={() => navigate('/admin/stations?status=ACTIVE')}
          className="group relative cursor-pointer overflow-hidden rounded-[16px] border border-line/80 bg-surface/40 p-1.5 shadow-2xs ring-1 ring-line/30 transition-all duration-300 hover:-translate-y-0.5 hover:border-good hover:shadow-md"
        >
          <div className="flex h-full flex-col justify-between rounded-[11px] bg-surface p-4 border border-line/40 transition-colors group-hover:bg-good-soft/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                {t('dashboard.kpi.activeStations', { defaultValue: 'Trạm hoạt động' })}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-good-soft text-good transition-transform group-hover:scale-110">
                <span className="h-2 w-2 rounded-full bg-good animate-ping" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-[28px] font-bold tracking-tight text-ink tabular-nums font-mono">
                {summaryQ.isLoading ? (
                  <Skeleton className="h-8 w-14 rounded-md" />
                ) : (
                  summaryQ.data?.activeStations ?? 0
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-good opacity-80 group-hover:opacity-100 transition-opacity">
                <span>{t('dashboard.queues.viewAll', { defaultValue: 'Xem tất cả →' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (<1024px) */}
      <div className="flex lg:hidden overflow-x-auto rounded-[14px] border border-line bg-surface p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => updateParam('queue', 'approvals')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-[12px] font-semibold transition-all ${
            activeTab === 'approvals'
              ? 'bg-surface-2 text-ink shadow-xs border border-line'
              : 'text-muted hover:text-ink'
          }`}
        >
          <span>{t('dashboard.kpi.approvals', { defaultValue: 'Hồ sơ chờ duyệt' })}</span>
          <span className="rounded-full bg-warn-pill px-1.5 py-0.2 text-[10px] font-bold text-warn tabular-nums">
            {approvalsQ.data?.total ?? summaryQ.data?.pendingApprovals ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => updateParam('queue', 'platform')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-[12px] font-semibold transition-all ${
            activeTab === 'platform'
              ? 'bg-surface-2 text-ink shadow-xs border border-line'
              : 'text-muted hover:text-ink'
          }`}
        >
          <span>{t('dashboard.kpi.platformTickets', { defaultValue: 'Ticket nền tảng' })}</span>
          <span className="rounded-full bg-brand-soft px-1.5 py-0.2 text-[10px] font-bold text-brand tabular-nums">
            {platformQ.data?.total ?? summaryQ.data?.platformOpenTickets ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => updateParam('queue', 'escalated')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-[12px] font-semibold transition-all ${
            activeTab === 'escalated'
              ? 'bg-surface-2 text-ink shadow-xs border border-line'
              : 'text-muted hover:text-ink'
          }`}
        >
          <span>{t('dashboard.kpi.escalatedCases', { defaultValue: 'Escalation' })}</span>
          <span className="rounded-full bg-bad-soft px-1.5 py-0.2 text-[10px] font-bold text-bad tabular-nums">
            {escalatedQ.data?.total ?? summaryQ.data?.escalatedOpenCases ?? 0}
          </span>
        </button>
      </div>

      {/* Main 12-Column Responsive Operations Grid */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (8 cols): Approvals & Platform Tickets */}
        <div className="space-y-6 lg:col-span-8">
          {/* Widget 1: Approvals Queue */}
          <div
            id="queue-approvals"
            className={`${activeTab === 'approvals' ? 'block' : 'hidden lg:block'} rounded-[18px] border border-line/80 bg-surface/30 p-2 shadow-2xs ring-1 ring-line/20`}
          >
            <div className="rounded-[14px] bg-surface p-4 sm:p-5 border border-line/50 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/50 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warn-pill text-warn">
                    <IconShield size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-bold text-ink">
                        {t('dashboard.queues.approvals', { defaultValue: 'Hồ sơ trạm chờ duyệt' })}
                      </h2>
                      <span className="rounded-full bg-warn-pill px-2 py-0.5 text-[11px] font-bold text-warn tabular-nums">
                        {approvalsQ.data?.total ?? 0}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-faint">
                      {t('dashboard.queues.sortOldest', { defaultValue: 'Sắp xếp ưu tiên: Hồ sơ gửi sớm nhất' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => approvalsQ.refetch()}
                    disabled={approvalsQ.isFetching}
                    icon={<IconRefreshCw size={12} className={approvalsQ.isFetching ? 'animate-spin text-brand' : ''} />}
                    className="h-8 w-8 !p-0 rounded-full"
                    title={t('dashboard.refreshQueue', { defaultValue: 'Cập nhật hàng đợi' })}
                  />
                  <button
                    type="button"
                    onClick={() => navigate('/admin/approvals')}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                  >
                    <span>{t('dashboard.queues.viewAll', { defaultValue: 'Xem tất cả →' })}</span>
                  </button>
                </div>
              </div>

              {/* Content / Queue List */}
              {approvalsQ.error ? (
                <div className="rounded-card border border-bad/30 bg-bad-soft/30 p-4 text-center">
                  <p className="text-[12.5px] text-bad font-medium">{t('dashboard.error', { defaultValue: 'Không thể tải danh sách hồ sơ' })}</p>
                  <Button size="sm" variant="secondary" onClick={() => approvalsQ.refetch()} className="mt-2 text-[11.5px]">
                    {t('dashboard.retry', { defaultValue: 'Thử lại' })}
                  </Button>
                </div>
              ) : approvalsQ.isLoading ? (
                <div className="space-y-2.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-card" />
                  ))}
                </div>
              ) : !approvalsQ.data?.items?.length ? (
                <div className="rounded-card border border-line/60 bg-surface-2 p-8 text-center text-muted">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-good-soft text-good mb-2">
                    ✓
                  </div>
                  <p className="text-[13px] font-medium text-ink">
                    {t('dashboard.queues.emptyApprovals', { defaultValue: 'Không có hồ sơ nào đang chờ duyệt' })}
                  </p>
                  <p className="text-[11.5px] text-faint mt-1">
                    {t('dashboard.queues.sortOldest', { defaultValue: 'Mọi hồ sơ đăng ký mới đã được xử lý hoàn tất.' })}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {approvalsQ.data.items.map((item) => {
                    const ageInfo = formatQueueAge(approvalsQ.data?.meta?.generatedAt, item.submittedAt, i18n.language);
                    return (
                      <div
                        key={item.stationId}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-card border border-line/60 bg-surface p-3.5 transition-all duration-200 hover:border-brand/40 hover:bg-surface-2 hover:shadow-2xs"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-faint">
                              {item.stationCode || item.stationId.slice(-8)}
                            </span>
                            <StatusPill tone="warn" label={t('dashboard.kpi.approvals', { defaultValue: 'Chờ duyệt' })} />
                            {ageInfo && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-muted border border-line/50"
                                title={t('dashboard.queues.waitingSince', { time: ageInfo.full, defaultValue: `Chờ từ ${ageInfo.full}` })}
                              >
                                <IconClock size={10} className="text-warn" />
                                <span>{t('dashboard.queues.waitingAge', { age: ageInfo.age, defaultValue: `Chờ ${ageInfo.age}` })}</span>
                              </span>
                            )}
                          </div>

                          <div className="font-bold text-ink text-[13.5px] truncate group-hover:text-brand transition-colors">
                            {item.stationName}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                            <span className="flex items-center gap-1">
                              <span className="text-faint">{t('users.kpi.owners', { defaultValue: 'Chủ trạm' })}:</span>
                              <span className="font-medium text-body">{item.ownerDisplayName || '—'}</span>
                            </span>
                            {item.provinceName && (
                              <span className="text-faint">• {item.provinceName}</span>
                            )}
                          </div>
                        </div>

                        {/* CTA Button-in-Button */}
                        <div className="flex sm:flex-col items-end justify-between gap-1 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/approvals?stationId=${item.stationId}`)}
                            className="group/btn inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink transition-all duration-200 hover:border-brand hover:bg-brand-soft hover:text-brand active:scale-[0.98]"
                          >
                            <span>{t('dashboard.queues.openApproval', { defaultValue: 'Mở hồ sơ' })}</span>
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-line-3 text-muted group-hover/btn:bg-brand group-hover/btn:text-white transition-all">
                              <IconArrowRight size={10} strokeWidth={2.5} />
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 1-Based Pagination Footer */}
              {approvalsQ.data?.meta && approvalsQ.data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-line/50 pt-3 text-[12px] text-muted">
                  <span className="text-[11.5px] text-faint">
                    {t('dashboard.queues.pageInfo', {
                      current: approvalsQ.data.meta.page,
                      total: approvalsQ.data.meta.totalPages,
                      defaultValue: `Trang ${approvalsQ.data.meta.page} / ${approvalsQ.data.meta.totalPages}`,
                    })}{' '}
                    <span className="text-faint font-mono">
                      {t('dashboard.queues.totalRecords', { count: approvalsQ.data.meta.totalElements, defaultValue: `(${approvalsQ.data.meta.totalElements} bản ghi)` })}
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={approvalsPage <= 1}
                      onClick={() => updateParam('approvalsPage', Math.max(1, approvalsPage - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-body transition hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none"
                      title={t('dashboard.queues.prev', { defaultValue: 'Trang trước' })}
                    >
                      <IconChevronLeft size={13} />
                    </button>
                    <span className="px-2 font-mono font-bold text-ink text-[12px]">
                      {approvalsPage}
                    </span>
                    <button
                      type="button"
                      disabled={approvalsPage >= approvalsQ.data.meta.totalPages}
                      onClick={() => updateParam('approvalsPage', approvalsPage + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-body transition hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none"
                      title={t('dashboard.queues.next', { defaultValue: 'Trang tiếp' })}
                    >
                      <IconChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 2: Platform Tickets Queue */}
          <div
            id="queue-platform"
            className={`${activeTab === 'platform' ? 'block' : 'hidden lg:block'} rounded-[18px] border border-line/80 bg-surface/30 p-2 shadow-2xs ring-1 ring-line/20`}
          >
            <div className="rounded-[14px] bg-surface p-4 sm:p-5 border border-line/50 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/50 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <IconWrench size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-bold text-ink">
                        {t('dashboard.queues.platform', { defaultValue: 'Ticket nền tảng cần hỗ trợ' })}
                      </h2>
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand tabular-nums">
                        {platformQ.data?.total ?? 0}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-faint">
                      {t('dashboard.queues.sortOldest', { defaultValue: 'Sắp xếp ưu tiên: Ticket mở sớm nhất' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => platformQ.refetch()}
                    disabled={platformQ.isFetching}
                    icon={<IconRefreshCw size={12} className={platformQ.isFetching ? 'animate-spin text-brand' : ''} />}
                    className="h-8 w-8 !p-0 rounded-full"
                    title={t('dashboard.refreshQueue', { defaultValue: 'Cập nhật hàng đợi' })}
                  />
                  <button
                    type="button"
                    onClick={() => navigate('/admin/tickets?scope=PLATFORM&status=OPEN')}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                  >
                    <span>{t('dashboard.queues.viewAll', { defaultValue: 'Xem tất cả →' })}</span>
                  </button>
                </div>
              </div>

              {/* Content / Queue List */}
              {platformQ.error ? (
                <div className="rounded-card border border-bad/30 bg-bad-soft/30 p-4 text-center">
                  <p className="text-[12.5px] text-bad font-medium">{t('dashboard.error', { defaultValue: 'Không thể tải danh sách ticket nền tảng' })}</p>
                  <Button size="sm" variant="secondary" onClick={() => platformQ.refetch()} className="mt-2 text-[11.5px]">
                    {t('dashboard.retry', { defaultValue: 'Thử lại' })}
                  </Button>
                </div>
              ) : platformQ.isLoading ? (
                <div className="space-y-2.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-card" />
                  ))}
                </div>
              ) : !platformQ.data?.items?.length ? (
                <div className="rounded-card border border-line/60 bg-surface-2 p-8 text-center text-muted">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-good-soft text-good mb-2">
                    ✓
                  </div>
                  <p className="text-[13px] font-medium text-ink">
                    {t('dashboard.queues.emptyPlatform', { defaultValue: 'Không có ticket nền tảng nào cần xử lý' })}
                  </p>
                  <p className="text-[11.5px] text-faint mt-1">
                    {t('dashboard.queues.sortOldest', { defaultValue: 'Mọi thắc mắc và sự cố hệ thống đã được giải quyết.' })}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {platformQ.data.items.map((item) => {
                    const ageInfo = formatQueueAge(platformQ.data?.meta?.generatedAt, item.createdAt, i18n.language);
                    const handlerText = item.assignedHandlerName
                      ? item.assignedHandlerName
                      : item.assignedHandlerId
                        ? t('dashboard.queues.unnamedHandler', { defaultValue: 'Đã gán (chưa có tên)' })
                        : t('dashboard.queues.unassigned', { defaultValue: 'Chưa tiếp nhận' });

                    return (
                      <div
                        key={item.ticketId}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-card border border-line/60 bg-surface p-3.5 transition-all duration-200 hover:border-brand/40 hover:bg-surface-2 hover:shadow-2xs"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-brand">
                              #{item.ticketCode || item.ticketId.slice(-6)}
                            </span>
                            <StatusPill
                              tone={item.status === 'IN_PROGRESS' ? 'brand' : 'neutral'}
                              label={item.status === 'IN_PROGRESS' ? 'Đang xử lý' : 'Mới mở'}
                            />
                            {ageInfo && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-muted border border-line/50"
                                title={t('dashboard.queues.waitingSince', { time: ageInfo.full, defaultValue: `Chờ từ ${ageInfo.full}` })}
                              >
                                <IconClock size={10} className="text-brand" />
                                <span>{t('dashboard.queues.waitingAge', { age: ageInfo.age, defaultValue: `Chờ ${ageInfo.age}` })}</span>
                              </span>
                            )}
                          </div>

                          <div className="font-bold text-ink text-[13.5px] truncate group-hover:text-brand transition-colors">
                            {item.subject}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                            {item.reporterName && (
                              <span className="text-body font-medium">{item.reporterName}</span>
                            )}
                            <span className="text-faint">•</span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
                                item.assignedHandlerId
                                  ? 'bg-surface-2 text-ink border border-line'
                                  : 'bg-warn-pill text-warn'
                              }`}
                            >
                              <span>{handlerText}</span>
                            </span>
                          </div>
                        </div>

                        {/* CTA Button-in-Button */}
                        <div className="flex sm:flex-col items-end justify-between gap-1 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/tickets/${item.ticketId}`)}
                            className="group/btn inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink transition-all duration-200 hover:border-brand hover:bg-brand-soft hover:text-brand active:scale-[0.98]"
                          >
                            <span>{t('dashboard.queues.openTicket', { defaultValue: 'Mở ticket' })}</span>
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-line-3 text-muted group-hover/btn:bg-brand group-hover/btn:text-white transition-all">
                              <IconArrowRight size={10} strokeWidth={2.5} />
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 1-Based Pagination Footer */}
              {platformQ.data?.meta && platformQ.data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-line/50 pt-3 text-[12px] text-muted">
                  <span className="text-[11.5px] text-faint">
                    {t('dashboard.queues.pageInfo', {
                      current: platformQ.data.meta.page,
                      total: platformQ.data.meta.totalPages,
                      defaultValue: `Trang ${platformQ.data.meta.page} / ${platformQ.data.meta.totalPages}`,
                    })}{' '}
                    <span className="text-faint font-mono">
                      {t('dashboard.queues.totalRecords', { count: platformQ.data.meta.totalElements, defaultValue: `(${platformQ.data.meta.totalElements} bản ghi)` })}
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={platformPage <= 1}
                      onClick={() => updateParam('platformPage', Math.max(1, platformPage - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-body transition hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none"
                      title={t('dashboard.queues.prev', { defaultValue: 'Trang trước' })}
                    >
                      <IconChevronLeft size={13} />
                    </button>
                    <span className="px-2 font-mono font-bold text-ink text-[12px]">
                      {platformPage}
                    </span>
                    <button
                      type="button"
                      disabled={platformPage >= platformQ.data.meta.totalPages}
                      onClick={() => updateParam('platformPage', platformPage + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-body transition hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none"
                      title={t('dashboard.queues.next', { defaultValue: 'Trang tiếp' })}
                    >
                      <IconChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Escalated Cases & Platform User Overview */}
        <div className="space-y-6 lg:col-span-4">
          {/* Widget 3: Escalated Cases Queue */}
          <div
            id="queue-escalated"
            className={`${activeTab === 'escalated' ? 'block' : 'hidden lg:block'} rounded-[18px] border border-line/80 bg-surface/30 p-2 shadow-2xs ring-1 ring-line/20`}
          >
            <div className="rounded-[14px] bg-surface p-4 sm:p-5 border border-line/50 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/50 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bad-soft text-bad">
                    <IconShieldAlert size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-[14.5px] font-bold text-ink">
                        {t('dashboard.queues.escalated', { defaultValue: 'Vụ việc leo thang' })}
                      </h2>
                      <span className="rounded-full bg-bad-soft px-1.5 py-0.2 text-[10.5px] font-bold text-bad tabular-nums">
                        {escalatedQ.data?.total ?? 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-faint">
                      {t('dashboard.queues.sortOldest', { defaultValue: 'Xử lý theo requestedAt cũ nhất' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => escalatedQ.refetch()}
                    disabled={escalatedQ.isFetching}
                    icon={<IconRefreshCw size={11} className={escalatedQ.isFetching ? 'animate-spin text-bad' : ''} />}
                    className="h-7 w-7 !p-0 rounded-full"
                    title={t('dashboard.refreshQueue', { defaultValue: 'Cập nhật hàng đợi' })}
                  />
                  <button
                    type="button"
                    onClick={() => navigate('/admin/tickets?escalated=true')}
                    className="text-[11.5px] font-semibold text-bad hover:underline"
                  >
                    <span>{t('dashboard.queues.viewAll', { defaultValue: 'Xem tất cả →' })}</span>
                  </button>
                </div>
              </div>

              {/* Content / Queue List */}
              {escalatedQ.error ? (
                <div className="rounded-card border border-bad/30 bg-bad-soft/30 p-4 text-center">
                  <p className="text-[12px] text-bad font-medium">{t('dashboard.error', { defaultValue: 'Không thể tải case leo thang' })}</p>
                  <Button size="sm" variant="secondary" onClick={() => escalatedQ.refetch()} className="mt-2 text-[11px]">
                    {t('dashboard.retry', { defaultValue: 'Thử lại' })}
                  </Button>
                </div>
              ) : escalatedQ.isLoading ? (
                <div className="space-y-2.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-card" />
                  ))}
                </div>
              ) : !escalatedQ.data?.items?.length ? (
                <div className="rounded-card border border-line/60 bg-surface-2 p-6 text-center text-muted">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-good-soft text-good mb-2">
                    ✓
                  </div>
                  <p className="text-[12.5px] font-medium text-ink">
                    {t('dashboard.queues.emptyEscalated', { defaultValue: 'Không có vụ việc leo thang nào' })}
                  </p>
                  <p className="text-[11px] text-faint mt-0.5">
                    {t('dashboard.queues.sortOldest', { defaultValue: 'Tất cả tranh chấp và sự cố trạm đang ổn định.' })}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {escalatedQ.data.items.map((item) => {
                    // Strict: Use requestedAt for escalation age calculation!
                    const ageInfo = formatQueueAge(
                      escalatedQ.data?.meta?.generatedAt,
                      item.requestedAt || item.createdAt,
                      i18n.language,
                    );
                    const handlerText = item.assignedHandlerName
                      ? item.assignedHandlerName
                      : item.assignedHandlerId
                        ? t('dashboard.queues.unnamedHandler', { defaultValue: 'Đã gán (chưa có tên)' })
                        : t('dashboard.queues.unassigned', { defaultValue: 'Chưa tiếp nhận' });

                    return (
                      <div
                        key={item.ticketId}
                        className="group flex flex-col justify-between gap-2.5 rounded-card border border-line/60 bg-surface p-3.5 transition-all duration-200 hover:border-bad/40 hover:bg-surface-2 hover:shadow-2xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-bold text-bad">
                              #{item.ticketCode || item.ticketId.slice(-6)}
                            </span>
                            {ageInfo && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-bad-soft px-2 py-0.2 text-[10px] font-semibold text-bad border border-bad/20"
                                title={t('dashboard.queues.waitingSince', { time: ageInfo.full, defaultValue: `Chờ từ ${ageInfo.full}` })}
                              >
                                <IconClock size={9.5} />
                                <span>{ageInfo.age}</span>
                              </span>
                            )}
                          </div>

                          <div className="font-bold text-ink text-[13px] leading-snug group-hover:text-bad transition-colors">
                            {item.subject}
                          </div>

                          {item.stationName && (
                            <div className="text-[11.5px] font-medium text-body flex items-center gap-1 truncate">
                              <span className="text-faint">📍</span>
                              <span className="truncate">{item.stationName}</span>
                            </div>
                          )}

                          {item.escalationReason && (
                            <div className="rounded-md bg-bad-soft/40 p-2 text-[11px] text-bad border border-bad/15 leading-relaxed line-clamp-2">
                              {item.escalationReason}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                            <span className="text-faint truncate">
                              {item.reporterName || 'Tài xế'}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                item.assignedHandlerId
                                  ? 'bg-surface-2 text-ink border border-line'
                                  : 'bg-warn-pill text-warn'
                              }`}
                            >
                              {handlerText}
                            </span>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <div className="pt-1 border-t border-line/40 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/admin/tickets/${item.ticketId}${
                                  item.escalationId ? `?escalationId=${item.escalationId}` : ''
                                }`,
                              )
                            }
                            className="group/btn inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-bad hover:bg-bad-soft transition-all active:scale-[0.98]"
                          >
                            <span>{t('dashboard.queues.openCase', { defaultValue: 'Mở case' })}</span>
                            <IconArrowRight size={10} className="transition-transform group-hover/btn:translate-x-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 1-Based Pagination Footer */}
              {escalatedQ.data?.meta && escalatedQ.data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-line/50 pt-2 text-[11.5px] text-muted">
                  <span className="text-faint">
                    {escalatedPage}/{escalatedQ.data.meta.totalPages} ({escalatedQ.data.meta.totalElements})
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={escalatedPage <= 1}
                      onClick={() => updateParam('escalatedPage', Math.max(1, escalatedPage - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-surface text-body transition hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <IconChevronLeft size={11} />
                    </button>
                    <span className="px-1.5 font-mono font-bold text-ink">
                      {escalatedPage}
                    </span>
                    <button
                      type="button"
                      disabled={escalatedPage >= escalatedQ.data.meta.totalPages}
                      onClick={() => updateParam('escalatedPage', escalatedPage + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-surface text-body transition hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <IconChevronRight size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 4: Platform User Overview (UM-01) */}
          <div className="rounded-[18px] border border-line/80 bg-surface/30 p-2 shadow-2xs ring-1 ring-line/20">
            <div className="rounded-[14px] bg-surface p-4 sm:p-5 border border-line/50 space-y-3.5">
              <div className="flex items-center justify-between border-b border-line/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <IconUsers size={14} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-ink">
                      {t('dashboard.usersOverview.title', { defaultValue: 'Người dùng nền tảng' })}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="text-[11.5px] font-semibold text-brand hover:underline"
                >
                  {t('dashboard.usersOverview.viewAll', { defaultValue: 'Quản lý →' })}
                </button>
              </div>

              {/* Grid of 4 User Metric Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Total Profiles */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="group flex flex-col justify-between rounded-card border border-line/60 bg-surface p-3 text-left transition-all duration-200 hover:border-brand/40 hover:bg-surface-2"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-faint">
                    {t('dashboard.usersOverview.total', { defaultValue: 'Tổng tài khoản' })}
                  </span>
                  <div className="mt-2 text-[20px] font-bold text-ink tabular-nums font-mono group-hover:text-brand transition-colors">
                    {userSummaryQ.isLoading ? '…' : userSummaryQ.data?.totalProfiles ?? 0}
                  </div>
                </button>

                {/* Drivers */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/users?role=DRIVER')}
                  className="group flex flex-col justify-between rounded-card border border-line/60 bg-surface p-3 text-left transition-all duration-200 hover:border-good/40 hover:bg-good-soft/20"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-faint">
                    {t('dashboard.usersOverview.drivers', { defaultValue: 'Tài xế' })}
                  </span>
                  <div className="mt-2 text-[20px] font-bold text-ink tabular-nums font-mono group-hover:text-good transition-colors">
                    {userSummaryQ.isLoading ? '…' : userSummaryQ.data?.byRole?.DRIVER ?? 0}
                  </div>
                </button>

                {/* Station Staff */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/users?role=STAFF')}
                  className="group flex flex-col justify-between rounded-card border border-line/60 bg-surface p-3 text-left transition-all duration-200 hover:border-warn/40 hover:bg-warn-soft/20"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-faint">
                    {t('dashboard.usersOverview.staff', { defaultValue: 'Nhân viên trạm' })}
                  </span>
                  <div className="mt-2 text-[20px] font-bold text-ink tabular-nums font-mono group-hover:text-warn transition-colors">
                    {userSummaryQ.isLoading ? '…' : userSummaryQ.data?.byRole?.STAFF ?? 0}
                  </div>
                </button>

                {/* Station Owners */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/users?role=OWNER')}
                  className="group flex flex-col justify-between rounded-card border border-line/60 bg-surface p-3 text-left transition-all duration-200 hover:border-brand/40 hover:bg-brand-soft/20"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-faint">
                    {t('dashboard.usersOverview.owners', { defaultValue: 'Chủ trạm' })}
                  </span>
                  <div className="mt-2 text-[20px] font-bold text-ink tabular-nums font-mono group-hover:text-brand transition-colors">
                    {userSummaryQ.isLoading ? '…' : userSummaryQ.data?.byRole?.OWNER ?? 0}
                  </div>
                </button>
              </div>

              {/* User Evaluation Time */}
              {userSummaryQ.data?.evaluatedAt && (
                <div className="pt-1 text-[10.5px] text-faint text-right font-mono">
                  {t('dashboard.usersOverview.evaluatedAt', {
                    time: formatDateTimeVn(userSummaryQ.data.evaluatedAt),
                    defaultValue: `Đánh giá lúc ${formatDateTimeVn(userSummaryQ.data.evaluatedAt)}`,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
