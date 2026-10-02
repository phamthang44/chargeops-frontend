import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  EmptyState,
  FilterTabs,
  IconAlertTriangle,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconCopy,
  Pagination,
  SearchInput,
  Skeleton,
  StatusPill,
  useToast,
  type FilterTab,
} from '@chargeops/ui';
import {
  useApi,
  formatDateVn,
  formatTimeVn,
  formatVnd,
  formatVndCompact,
  type OwnerRefund,
  type RefundStatus,
} from '@chargeops/api';
import { RefundAttemptsDrawer } from './RefundAttemptsDrawer';
import { OwnerRefundRetryModal } from './OwnerRefundRetryModal';

const PAGE_SIZE = 10;
type FilterKey = RefundStatus | 'all' | 'ACTION_REQUIRED';
const GRID = '1.1fr 1.2fr 1.2fr 1.1fr 1fr 1.1fr 0.9fr 1.2fr';

export function OwnerRefundsTab() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRefund, setSelectedRefund] = useState<OwnerRefund | null>(null);
  const [retryRefund, setRetryRefund] = useState<OwnerRefund | null>(null);
  const [isAttemptsDrawerOpen, setIsAttemptsDrawerOpen] = useState(false);
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dedicated Summary Query with 30s auto polling
  const summaryQuery = useQuery({
    queryKey: ['ownerRefunds', 'summary'],
    queryFn: () => api.ownerRefunds.summary(),
    refetchInterval: 30000,
  });

  // Paginated List Query
  const listQuery = useQuery({
    queryKey: [
      'ownerRefunds',
      'list',
      { status: statusFilter === 'ACTION_REQUIRED' ? 'PENDING' : statusFilter === 'all' ? undefined : statusFilter, page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      api.ownerRefunds.list({
        status: statusFilter === 'ACTION_REQUIRED' ? 'PENDING' : statusFilter === 'all' ? undefined : statusFilter,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const s = summaryQuery.data;
  const data = listQuery.data;

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    toast(t('common.copied', 'Đã sao chép!'), 'success');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenAttempts = (r: OwnerRefund) => {
    setSelectedRefund(r);
    setIsAttemptsDrawerOpen(true);
  };

  const handleOpenRetry = (r: OwnerRefund) => {
    setRetryRefund(r);
    setIsRetryModalOpen(true);
  };

  const handleRetrySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['ownerRefunds'] });
    queryClient.invalidateQueries({ queryKey: ['ownerFinance'] });
  };

  const filterTabs: FilterTab<FilterKey>[] = [
    { key: 'all', label: t('finance.refunds.tabs.all', 'Tất cả hồ sơ') },
    { key: 'PENDING', label: t('finance.refunds.tabs.pending', 'Đang chờ xử lý (PENDING)') },
    { key: 'SUCCEEDED', label: t('finance.refunds.tabs.succeeded', 'Đã hoàn tất (SUCCEEDED)') },
    {
      key: 'ACTION_REQUIRED',
      label: t('finance.refunds.tabs.actionRequired', 'Cần Owner thử lại'),
      count: s && s.requiresOwnerActionCount > 0 ? s.requiresOwnerActionCount : undefined,
    },
  ];

  // Client search and filter for ACTION_REQUIRED
  const displayItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;
    if (statusFilter === 'ACTION_REQUIRED') {
      items = items.filter((r) => r.requiresOwnerAction);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (r) =>
          r.refundId.toLowerCase().includes(q) ||
          r.bookingCode.toLowerCase().includes(q) ||
          r.bookingId.toLowerCase().includes(q) ||
          r.stationId.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data?.items, statusFilter, search]);

  const total = search.trim() || statusFilter === 'ACTION_REQUIRED' ? displayItems.length : (data?.total ?? 0);

  return (
    <>
      {/* 1. Double-Bezel Bento KPI Cards */}
      {s ? (
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* Card 1: Pending */}
          <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-warn/30">
            <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-warn/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                    {t('finance.refunds.kpi.pending', 'ĐANG CHỜ XỬ LÝ')}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-warn" />
                </div>
                <div className="text-[23px] font-extrabold text-warn-deep tracking-tight font-mono">
                  {s.totalPendingCount}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                <span className="text-warn font-semibold">Nghĩa vụ mở</span>
                <span className="text-faint">{formatVndCompact(s.pendingRefundAmountVnd)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Succeeded */}
          <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-good/30">
            <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-good/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                    {t('finance.refunds.kpi.succeeded', 'ĐÃ HOÀN TẤT')}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-good" />
                </div>
                <div className="text-[23px] font-extrabold text-good tracking-tight font-mono">
                  {s.totalSucceededCount}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                <span className="text-good font-semibold">Thành công</span>
                <span className="text-faint">{formatVndCompact(s.totalRefundAmountVnd)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Action Required (Failed Attempts) */}
          <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-bad/30">
            <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-bad/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                    {t('finance.refunds.kpi.actionRequired', 'CẦN OWNER RETRY')}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-bad animate-ping" />
                </div>
                <div className={`text-[23px] font-extrabold tracking-tight font-mono ${s.requiresOwnerActionCount > 0 ? 'text-bad' : 'text-ink'}`}>
                  {s.requiresOwnerActionCount}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                <span className={s.requiresOwnerActionCount > 0 ? 'text-bad font-semibold' : 'text-muted'}>
                  {s.requiresOwnerActionCount > 0 ? 'Cần can thiệp' : 'Không có lỗi'}
                </span>
                <span className="text-faint">{s.totalFailedAttemptsCount} lần thử lỗi</span>
              </div>
            </div>
          </div>

          {/* Card 4: Total Refund Amount */}
          <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-brand/30">
            <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-brand/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                    {t('finance.refunds.kpi.totalAmount', 'TỔNG TIỀN HOÀN')}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-brand" />
                </div>
                <div className="text-[23px] font-extrabold text-ink tracking-tight font-mono">
                  {formatVndCompact(s.totalRefundAmountVnd)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                <span className="text-body font-semibold">Toàn bộ trạm</span>
                <span className="text-faint">{formatVnd(s.totalRefundAmountVnd)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[105px] rounded-[20px]" />
          ))}
        </div>
      )}

      {/* 2. Controls & Search Toolbar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs
          tabs={filterTabs}
          active={statusFilter}
          onChange={(k) => {
            setPage(0);
            setStatusFilter(k);
          }}
          accent="brand"
        />

        <div className="w-full sm:w-[280px]">
          <SearchInput
            value={search}
            onChange={(val) => {
              setPage(0);
              setSearch(val);
            }}
            placeholder={t('finance.refunds.searchPlaceholder', 'Tìm mã refund, booking, trạm...')}
          />
        </div>
      </div>

      {/* 3. Double-Bezel Table Card */}
      <Card className="overflow-hidden rounded-2xl border border-line-2 bg-surface shadow-xs">
        {listQuery.isLoading || !data ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div
                  className="grid bg-surface-2 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-faint border-b border-hairline"
                  style={{ gridTemplateColumns: GRID }}
                >
                  <span>{t('finance.refunds.table.cols.id', 'MÃ REFUND')}</span>
                  <span>{t('finance.refunds.table.cols.booking', 'ĐƠN ĐẶT CHỖ')}</span>
                  <span>{t('finance.refunds.table.cols.station', 'TRẠM SẠC')}</span>
                  <span>{t('finance.refunds.table.cols.reason', 'LÝ DO HOÀN')}</span>
                  <span className="text-right">{t('finance.refunds.table.cols.amount', 'SỐ TIỀN')}</span>
                  <span className="text-center">{t('finance.refunds.table.cols.status', 'TRẠNG THÁI')}</span>
                  <span className="text-center">{t('finance.refunds.table.cols.attempts', 'LẦN THỬ')}</span>
                  <span className="text-right">{t('finance.refunds.table.cols.actions', 'THAO TÁC')}</span>
                </div>

                {displayItems.length === 0 ? (
                  <EmptyState className="py-12">
                    {t('finance.refunds.table.empty', 'Không có khoản hoàn tiền nào khớp bộ lọc.')}
                  </EmptyState>
                ) : (
                  displayItems.map((r) => {
                    const isPending = r.status === 'PENDING';
                    const hasFailedAttempt = Boolean(r.attempts && r.attempts.some((a) => a.status === 'FAILED'));

                    return (
                      <div
                        key={r.refundId}
                        className="grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium transition-colors hover:bg-surface-2/60 group"
                        style={{ gridTemplateColumns: GRID }}
                      >
                        {/* Refund ID with copy */}
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className="font-mono text-[11px] font-bold text-brand truncate">
                            {r.refundId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(r.refundId, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-faint hover:text-ink rounded"
                            title="Sao chép mã"
                          >
                            {copiedId === r.refundId ? (
                              <IconCheck size={11} className="text-good" />
                            ) : (
                              <IconCopy size={11} />
                            )}
                          </button>
                        </div>

                        {/* Booking Code */}
                        <div className="font-mono text-[11.5px] font-semibold text-body truncate pr-2">
                          {r.bookingCode || r.bookingId}
                        </div>

                        {/* Station */}
                        <div className="text-[12px] text-body truncate pr-2 font-mono">
                          #{r.stationId}
                        </div>

                        {/* Reason */}
                        <div>
                          <span className="inline-flex items-center rounded-full bg-line-3 px-2 py-0.5 text-[10.5px] font-semibold text-body">
                            {r.reason === 'VOLUNTARY_GRACE'
                              ? 'Ân hạn 10 phút'
                              : r.reason === 'STATION_UNAVAILABLE'
                              ? 'Trạm không phục vụ'
                              : r.reason}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="text-right font-mono font-bold text-[13px] text-good">
                          +{formatVnd(r.amount)}
                        </div>

                        {/* Status */}
                        <div className="text-center">
                          {isPending ? (
                            r.requiresOwnerAction ? (
                              <StatusPill tone="bad" label="CẦN RETRY" />
                            ) : (
                              <StatusPill tone="warn" label="PENDING" />
                            )
                          ) : (
                            <StatusPill tone="good" label="SUCCEEDED" />
                          )}
                        </div>

                        {/* Attempts count */}
                        <div className="text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10.5px] font-mono font-bold ${
                              hasFailedAttempt
                                ? 'bg-bad-soft text-bad border border-bad/30'
                                : 'bg-surface-2 text-muted border border-hairline'
                            }`}
                          >
                            x{r.attempts?.length ?? 1}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1.5">
                          {r.requiresOwnerAction && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenRetry(r)}
                              className="h-7 px-2 text-[11px] font-bold border-bad/30 text-bad hover:bg-bad-soft/30 rounded-lg shadow-2xs"
                            >
                              Thử lại
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenAttempts(r)}
                            className="h-7 px-2 text-[11px] font-semibold text-muted hover:text-ink rounded-lg"
                          >
                            Lịch sử
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border-t border-hairline px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11.5px] text-faint">
                {t('common.total', 'Tổng số')}: <strong className="text-ink font-semibold">{total}</strong> hồ sơ
              </span>
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
            </div>
          </>
        )}
      </Card>

      {/* Drawers & Modals */}
      <RefundAttemptsDrawer
        open={isAttemptsDrawerOpen}
        refund={selectedRefund}
        onClose={() => {
          setIsAttemptsDrawerOpen(false);
          setSelectedRefund(null);
        }}
        onOpenRetry={handleOpenRetry}
      />

      <OwnerRefundRetryModal
        open={isRetryModalOpen}
        refund={retryRefund}
        onClose={() => {
          setIsRetryModalOpen(false);
          setRetryRefund(null);
        }}
        onSuccess={handleRetrySuccess}
      />
    </>
  );
}
