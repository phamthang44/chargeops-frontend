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
  MetricCard,
  MetricStrip,
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
  const { t } = useTranslation(['owner', 'common']);
  const api = useApi();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<OwnerFinanceBooking | null>(null);
  const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);
  const [loadingReceiptBookingId, setLoadingReceiptBookingId] = useState<string | null>(null);
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
    toast(t('common:copied', 'Đã sao chép!'), 'success');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenReceipts = async (booking: OwnerFinanceBooking) => {
    setLoadingReceiptBookingId(booking.bookingId);
    try {
      const detail = await api.ownerFinance.get(booking.bookingId);
      setSelectedBooking(detail);
      setIsReceiptsOpen(true);
    } catch {
      toast(
        t('finance.receiptsDrawer.loadError', 'Không thể tải chứng từ. Vui lòng thử lại.'),
        'error',
      );
    } finally {
      setLoadingReceiptBookingId(null);
    }
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
      {s ? (
        <MetricStrip className="mb-5">
          <MetricCard
            label={t('finance.kpis.gross', 'Tổng thu ghi nhận')}
            value={formatVndCompact(s.grossVnd)}
            sub={`${formatVnd(s.grossVnd)} · ${s.paidBookings} ${t('finance.kpis.paidBookingsSuffix', 'đơn sạc')}`}
          />
          <MetricCard
            label={t('finance.kpis.refunded', 'Đã hoàn trả')}
            value={formatVndCompact(s.refundedVnd)}
            sub={`${formatVnd(s.refundedVnd)} · ${s.grossVnd > 0 ? ((s.refundedVnd / s.grossVnd) * 100).toFixed(1) : '0'}%`}
          />
          <MetricCard
            label={t('finance.kpis.pending', 'Nghĩa vụ hoàn chờ')}
            value={formatVndCompact(s.pendingRefundVnd)}
            sub={formatVnd(s.pendingRefundVnd)}
          />
          <MetricCard
            label={t('finance.kpis.net', 'Thu ròng ghi nhận')}
            value={formatVndCompact(s.netVnd)}
            sub={formatVnd(s.netVnd)}
          />
        </MetricStrip>
      ) : (
        <Skeleton className="mb-5 h-[84px] rounded-card" />
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

      {/* 3. Table Card (single outline) */}
      <Card className="overflow-hidden rounded-card shadow-xs">
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
                  className="grid bg-surface-2 px-4 py-3 text-[12px] font-medium text-muted border-b border-hairline"
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
                          <span className="tabular-nums text-[11.5px] font-bold text-brand truncate">
                            {bookingCode}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(bookingCode, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-faint hover:text-ink rounded"
                            title={t('finance.table.copyCodeTitle', 'Sao chép mã đơn')}
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
                        <div className="text-[11.5px] text-faint tabular-nums">
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
                        <div className="text-right tabular-nums font-bold text-[13px] text-good">
                          +{formatVnd(b.collectedAmount)}
                        </div>

                        {/* Refunded Amount */}
                        <div className="text-right tabular-nums text-[12.5px] text-bad">
                          {b.refundedAmount > 0 ? `−${formatVnd(b.refundedAmount)}` : '0₫'}
                        </div>

                        {/* Net Amount */}
                        <div className="text-right tabular-nums font-bold text-[13px] text-ink">
                          +{formatVnd(b.netRecordedAmount)}
                        </div>

                        {/* Refund Status */}
                        <div className="text-center">
                          {b.refundStatus === 'SUCCEEDED' ? (
                            <StatusPill tone="good" label={t('finance.refunds.tabs.succeeded', 'Đã hoàn tất')} />
                          ) : b.refundStatus === 'PENDING' ? (
                            <StatusPill tone="warn" label={t('finance.refunds.tabs.pending', 'Chờ xử lý')} />
                          ) : (
                            <span className="text-[11px] text-faint tabular-nums">—</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenReceipts(b)}
                            disabled={loadingReceiptBookingId === b.bookingId}
                            className="h-7 px-2.5 text-[11px] font-semibold text-brand hover:bg-brand/10 rounded-lg"
                          >
                            <IconCard size={12} className="mr-1" />
                            <span>
                              {loadingReceiptBookingId === b.bookingId
                                ? t('common:loading', 'Đang tải...')
                                : t('finance.table.receiptsBtn', 'Chứng từ')}
                            </span>
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
                {t('common:total', 'Tổng số')}: <strong className="text-ink font-semibold">{total}</strong> {t('finance.table.bookingsUnit', 'đơn')}
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
