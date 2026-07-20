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

const TYPE_TABS: FilterTab<TypeKey>[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'refund', label: 'Hoàn tiền' },
];
const METHOD_TABS: FilterTab<MethodKey>[] = [
  { key: 'all', label: 'Tất cả P.thức' },
  { key: 'VNPAY', label: 'VNPay' },
  { key: 'MOMO', label: 'Momo' },
  { key: 'ATM', label: 'Thẻ ATM' },
];

export function Revenue() {
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

  const s = summaryQuery.data;
  const data = listQuery.data;
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader title="Doanh thu" subtitle="Giao dịch, hoàn tiền và doanh thu ròng của bạn." />

      {/* KPI cards */}
      {s ? (
        <div className="mb-3.5 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
          <KpiCard label="TỔNG THU" value={formatVndCompact(s.grossVnd)} delta={`${s.payCount} giao dịch`} deltaClass="text-faint" />
          <KpiCard label="ĐÃ HOÀN" value={formatVndCompact(s.refundedVnd)} delta={`${s.refundCount} lượt hoàn`} deltaClass="text-faint" />
          <KpiCard label="DOANH THU RÒNG" value={formatVndCompact(s.netVnd)} delta="thu − hoàn" deltaClass="text-faint" />
          <KpiCard label="GIÁ TRỊ TB" value={formatVndCompact(s.avgVnd)} delta="mỗi giao dịch" deltaClass="text-faint" />
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
        <FilterTabs tabs={TYPE_TABS} active={type} onChange={(k) => resetTo(() => setType(k))} />
        <span className="mx-0.5 h-[22px] w-px bg-line" />
        <FilterTabs tabs={METHOD_TABS} active={method} onChange={(k) => resetTo(() => setMethod(k))} />
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
