import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  formatDateVn,
  formatVnd,
  formatVndCompact,
  useApi,
  type PaymentMethod,
  type Transaction,
  type TransactionType,
} from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  FilterTabs,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconCopy,
  IconRefreshCw,
  IconSearch,
  IconTag,
  PageHeader,
  Pagination,
  ProgressBar,
  SearchInput,
  SegmentedControl,
  Skeleton,
  useToast,
  type FilterTab,
} from '@chargeops/ui';
import { RefundQueueTab } from '../features/refunds/RefundQueueTab';

const PAGE_SIZE = 12;
type TypeKey = TransactionType | 'all';
type MainTab = 'transactions' | 'refund-queue';
const GRID = '1.1fr 1.1fr 1.4fr 0.9fr 0.9fr 1.1fr 0.9fr';

const METHOD_COLORS: Record<PaymentMethod, string> = {
  VNPAY: '#5b54e8',
  MOMO: '#d63384',
  ATM: '#0d8a5a',
};

/**
 * Platform-wide transactions & financial ledger (Admin).
 * Redesigned with High-End Double-Bezel Bento Architecture & full i18n support.
 */
export function Transactions() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const toast = useToast();

  const [mainTab, setMainTab] = useState<MainTab>('transactions');
  const [type, setType] = useState<TypeKey>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const summaryQuery = useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: () => api.transactions.summary(),
  });

  const refundSummaryQuery = useQuery({
    queryKey: ['refunds', 'summary'],
    queryFn: () => api.refunds.summary(),
    enabled: Boolean(api.refunds),
  });

  const listQuery = useQuery({
    queryKey: ['transactions', 'list', { type, page }],
    queryFn: () => api.transactions.list({ type, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const resetTo = (fn: () => void) => {
    setPage(0);
    fn();
  };

  const typeTabs: FilterTab<TypeKey>[] = [
    { key: 'all', label: t('transactions.types.all', 'Tất cả') },
    { key: 'payment', label: t('transactions.types.payment', 'Thanh toán') },
    { key: 'refund', label: t('transactions.types.refund', 'Hoàn tiền') },
  ];

  const s = summaryQuery.data;
  const rawData = listQuery.data;

  // Filter by local search term (Tx ID, booking ID, or station name)
  const filteredItems = useMemo(() => {
    if (!rawData?.items) return [];
    if (!search.trim()) return rawData.items;
    const q = search.trim().toLowerCase();
    return rawData.items.filter(
      (tx) =>
        tx.id.toLowerCase().includes(q) ||
        tx.bookingId.toLowerCase().includes(q) ||
        tx.stationName.toLowerCase().includes(q),
    );
  }, [rawData?.items, search]);

  const total = search.trim() ? filteredItems.length : (rawData?.total ?? 0);
  const pendingRefundCount = refundSummaryQuery.data?.totalPendingCount ?? 0;

  return (
    <>
      {/* 1. Header with live heartbeat tag & quick refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <PageHeader
          title={t('console.nav.transactions.title', 'Giao dịch')}
          subtitle={t('console.nav.transactions.subtitle', 'Thanh toán và hoàn tiền toàn nền tảng.')}
        />
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
            </span>
            <span>{t('transactions.liveFeed', 'Dòng tiền thời gian thực')}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              summaryQuery.refetch();
              listQuery.refetch();
              refundSummaryQuery.refetch();
            }}
            disabled={summaryQuery.isFetching || listQuery.isFetching}
            className="flex items-center gap-1.5 h-[34px]"
          >
            <IconRefreshCw
              size={13}
              className={summaryQuery.isFetching || listQuery.isFetching ? 'animate-spin' : ''}
            />
            <span className="text-[12px]">{t('transactions.refreshBtn', 'Làm mới')}</span>
          </Button>
        </div>
      </div>

      {/* 2. Elevated Floating Segmented Pill Switcher */}
      <div className="mb-5">
        <SegmentedControl
          active={mainTab}
          onChange={(val) => setMainTab(val as MainTab)}
          segments={[
            {
              key: 'transactions',
              label: t('transactions.tabs.list', 'Lịch sử giao dịch & Biên nhận'),
            },
            {
              key: 'refund-queue',
              label: (
                <span className="flex items-center gap-2">
                  <span>{t('transactions.tabs.refundQueue', 'Hàng chờ hoàn tiền (FE-19)')}</span>
                  {pendingRefundCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-warn-soft border border-warn/30 px-2 py-0.5 text-[10px] font-extrabold text-warn-deep shadow-2xs">
                      {pendingRefundCount}
                    </span>
                  )}
                </span>
              ),
            },
          ]}
        />
      </div>

      {mainTab === 'refund-queue' ? (
        <RefundQueueTab />
      ) : (
        <>
          {/* 3. High-End Double-Bezel Bento Metrics Showcase */}
          {s ? (
            <div className="mb-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {/* Metric 1: Gross Platform Revenue */}
                <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-brand/30">
                  <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-brand/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                          {t('transactions.metrics.gross', 'TỔNG THU')}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-brand" />
                      </div>
                      <div className="text-[23px] font-extrabold text-ink tracking-tight font-mono">
                        {formatVndCompact(s.grossVnd)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                      <span className="text-body font-semibold flex items-center gap-1 text-good">
                        <span>↑</span>
                        <span>{t('transactions.metrics.payCountVal', { count: s.payCount })}</span>
                      </span>
                      <span className="text-faint">{t('transactions.types.payment', 'Thanh toán')}</span>
                    </div>
                  </div>
                </div>

                {/* Metric 2: Total Refunded */}
                <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-bad/30">
                  <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-bad/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                          {t('transactions.metrics.refunded', 'ĐÃ HOÀN TRẢ')}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-bad" />
                      </div>
                      <div className="text-[23px] font-extrabold text-bad-deep tracking-tight font-mono">
                        {formatVndCompact(s.refundedVnd)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                      <span className="text-bad font-semibold">
                        {t('transactions.metrics.refundCountVal', { count: s.refundCount })}
                      </span>
                      <span className="text-faint">
                        {s.grossVnd > 0 ? `${((s.refundedVnd / s.grossVnd) * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metric 3: Net Revenue */}
                <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-good/30">
                  <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-good/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                          {t('transactions.metrics.net', 'DOANH THU RÒNG')}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-good" />
                      </div>
                      <div className="text-[23px] font-extrabold text-good tracking-tight font-mono">
                        {formatVndCompact(s.netVnd)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                      <span className="text-good font-semibold">
                        {t('transactions.metrics.netDelta', 'Thu ròng khả dụng')}
                      </span>
                      <span className="text-faint font-mono">
                        {formatVnd(s.netVnd)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metric 4: Average Ticket Value */}
                <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-brand/30">
                  <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                          {t('transactions.metrics.avg', 'GIÁ TRỊ TB / ĐƠN')}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                      </div>
                      <div className="text-[23px] font-extrabold text-ink tracking-tight font-mono">
                        {formatVndCompact(s.avgVnd)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                      <span className="text-muted font-medium">
                        {t('transactions.metrics.avgDelta', 'Mỗi phiên sạc')}
                      </span>
                      <span className="text-faint font-mono">
                        {formatVnd(s.avgVnd)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Gateway Breakdown Strip (Double-Bezel Card) */}
              <div className="rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs">
                <div className="rounded-[calc(20px-4px)] bg-surface p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3.5">
                    <div>
                      <h4 className="text-[13.5px] font-bold text-ink">
                        {t('transactions.methods.title', 'Theo phương thức thanh toán')}
                      </h4>
                      <p className="text-[11.5px] text-muted">
                        {t('transactions.methods.subtitle', 'Tỷ trọng phân bổ dòng tiền trên từng kênh giao dịch')}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-faint">
                      {s.methodBreakdown.length} kênh hoạt động
                    </span>
                  </div>

                  {/* Multi-Segment Connected Progress Track */}
                  <div className="h-3 w-full rounded-full bg-line overflow-hidden flex mb-4">
                    {s.methodBreakdown.map((m) => (
                      <div
                        key={m.method}
                        style={{
                          width: `${Math.max(m.pct, 2)}%`,
                          backgroundColor: METHOD_COLORS[m.method] || '#5b54e8',
                        }}
                        className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                        title={`${m.method}: ${m.pct}%`}
                      />
                    ))}
                  </div>

                  {/* Gateway Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {s.methodBreakdown.map((m) => {
                      const color = METHOD_COLORS[m.method] || '#5b54e8';
                      return (
                        <div
                          key={m.method}
                          className="flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-2/40 hover:bg-surface-2 transition duration-150"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-3 w-3 rounded-[4px] shrink-0 shadow-2xs"
                              style={{ backgroundColor: color }}
                            />
                            <div>
                              <div className="text-[12.5px] font-bold text-ink">
                                {t(`transactions.methods.${m.method}`, m.method)}
                              </div>
                              <div className="text-[10.5px] text-faint font-mono">
                                Gateway: {m.method}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[14px] font-extrabold text-ink font-mono">
                              {m.pct}%
                            </div>
                            <div className="text-[10px] text-muted font-semibold">
                              {t('transactions.methods.share', { pct: m.pct, defaultValue: `Tỷ lệ ${m.pct}%` })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

          {/* 4. Controls & Search Island */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <FilterTabs
              tabs={typeTabs}
              active={type}
              onChange={(k) => resetTo(() => setType(k))}
              accent="brand"
            />

            <div className="w-full sm:w-[320px]">
              <SearchInput
                value={search}
                onChange={(val) => {
                  setPage(0);
                  setSearch(val);
                }}
                placeholder={t(
                  'transactions.searchPlaceholder',
                  'Tìm theo mã giao dịch, đơn đặt chỗ, trạm sạc...',
                )}
              />
            </div>
          </div>

          {/* 5. Refined Table Container */}
          <Card className="overflow-hidden rounded-2xl border border-line-2 bg-surface shadow-xs">
            {listQuery.isLoading || !rawData ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-[820px]">
                    <div
                      className="grid bg-surface-2 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-faint border-b border-hairline"
                      style={{ gridTemplateColumns: GRID }}
                    >
                      <span>{t('transactions.table.cols.txId', 'MÃ GD')}</span>
                      <span>{t('transactions.table.cols.bookingId', 'ĐẶT CHỖ')}</span>
                      <span>{t('transactions.table.cols.station', 'TRẠM SẠC')}</span>
                      <span>{t('transactions.table.cols.type', 'LOẠI')}</span>
                      <span>{t('transactions.table.cols.method', 'P.THỨC')}</span>
                      <span className="text-right">{t('transactions.table.cols.amount', 'SỐ TIỀN')}</span>
                      <span className="text-right">{t('transactions.table.cols.date', 'NGÀY')}</span>
                    </div>

                    {filteredItems.length === 0 ? (
                      <EmptyState className="py-12">
                        {t('transactions.table.empty', 'Không có giao dịch nào khớp bộ lọc.')}
                      </EmptyState>
                    ) : (
                      filteredItems.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
                    )}
                  </div>
                </div>

                <div className="border-t border-hairline px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[11.5px] text-faint">
                    {t('policyKB.docsLabel', 'Tổng cộng')}: <strong className="text-ink font-semibold">{total}</strong> {t('transactions.kpi.grossSub', { count: total, defaultValue: 'giao dịch' })}
                  </span>
                  <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </>
  );
}

/**
 * Individual Transaction Row with click-to-copy, glowing type indicator, and clean alignment.
 */
function TransactionRow({ tx }: { tx: Transaction }) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const [copiedId, setCopiedId] = useState(false);

  const isRefund = tx.type === 'refund';
  const color = isRefund ? 'var(--color-bad)' : 'var(--color-good)';

  const handleCopy = (val: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedId(true);
    toast(t('transactions.copied', { defaultValue: 'Đã sao chép mã' }), 'success');
    setTimeout(() => setCopiedId(false), 1500);
  };

  return (
    <div
      className="grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium transition-colors hover:bg-surface-2/60 group"
      style={{ gridTemplateColumns: GRID }}
    >
      {/* Transaction ID with hover copy */}
      <div className="flex items-center gap-1.5 min-w-0 pr-2">
        <span className="font-mono text-[11.5px] font-bold text-brand truncate">{tx.id}</span>
        <button
          type="button"
          onClick={() => handleCopy(tx.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-faint hover:text-ink rounded"
          title="Sao chép mã giao dịch"
        >
          {copiedId ? <IconCheck size={11} className="text-good" /> : <IconCopy size={11} />}
        </button>
      </div>

      {/* Booking Reference */}
      <div className="min-w-0 pr-2">
        <span className="font-mono text-[11px] text-muted truncate hover:text-ink transition cursor-pointer">
          {tx.bookingId}
        </span>
      </div>

      {/* Station */}
      <div className="truncate text-body text-[12px] pr-2" title={tx.stationName}>
        {tx.stationName}
      </div>

      {/* Type badge with glowing pulse dot */}
      <div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            color,
            backgroundColor: isRefund ? 'var(--color-bad-soft)' : 'var(--color-good-soft)',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {isRefund
            ? t('transactions.types.refund', 'Hoàn tiền')
            : t('transactions.types.payment', 'Thanh toán')}
        </span>
      </div>

      {/* Payment Gateway */}
      <div>
        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-body">
          <span
            className="h-2 w-2 rounded-[2px]"
            style={{ backgroundColor: METHOD_COLORS[tx.method] || '#5b54e8' }}
          />
          <span>{t(`transactions.methods.${tx.method}`, tx.method)}</span>
        </span>
      </div>

      {/* Amount with bold monospace alignment */}
      <div className="text-right font-mono font-bold text-[13px]" style={{ color }}>
        {tx.amountVnd < 0 ? '−' : '+'}
        {formatVnd(Math.abs(tx.amountVnd))}
      </div>

      {/* Date */}
      <div className="text-right text-[11px] text-faint font-mono">
        {formatDateVn(tx.date)}
      </div>
    </div>
  );
}
