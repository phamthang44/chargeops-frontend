import { useState } from 'react';
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
  Card,
  EmptyState,
  FilterTabs,
  KpiCard,
  PageHeader,
  Pagination,
  ProgressBar,
  Skeleton,
  type FilterTab,
} from '@chargeops/ui';

const PAGE_SIZE = 12;
type TypeKey = TransactionType | 'all';
const GRID = '1fr 1fr 1.2fr 0.8fr 0.9fr 1fr 0.9fr';

const METHOD: Record<PaymentMethod, { label: string; color: string }> = {
  VNPAY: { label: 'VNPay', color: '#5b54e8' },
  MOMO: { label: 'Momo', color: '#d63384' },
  ATM: { label: 'Thẻ ATM', color: '#0d8a5a' },
};

/** Platform-wide transactions (admin). */
export function Transactions() {
  const api = useApi();
  const [type, setType] = useState<TypeKey>('all');
  const [page, setPage] = useState(0);

  const summaryQuery = useQuery({ queryKey: ['transactions', 'summary'], queryFn: () => api.transactions.summary() });
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
    { key: 'all', label: 'Tất cả' },
    { key: 'payment', label: 'Thanh toán' },
    { key: 'refund', label: 'Hoàn tiền' },
  ];

  const s = summaryQuery.data;
  const data = listQuery.data;
  const total = data?.total ?? 0;
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <>
      <PageHeader title="Giao dịch" subtitle="Thanh toán và hoàn tiền toàn nền tảng." />

      {s ? (
        <>
          <div className="mb-3.5 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
            <KpiCard label="TỔNG THU" value={formatVndCompact(s.grossVnd)} delta={`${s.payCount} giao dịch`} deltaClass="text-faint" />
            <KpiCard label="ĐÃ HOÀN" value={formatVndCompact(s.refundedVnd)} delta={`${s.refundCount} lượt hoàn`} deltaClass="text-faint" />
            <KpiCard label="DOANH THU RÒNG" value={formatVndCompact(s.netVnd)} delta="thu − hoàn" deltaClass="text-faint" />
            <KpiCard label="GIÁ TRỊ TB" value={formatVndCompact(s.avgVnd)} delta="mỗi giao dịch" deltaClass="text-faint" />
          </div>
          <Card className="mb-3.5 p-4">
            <div className="mb-3.5 text-[13px] font-semibold">Theo phương thức</div>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
              {s.methodBreakdown.map((m) => (
                <div key={m.method}>
                  <div className="mb-[5px] flex justify-between text-[12px] font-medium">
                    <span className="flex items-center gap-[7px] text-body">
                      <span className="h-2 w-2 rounded-[3px]" style={{ background: METHOD[m.method].color }} />
                      {METHOD[m.method].label}
                    </span>
                    <span className="font-semibold">{m.pct}%</span>
                  </div>
                  <ProgressBar value={m.pct} color={METHOD[m.method].color} className="h-[7px]" />
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <div className="mb-3.5 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[96px] rounded-card" />
          ))}
        </div>
      )}

      <div className="mb-3.5">
        <FilterTabs tabs={typeTabs} active={type} onChange={(k) => resetTo(() => setType(k))} accent="brand" />
      </div>

      <Card className="overflow-hidden">
        {listQuery.isLoading || !data ? (
          <div className="p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="mb-2 h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div
                  className="grid bg-surface-2 px-4 py-[11px] font-mono text-[10px] font-semibold tracking-[0.05em] text-faint"
                  style={{ gridTemplateColumns: GRID }}
                >
                  <span>MÃ GD</span>
                  <span>ĐẶT CHỖ</span>
                  <span>TRẠM</span>
                  <span>LOẠI</span>
                  <span>P.THỨC</span>
                  <span className="text-right">SỐ TIỀN</span>
                  <span>NGÀY</span>
                </div>
                {data.items.length === 0 ? (
                  <EmptyState>Không có giao dịch nào khớp bộ lọc.</EmptyState>
                ) : (
                  data.items.map((t) => <Row key={t.id} tx={t} />)
                )}
              </div>
            </div>
            <Pagination
              label={`Hiển thị ${fromN}–${toN} / ${total}`}
              canPrev={page > 0}
              canNext={toN < total}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </Card>
    </>
  );
}

function Row({ tx: t }: { tx: Transaction }) {
  const color = t.type === 'refund' ? '#c0392b' : '#0d8a5a';
  return (
    <div
      className="grid items-center border-b border-hairline px-4 py-[11px] text-[12.5px] font-medium"
      style={{ gridTemplateColumns: GRID }}
    >
      <span className="font-mono text-[11px] font-semibold text-brand">{t.id}</span>
      <span className="font-mono text-[11.5px] text-muted">{t.bookingId}</span>
      <span className="text-body">{t.stationName}</span>
      <span>
        <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold" style={{ color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {t.type === 'refund' ? 'Hoàn tiền' : 'Thanh toán'}
        </span>
      </span>
      <span className="text-muted">{METHOD[t.method].label}</span>
      <span className="text-right font-semibold" style={{ color }}>
        {t.amountVnd < 0 ? '−' : ''}
        {formatVnd(Math.abs(t.amountVnd))}
      </span>
      <span className="text-[11.5px] text-faint">{formatDateVn(t.date)}</span>
    </div>
  );
}
