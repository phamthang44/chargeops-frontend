import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  EmptyState,
  FilterTabs,
  IconAlertTriangle,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconCopy,
  IconShield,
  Pagination,
  SearchInput,
  Skeleton,
  StatusPill,
  type FilterTab,
} from '@chargeops/ui';
import {
  formatDateVn,
  formatDateTimeVn,
  formatVnd,
  formatVndCompact,
  useApi,
  type RefundDetail,
  type RefundStatus,
} from '@chargeops/api';
import { RefundExecutionDrawer } from './RefundExecutionDrawer';

const PAGE_SIZE = 10;
type FilterKey = RefundStatus | 'all';
type DateFilterKey = 'all' | 'today' | '7days' | '30days';
const GRID = '1.1fr 1.3fr 1.2fr 1.2fr 1.1fr 1fr 1.15fr 1.1fr';

export function RefundQueueTab() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterKey>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRefund, setSelectedRefund] = useState<RefundDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const summaryQuery = useQuery({
    queryKey: ['refunds', 'summary'],
    queryFn: () => api.refunds.summary(),
    enabled: Boolean(api.refunds),
  });

  const listQuery = useQuery({
    queryKey: ['refunds', 'list', { status: statusFilter, search, page }],
    queryFn: () =>
      api.refunds.list({
        status: statusFilter,
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    enabled: Boolean(api.refunds),
    placeholderData: keepPreviousData,
  });

  const handleOpenDrawer = (refund: RefundDetail) => {
    setSelectedRefund(refund);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRefund(null);
  };

  const handleSuccessExecution = () => {
    queryClient.invalidateQueries({ queryKey: ['refunds'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const copyRefundId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filterTabs: FilterTab<FilterKey>[] = [
    { key: 'all', label: t('refunds.tabs.all', 'Tất cả hồ sơ') },
    { key: 'PENDING', label: t('refunds.tabs.pending', 'Đang chờ xử lý (PENDING)') },
    { key: 'SUCCEEDED', label: t('refunds.tabs.succeeded', 'Đã hoàn tất (SUCCEEDED)') },
  ];

  const s = summaryQuery.data;
  const data = listQuery.data;

  // Filter by date range (all, today, 7days, 30days) and sort by Exception Queue priority
  const displayItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;
    if (dateFilter !== 'all') {
      const now = new Date();
      items = items.filter((r) => {
        const decisionTime = r.decisionAt || r.completedAt;
        if (!decisionTime) return true;
        const d = new Date(decisionTime);
        if (isNaN(d.getTime())) return true;
        if (dateFilter === 'today') {
          return d.toDateString() === now.toDateString();
        }
        if (dateFilter === '7days') {
          return now.getTime() - d.getTime() <= 7 * 24 * 60 * 60 * 1000;
        }
        if (dateFilter === '30days') {
          return now.getTime() - d.getTime() <= 30 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
    }

    // Exception Queue Priority:
    // 1. Items needing owner intervention (requiresOwnerAction or failed attempt)
    // 2. Other pending items (auto-processing or owner-required)
    // 3. Completed (SUCCEEDED) items
    // Within same priority, newest decisionAt first
    return [...items].sort((a, b) => {
      const aNeedsAction = a.status === 'PENDING' && ((a.requiresOwnerAction ?? a.requiresAdminAction) || (a.attempts && a.attempts.some((att) => att.status === 'FAILED')));
      const bNeedsAction = b.status === 'PENDING' && ((b.requiresOwnerAction ?? b.requiresAdminAction) || (b.attempts && b.attempts.some((att) => att.status === 'FAILED')));
      if (aNeedsAction && !bNeedsAction) return -1;
      if (!aNeedsAction && bNeedsAction) return 1;

      const aPending = a.status === 'PENDING';
      const bPending = b.status === 'PENDING';
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      const aTime = new Date(a.decisionAt || a.completedAt || 0).getTime();
      const bTime = new Date(b.decisionAt || b.completedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [data?.items, dateFilter]);

  const total = dateFilter !== 'all' ? displayItems.length : (data?.total ?? 0);

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'VOLUNTARY_GRACE':
        return {
          label: t('refunds.reasons.VOLUNTARY_GRACE', 'Ân hạn 10 phút'),
          tone: 'good' as const,
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500',
        };
      case 'STATION_FAILURE':
        return {
          label: t('refunds.reasons.STATION_FAILURE', 'Sự cố trạm sạc'),
          tone: 'bad' as const,
          badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500',
        };
      case 'EXCESS_PAYMENT':
        return {
          label: t('refunds.reasons.EXCESS_PAYMENT', 'Thanh toán thừa'),
          tone: 'neutral' as const,
          badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          dot: 'bg-blue-500',
        };
      default:
        return {
          label: reason,
          tone: 'neutral' as const,
          badgeBg: 'bg-line-3 text-muted border-line-2',
          dot: 'bg-muted',
        };
    }
  };

  const failedAttemptsCount = useMemo(() => {
    if (!data?.items) return 0;
    return data.items.filter(
      (r) => r.status === 'PENDING' && ((r.requiresOwnerAction ?? r.requiresAdminAction) || r.attempts?.some((a) => a.status === 'FAILED'))
    ).length;
  }, [data?.items]);

  return (
    <>
      {/* 1. Double-Bezel Bento KPI Cards */}
      {s ? (
        <div className="mb-5 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          {/* Pending Card */}
          <div className="group relative overflow-hidden rounded-[18px] border border-line-2 bg-gradient-to-b from-surface to-surface-2/90 p-4 shadow-xs backdrop-blur-xs transition-all hover:border-warn/40">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.14),transparent_70%)] blur-xl" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                {t('refunds.kpi.pending', 'ĐANG CHỜ XỬ LÝ (PENDING)')}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                <IconClock size={14} />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-[26px] font-black tracking-tight text-ink font-mono">
                {s.totalPendingAmountVnd > 0 ? formatVndCompact(s.totalPendingAmountVnd) : `${s.totalPendingCount}`}
              </span>
              {s.totalPendingAmountVnd > 0 && (
                <span className="text-[12px] font-semibold text-faint">₫</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-warn">
              {s.totalPendingCount > 0 ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warn opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-warn" />
                  </span>
                  <span>
                    {t('refunds.kpi.pendingDelta', {
                      count: s.totalPendingCount,
                      defaultValue: `${s.totalPendingCount} khoản mở nghĩa vụ`,
                    })}
                  </span>
                </>
              ) : (
                <span className="text-muted">{t('refunds.kpi.pendingCountLabel', 'Không có khoản tồn đọng')}</span>
              )}
            </div>
          </div>

          {/* Succeeded Card */}
          <div className="group relative overflow-hidden rounded-[18px] border border-line-2 bg-gradient-to-b from-surface to-surface-2/90 p-4 shadow-xs backdrop-blur-xs transition-all hover:border-good/40">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.14),transparent_70%)] blur-xl" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                {t('refunds.kpi.succeeded', 'ĐÃ HOÀN TẤT')}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                <IconCheckCircle size={14} />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-[26px] font-black tracking-tight text-ink font-mono">
                {s.totalSucceededAmountVnd > 0 ? formatVndCompact(s.totalSucceededAmountVnd) : `${s.totalSucceededCount}`}
              </span>
              {s.totalSucceededAmountVnd > 0 && (
                <span className="text-[12px] font-semibold text-faint">₫</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-good">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-good" />
              <span>
                {s.totalSucceededAmountVnd > 0
                  ? t('refunds.kpi.succeededDelta', {
                      count: s.totalSucceededCount,
                      defaultValue: `${s.totalSucceededCount} hoàn tất`,
                    })
                  : t('refunds.kpi.succeededCountLabel', 'Đã xử lý thành công')}
              </span>
            </div>
          </div>

          {/* Total Obligations Card */}
          <div className="group relative overflow-hidden rounded-[18px] border border-line-2 bg-gradient-to-b from-surface to-surface-2/90 p-4 shadow-xs backdrop-blur-xs transition-all hover:border-brand/40">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.14),transparent_70%)] blur-xl" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                {t('refunds.kpi.total', 'TỔNG NGHĨA VỤ HOÀN')}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                <IconAlertTriangle size={14} />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-[26px] font-black tracking-tight text-ink font-mono">
                {s.totalPendingAmountVnd + s.totalSucceededAmountVnd > 0
                  ? formatVndCompact(s.totalPendingAmountVnd + s.totalSucceededAmountVnd)
                  : `${s.totalPendingCount + s.totalSucceededCount}`}
              </span>
              {s.totalPendingAmountVnd + s.totalSucceededAmountVnd > 0 && (
                <span className="text-[12px] font-semibold text-faint">₫</span>
              )}
            </div>
            <div className="mt-2 text-[11.5px] font-medium text-muted">
              {t('refunds.kpi.totalDelta', {
                count: s.totalPendingCount + s.totalSucceededCount,
                defaultValue: `${s.totalPendingCount + s.totalSucceededCount} tổng số hồ sơ`,
              })}
            </div>
          </div>

          {/* Action Required / Failed Attempts Card (Replaces Mode Card per §7.3) */}
          <div className="group relative overflow-hidden rounded-[18px] border border-line-2 bg-gradient-to-b from-surface to-surface-2/90 p-4 shadow-xs backdrop-blur-xs transition-all hover:border-rose-500/40">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.14),transparent_70%)] blur-xl" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                {t('refunds.kpi.actionRequired', 'CẦN CAN THIỆP (LỖI LẦN THỬ)')}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
                <IconAlertTriangle size={14} />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className={`text-[26px] font-black tracking-tight font-mono ${failedAttemptsCount > 0 ? 'text-bad' : 'text-ink'}`}>
                {failedAttemptsCount}
              </span>
              <span className="text-[12px] font-semibold text-faint">hồ sơ</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium">
              {failedAttemptsCount > 0 ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bad opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-bad" />
                  </span>
                  <span className="text-bad font-semibold">
                    {t('refunds.kpi.actionRequiredDelta', {
                      count: failedAttemptsCount,
                      defaultValue: `${failedAttemptsCount} lần thử thất bại`,
                    })}
                  </span>
                </>
              ) : (
                <span className="text-muted">
                  {t('refunds.kpi.actionRequiredZero', 'Không có lỗi tồn đọng')}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-[18px]" />
          ))}
        </div>
      )}

      {/* 2. Controls & Search Toolbar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          tabs={filterTabs}
          active={statusFilter}
          onChange={(k) => {
            setPage(0);
            setStatusFilter(k);
          }}
          accent="brand"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Range Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-line-2 bg-surface p-1 shadow-2xs">
            <span className="flex items-center gap-1 pl-2 pr-1 text-[11px] font-semibold text-faint">
              <IconCalendar size={13} />
            </span>
            {(
              [
                { key: 'all', label: 'Tất cả' },
                { key: 'today', label: 'Hôm nay' },
                { key: '7days', label: '7 ngày' },
                { key: '30days', label: '30 ngày' },
              ] as const
            ).map((df) => (
              <button
                key={df.key}
                type="button"
                onClick={() => {
                  setPage(0);
                  setDateFilter(df.key);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  dateFilter === df.key
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-muted hover:text-body hover:bg-surface-2'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-[260px]">
            <SearchInput
              value={search}
              onChange={(val) => {
                setPage(0);
                setSearch(val);
              }}
              placeholder={t('refunds.searchPlaceholder', 'Tìm mã refund, booking, tài xế…')}
            />
          </div>
        </div>
      </div>

      {/* 3. Double-Bezel Table Card */}
      <div className="rounded-[18px] border border-line-2 bg-surface shadow-xs overflow-hidden">
        {listQuery.isLoading || !data ? (
          <div className="p-4 space-y-2.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[920px]">
                {/* Header */}
                <div
                  className="grid border-b border-line-2 bg-surface-2/70 px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint"
                  style={{ gridTemplateColumns: GRID }}
                >
                  <span>{t('refunds.table.cols.id', 'MÃ REFUND')}</span>
                  <span>{t('refunds.table.cols.booking', 'ĐƠN ĐẶT CHỖ')}</span>
                  <span>{t('refunds.table.cols.station', 'TRẠM SẠC')}</span>
                  <span>{t('refunds.table.cols.reason', 'LÝ DO HOÀN')}</span>
                  <span className="text-right">{t('refunds.table.cols.amount', 'SỐ TIỀN')}</span>
                  <span className="text-center">{t('refunds.table.cols.status', 'TRẠNG THÁI')}</span>
                  <span>{t('refunds.table.cols.date', 'NGÀY PHÁT SINH')}</span>
                  <span className="text-right">{t('refunds.table.cols.actions', 'THAO TÁC')}</span>
                </div>

                {/* Rows */}
                {displayItems.length === 0 ? (
                  <EmptyState>{t('refunds.table.empty', 'Không có khoản hoàn tiền nào khớp với bộ lọc.')}</EmptyState>
                ) : (
                  displayItems.map((r) => {
                    const reasonInfo = getReasonLabel(r.reason);
                    const isPending = r.status === 'PENDING';
                    const refundKey = r.refundId || r.id;
                    const isGrace = r.reason === 'VOLUNTARY_GRACE';
                    const hasFailedAttempt = Boolean(r.attempts && r.attempts.some((a) => a.status === 'FAILED'));
                    const needsOwnerAction = Boolean((r.requiresOwnerAction ?? r.requiresAdminAction) || hasFailedAttempt);
                    const isAutoProcessing = isPending && isGrace && !needsOwnerAction && (r.executionPolicy === 'AUTO_FIRST_ATTEMPT' || !r.executionPolicy);

                    return (
                      <div
                        key={refundKey}
                        className="group grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium transition-colors hover:bg-surface-2/60"
                        style={{ gridTemplateColumns: GRID }}
                      >
                        {/* ID + Copy on Hover */}
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-brand">
                          <button
                            type="button"
                            onClick={(e) => copyRefundId(refundKey, e)}
                            className="group/btn flex items-center gap-1 text-brand hover:underline"
                            title={t('transactions.copied', 'Đã sao chép!')}
                          >
                            <span>{refundKey}</span>
                            {copiedId === refundKey ? (
                              <IconCheck size={12} className="text-good" />
                            ) : (
                              <IconCopy
                                size={12}
                                className="opacity-0 transition-opacity group-hover/btn:opacity-100 group-hover:opacity-60 text-muted"
                              />
                            )}
                          </button>
                          {r.attempts && r.attempts.length > 0 && (
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-normal ${
                                hasFailedAttempt ? 'bg-bad-soft text-bad font-semibold' : 'bg-line-3 text-muted'
                              }`}
                              title={t('refunds.table.attemptsTitle', {
                                count: r.attempts.length,
                                defaultValue: `${r.attempts.length} lần thử`,
                              })}
                            >
                              x{r.attempts.length}
                            </span>
                          )}
                        </div>

                        {/* Booking Code & Driver */}
                        <div>
                          <div className="font-mono text-[11.5px] font-semibold text-body">
                            {r.bookingCode || r.bookingId}
                          </div>
                          <div className="text-[11px] text-muted truncate">
                            {r.driverName || '—'}
                          </div>
                        </div>

                        {/* Station Name */}
                        <div className="truncate text-body text-[12px] font-medium pr-2">
                          {r.stationName || '—'}
                        </div>

                        {/* Reason Chip */}
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${reasonInfo.badgeBg}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${reasonInfo.dot}`} />
                            {reasonInfo.label}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="text-right font-mono font-bold text-good text-[13px] tracking-tight">
                          +{formatVnd(r.amount)}
                        </div>

                        {/* Status */}
                        <div className="text-center flex flex-col items-center gap-0.5">
                          {isPending ? (
                            needsOwnerAction ? (
                              <>
                                <StatusPill tone="bad" label={t('refunds.status.actionRequired', 'CẦN CAN THIỆP')} />
                                <span className="text-[10px] font-semibold text-bad">
                                  {hasFailedAttempt
                                    ? t('refunds.status.failedAttemptSub', 'Lỗi lần thử')
                                    : t('refunds.status.adminRequiredSub', 'Admin đối soát')}
                                </span>
                              </>
                            ) : isAutoProcessing ? (
                              <>
                                <StatusPill tone="brand" label={t('refunds.status.autoProcessing', 'TỰ ĐỘNG XỬ LÝ')} />
                                <span className="text-[10px] font-semibold text-brand">
                                  {t('refunds.status.autoProcessingSub', 'Hệ thống đang chạy')}
                                </span>
                              </>
                            ) : (
                              <>
                                <StatusPill tone="warn" label="PENDING" />
                                <span className="text-[10px] text-faint">{t('refunds.status.pendingSub', 'Chờ xử lý')}</span>
                              </>
                            )
                          ) : (
                            <>
                              <StatusPill tone="good" label="SUCCEEDED" />
                              <span className="text-[10px] font-semibold text-good">{t('refunds.status.succeededSub', 'Đã hoàn tất')}</span>
                            </>
                          )}
                        </div>

                        {/* Date & Time */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] font-semibold text-body">
                            {formatDateVn(r.decisionAt)}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[10.5px] text-faint">
                            <IconClock size={11} className="text-muted/60" />
                            {formatDateTimeVn(r.decisionAt).slice(11) || '00:00'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end">
                          {isPending ? (
                            needsOwnerAction ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleOpenDrawer(r)}
                                className="h-8 rounded-lg px-3 text-[11.5px] font-semibold border-bad/30 text-bad hover:bg-bad-soft/30 shadow-xs transition hover:scale-[1.02] active:scale-[0.98]"
                              >
                                {t('refunds.table.retryBtn', 'Thử lại / Can thiệp')}
                              </Button>
                            ) : isAutoProcessing ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDrawer(r)}
                                className="h-8 rounded-lg px-3 text-[11.5px] font-medium text-brand hover:text-brand hover:bg-brand/10 transition"
                              >
                                {t('refunds.table.viewDetailBtn', 'Xem chi tiết')}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleOpenDrawer(r)}
                                className="h-8 rounded-lg px-3 text-[11.5px] font-semibold shadow-xs transition hover:scale-[1.02] active:scale-[0.98]"
                              >
                                {t('refunds.table.processBtn', 'Xử lý hoàn')}
                              </Button>
                            )
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDrawer(r)}
                              className="h-8 rounded-lg px-3 text-[11.5px] text-muted hover:text-body hover:bg-surface-2 transition"
                            >
                              {t('refunds.table.viewDetailBtn', 'Xem chi tiết')}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border-t border-line-2 bg-surface/50 p-2.5">
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
            </div>
          </>
        )}
      </div>

      {/* 4. Execution Drawer */}
      <RefundExecutionDrawer
        open={isDrawerOpen}
        refund={selectedRefund}
        onClose={handleCloseDrawer}
        onSuccess={handleSuccessExecution}
      />
    </>
  );
}

