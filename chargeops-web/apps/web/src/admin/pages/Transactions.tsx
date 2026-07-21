import { useTranslation } from 'react-i18next';
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

const METHOD_COLORS: Record<PaymentMethod, string> = {
  VNPAY: '#5b54e8',
  MOMO: '#d63384',
  ATM: '#0d8a5a',
};

/** Platform-wide transactions (admin). */
export function Transactions() {
  const { t } = useTranslation('admin');
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
    { key: 'all', label: t('transactions.types.all') },
    { key: 'payment', label: t('transactions.types.payment') },
    { key: 'refund', label: t('transactions.types.refund') },
  ];

  const s = summaryQuery.data;
  const data = listQuery.data;
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader title={t('console.nav.transactions.title')} subtitle={t('console.nav.transactions.subtitle')} />

      {s ? (
        <>
          <div className="mb-3.5 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
            <KpiCard label={t('transactions.metrics.gross')} value={formatVndCompact(s.grossVnd)} delta={t('transactions.metrics.payCountVal', { count: s.payCount })} deltaClass="text-faint" />
            <KpiCard label={t('transactions.metrics.refunded')} value={formatVndCompact(s.refundedVnd)} delta={t('transactions.metrics.refundCountVal', { count: s.refundCount })} deltaClass="text-faint" />
            <KpiCard label={t('transactions.metrics.net')} value={formatVndCompact(s.netVnd)} delta={t('transactions.metrics.netDelta')} deltaClass="text-faint" />
            <KpiCard label={t('transactions.metrics.avg')} value={formatVndCompact(s.avgVnd)} delta={t('transactions.metrics.avgDelta')} deltaClass="text-faint" />
          </div>
          <Card className="mb-3.5 p-4">
            <div className="mb-3.5 text-[13px] font-semibold">{t('transactions.methods.title')}</div>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
              {s.methodBreakdown.map((m) => (
                <div key={m.method}>
                  <div className="mb-[5px] flex justify-between text-[12px] font-medium">
                    <span className="flex items-center gap-[7px] text-body">
                      <span className="h-2 w-2 rounded-[3px]" style={{ background: METHOD_COLORS[m.method] }} />
                      {t(`transactions.methods.${m.method}`)}
                    </span>
                    <span className="font-semibold">{m.pct}%</span>
                  </div>
                  <ProgressBar value={m.pct} color={METHOD_COLORS[m.method]} className="h-[7px]" />
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
                  className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
                  style={{ gridTemplateColumns: GRID }}
                >
                  <span>{t('transactions.table.cols.txId')}</span>
                  <span>{t('transactions.table.cols.bookingId')}</span>
                  <span>{t('transactions.table.cols.station')}</span>
                  <span>{t('transactions.table.cols.type')}</span>
                  <span>{t('transactions.table.cols.method')}</span>
                  <span className="text-right">{t('transactions.table.cols.amount')}</span>
                  <span>{t('transactions.table.cols.date')}</span>
                </div>
                {data.items.length === 0 ? (
                  <EmptyState>{t('transactions.table.empty')}</EmptyState>
                ) : (
                  data.items.map((t) => <Row key={t.id} tx={t} />)
                )}
              </div>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}

function Row({ tx }: { tx: Transaction }) {
  const { t } = useTranslation('admin');
  const color = tx.type === 'refund' ? '#c0392b' : '#0d8a5a';
  return (
    <div
      className="grid items-center border-b border-hairline px-4 py-[11px] text-[12.5px] font-medium"
      style={{ gridTemplateColumns: GRID }}
    >
      <span className="font-mono text-[11px] font-semibold text-brand">{tx.id}</span>
      <span className="font-mono text-[11.5px] text-muted">{tx.bookingId}</span>
      <span className="text-body">{tx.stationName}</span>
      <span>
        <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold" style={{ color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {tx.type === 'refund' ? t('transactions.types.refund') : t('transactions.types.payment')}
        </span>
      </span>
      <span className="text-muted">{t(`transactions.methods.${tx.method}`)}</span>
      <span className="text-right font-semibold" style={{ color }}>
        {tx.amountVnd < 0 ? '−' : ''}
        {formatVnd(Math.abs(tx.amountVnd))}
      </span>
      <span className="text-[11.5px] text-faint">{formatDateVn(tx.date)}</span>
    </div>
  );
}
