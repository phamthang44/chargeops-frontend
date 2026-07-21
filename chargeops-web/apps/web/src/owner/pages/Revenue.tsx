import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  formatVndCompact,
  useApi,
  type PaymentMethod,
  type TransactionType,
} from '@chargeops/api';
import {
  Card,
  FilterTabs,
  KpiCard,
  PageHeader,
  Pagination,
  Skeleton,
  type FilterTab,
} from '@chargeops/ui';
import { TxInsights } from '../features/revenue/TxInsights';
import { TxTable, TxCards } from '../features/revenue/TxTable';

const PAGE_SIZE = 12;
type TypeKey = TransactionType | 'all';
type MethodKey = PaymentMethod | 'all';

export function Revenue() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const [type, setType] = useState<TypeKey>('all');
  const [method, setMethod] = useState<MethodKey>('all');
  const [page, setPage] = useState(0);

  const summaryQuery = useQuery({ queryKey: ['transactions', 'summary'], queryFn: () => api.transactions.summary() });
  const listQuery = useQuery({
    queryKey: ['transactions', 'list', { type, method, page }],
    queryFn: () => api.transactions.list({ type, method, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const resetTo = (fn: () => void) => {
    setPage(0);
    fn();
  };

  const typeTabs: FilterTab<TypeKey>[] = [
    { key: 'all', label: t('revenue.filters.types.all') },
    { key: 'payment', label: t('revenue.filters.types.payment') },
    { key: 'refund', label: t('revenue.filters.types.refund') },
  ];
  const methodTabs: FilterTab<MethodKey>[] = [
    { key: 'all', label: t('revenue.filters.methods.all') },
    { key: 'VNPAY', label: 'VNPay' },
    { key: 'MOMO', label: 'Momo' },
    { key: 'ATM', label: t('revenue.filters.methods.ATM') },
  ];

  const s = summaryQuery.data;
  const data = listQuery.data;
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader title={t('revenue.title')} subtitle={t('revenue.subtitle')} />

      {/* KPI cards */}
      {s ? (
        <div className="mb-3.5 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
          <KpiCard label={t('revenue.kpis.gross')} value={formatVndCompact(s.grossVnd)} delta={t('revenue.kpis.txCount', { count: s.payCount })} deltaClass="text-faint" />
          <KpiCard label={t('revenue.kpis.refunded')} value={formatVndCompact(s.refundedVnd)} delta={t('revenue.kpis.refundCount', { count: s.refundCount })} deltaClass="text-faint" />
          <KpiCard label={t('revenue.kpis.net')} value={formatVndCompact(s.netVnd)} delta={t('revenue.kpis.netSub')} deltaClass="text-faint" />
          <KpiCard label={t('revenue.kpis.avg')} value={formatVndCompact(s.avgVnd)} delta={t('revenue.kpis.avgSub')} deltaClass="text-faint" />
        </div>
      ) : (
        <div className="mb-3.5 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[96px] rounded-card" />
          ))}
        </div>
      )}

      {/* insights */}
      {s && <TxInsights summary={s} />}

      {/* filters */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <FilterTabs tabs={typeTabs} active={type} onChange={(k) => resetTo(() => setType(k))} />
        <span className="mx-0.5 h-[22px] w-px bg-line" />
        <FilterTabs tabs={methodTabs} active={method} onChange={(k) => resetTo(() => setMethod(k))} />
      </div>

      {/* table / cards */}
      <Card className="overflow-hidden">
        {listQuery.isLoading || !data ? (
          <div className="p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="mb-2 h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <TxTable rows={data.items} />
            </div>
            <div className="p-3 md:hidden">
              <TxCards rows={data.items} />
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
