import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Card,
  EmptyState,
  IconCheck,
  IconCopy,
  IconClock,
  IconCard,
  Pagination,
  SearchInput,
  Skeleton,
  StatusPill,
  Button,
  useToast,
} from '@chargeops/ui';
import {
  useApi,
  formatDateVn,
  formatTimeVn,
  formatVnd,
  formatVndCompact,
  type OwnerFinanceBooking,
} from '@chargeops/api';
import { ReceiptsDrawer } from './ReceiptsDrawer';

const PAGE_SIZE = 10;
const GRID = '1.2fr 1.3fr 1.1fr 1fr 1fr 1.1fr 1fr 0.9fr';

export interface FinanceLedgerTabProps {
  onRefreshRef?: (refetch: () => void) => void;
}

export function FinanceLedgerTab() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<OwnerFinanceBooking | null>(null);
  const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dedicated Summary Query with 30s auto polling
  const summaryQuery = useQuery({
    queryKey: ['ownerFinance', 'summary'],
    queryFn: () => api.ownerFinance.summary(),
    refetchInterval: 30000,
  });

  // Paginated List Query
  const listQuery = useQuery({
    queryKey: ['ownerFinance', 'list', { page, pageSize: PAGE_SIZE }],
    queryFn: () => api.ownerFinance.list({ page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const s = summaryQuery.data;
  const data = listQuery.data;

  const handleCopy = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(val);
    setCopiedId(val);
    toast(t('common.copied', 'Đã sao chép!'), 'success');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenReceipts = (booking: OwnerFinanceBooking) => {
    setSelectedBooking(booking);
    setIsReceiptsOpen(true);
  };

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!search.trim()) return data.items;
    const q = search.trim().toLowerCase();
    return data.items.filter(
      (b) =>
        b.bookingCode.toLowerCase().includes(q) ||
        b.bookingId.toLowerCase().includes(q) ||
        b.stationName.toLowerCase().includes(q),
    );
  }, [data?.items, search]);

  const total = search.trim() ? filteredItems.length : (data?.total ?? 0);

  return (
    <>
      {/* 1. Double-Bezel Bento KPI Showcase */}
      {s ? (
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* Card 1: Gross Collected */}
          <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-brand/30">
            <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-brand/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                    {t('finance.kpis.gross', 'TỔNG THU GHI NHẬN')}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-brand" />
                </div>
                <div className="text-[23px] font-extrabold text-ink tracking-tight font-mono">
                  {formatVndCompact(s.grossVnd)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                <span className="text-body font-semibold text-good flex items-center gap-1">
                  <span>↑</span>
                  <span>{s.paidBookings} đơn sạc</span>
                </span>
                <span className="text-faint">{formatVnd(s.grossVnd)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Refunded */}
          <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-bad/30">
            <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-bad/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                    {t('finance.kpis.refunded', 'ĐÃ HOÀN TRẢ')}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-bad" />
                </div>
                <div className="text-[23px] font-extrabold text-bad-deep tracking-tight font-mono">
                  {formatVndCompact(s.refundedVnd)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                <span className="text-bad font-semibold">
                  {s.grossVnd > 0 ? `${((s.refundedVnd / s.grossVnd) * 100).toFixed(1)}%` : '0%'}
                </span>
                <span className="text-faint">{formatVnd(s.refundedVnd)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Pending Obligations */}
          <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-warn/30">
            <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-warn/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                    {t('finance.kpis.pending', 'NGHĨA VỤ HOÀN CHỜ')}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-warn" />
                </div>
                <div className="text-[23px] font-extrabold text-warn-deep tracking-tight font-mono">
                  {formatVndCompact(s.pendingRefundVnd)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                <span className="text-warn font-semibold">Đang xử lý</span>
                <span className="text-faint">{formatVnd(s.pendingRefundVnd)}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Net Recorded Amount */}
          <div className="group relative rounded-[20px] p-1 bg-surface-2/80 border border-line-2 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-good/30">
            <div className="rounded-[calc(20px-4px)] bg-surface p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-good/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                    {t('finance.kpis.net', 'THU RÒNG GHI NHẬN')}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-good" />
                </div>
                <div className="text-[23px] font-extrabold text-good tracking-tight font-mono">
                  {formatVndCompact(s.netVnd)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] border-t border-hairline pt-2.5">
                <span className="text-good font-semibold">Thu ròng đối soát</span>
                <span className="text-faint">{formatVnd(s.netVnd)}</span>
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

      {/* 2. Search Toolbar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="w-full sm:w-[320px]">
          <SearchInput
            value={search}
            onChange={(val) => {
              setPage(0);
              setSearch(val);
            }}
            placeholder={t(
              'finance.searchPlaceholder',
              'Tìm theo mã đơn đặt chỗ, trạm sạc...',
            )}
          />
        </div>

        <div className="text-[12px] text-faint font-medium">
          {t('finance.totalRecords', { count: total, defaultValue: `Tổng cộng ${total} đơn đối soát` })}
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
              <div className="min-w-[860px]">
                <div
                  className="grid bg-surface-2 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-faint border-b border-hairline"
                  style={{ gridTemplateColumns: GRID }}
                >
                  <span>{t('finance.table.cols.booking', 'ĐƠN ĐẶT CHỖ')}</span>
                  <span>{t('finance.table.cols.station', 'TRẠM SẠC')}</span>
                  <span>{t('finance.table.cols.date', 'THỜI ĐIỂM')}</span>
                  <span className="text-right">{t('finance.table.cols.collected', 'TIỀN GÓI')}</span>
                  <span className="text-right">{t('finance.table.cols.refunded', 'ĐÃ HOÀN')}</span>
                  <span className="text-right">{t('finance.table.cols.net', 'THU RÒNG')}</span>
                  <span className="text-center">{t('finance.table.cols.refundStatus', 'REFUND')}</span>
                  <span className="text-right">{t('finance.table.cols.actions', 'THAO TÁC')}</span>
                </div>

                {filteredItems.length === 0 ? (
                  <EmptyState className="py-12">
                    {t('finance.table.empty', 'Không có đơn đặt chỗ nào khớp bộ lọc.')}
                  </EmptyState>
                ) : (
                  filteredItems.map((b) => {
                    const hasReceipts = Boolean(b.receipts && b.receipts.length > 0);
                    const bookingCode = b.bookingCode || b.bookingId;

                    return (
                      <div
                        key={b.bookingId}
                        className="grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium transition-colors hover:bg-surface-2/60 group"
                        style={{ gridTemplateColumns: GRID }}
                      >
                        {/* Booking Code with Copy */}
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className="font-mono text-[11.5px] font-bold text-brand truncate">
                            {bookingCode}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(bookingCode, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-faint hover:text-ink rounded"
                            title="Sao chép mã đơn"
                          >
                            {copiedId === bookingCode ? (
                              <IconCheck size={11} className="text-good" />
                            ) : (
                              <IconCopy size={11} />
                            )}
                          </button>
                        </div>

                        {/* Station Name */}
                        <div className="truncate text-body text-[12px] pr-2" title={b.stationName}>
                          {b.stationName}
                        </div>

                        {/* Date & Time */}
                        <div className="text-[11.5px] text-faint font-mono">
                          {b.paidAt ? (
                            <>
                              <div>{formatDateVn(b.paidAt)}</div>
                              <div className="text-[10px] text-muted">{formatTimeVn(b.paidAt)}</div>
                            </>
                          ) : (
                            '—'
                          )}
                        </div>

                        {/* Collected Amount */}
                        <div className="text-right font-mono font-bold text-[13px] text-good">
                          +{formatVnd(b.collectedAmount)}
                        </div>

                        {/* Refunded Amount */}
                        <div className="text-right font-mono text-[12.5px] text-bad">
                          {b.refundedAmount > 0 ? `−${formatVnd(b.refundedAmount)}` : '0₫'}
                        </div>

                        {/* Net Amount */}
                        <div className="text-right font-mono font-bold text-[13px] text-ink">
                          +{formatVnd(b.netRecordedAmount)}
                        </div>

                        {/* Refund Status */}
                        <div className="text-center">
                          {b.refundStatus === 'SUCCEEDED' ? (
                            <StatusPill tone="good" label="SUCCEEDED" />
                          ) : b.refundStatus === 'PENDING' ? (
                            <StatusPill tone="warn" label="PENDING" />
                          ) : (
                            <span className="text-[11px] text-faint font-mono">—</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenReceipts(b)}
                            className="h-7 px-2.5 text-[11px] font-semibold text-brand hover:bg-brand/10 rounded-lg"
                          >
                            <IconCard size={12} className="mr-1" />
                            <span>Chứng từ</span>
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
                {t('common.total', 'Tổng số')}: <strong className="text-ink font-semibold">{total}</strong> đơn
              </span>
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
            </div>
          </>
        )}
      </Card>

      {/* Receipts Drawer */}
      <ReceiptsDrawer
        open={isReceiptsOpen}
        booking={selectedBooking}
        onClose={() => {
          setIsReceiptsOpen(false);
          setSelectedBooking(null);
        }}
      />
    </>
  );
}
