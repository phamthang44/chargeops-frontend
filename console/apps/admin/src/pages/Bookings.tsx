import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  BOOKING_STATUS,
  formatTimeVn,
  formatVnd,
  useApi,
  type Booking,
  type BookingStatus,
} from '@chargeops/api';
import {
  Card,
  EmptyState,
  FilterTabs,
  MetricCard,
  PageHeader,
  Pagination,
  SearchInput,
  Skeleton,
  StatusPill,
  type FilterTab,
} from '@chargeops/ui';

const PAGE_SIZE = 10;
type FilterKey = BookingStatus | 'all';
const GRID = '0.9fr 1.2fr 1.1fr 0.8fr 1fr 0.9fr 0.9fr';

/** Platform-wide bookings (admin, all stations). */
export function Bookings() {
  const api = useApi();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const summaryQuery = useQuery({ queryKey: ['bookings', 'summary'], queryFn: () => api.bookings.summary() });
  const listQuery = useQuery({
    queryKey: ['bookings', 'list', { filter, search, page }],
    queryFn: () => api.bookings.list({ status: filter, search, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const resetTo = (fn: () => void) => {
    setPage(0);
    fn();
  };

  const tabs = useMemo<FilterTab<FilterKey>[]>(() => {
    const s = summaryQuery.data;
    const order: FilterKey[] = ['all', 'pending', 'confirmed', 'checkedin', 'charging', 'completed', 'cancelled'];
    return order.map((k) => ({
      key: k,
      label: k === 'all' ? 'Tất cả' : BOOKING_STATUS[k].label,
      count: !s ? undefined : k === 'all' ? s.total : s.byStatus[k],
    }));
  }, [summaryQuery.data]);

  const data = listQuery.data;
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);
  const s = summaryQuery.data;

  return (
    <>
      <PageHeader title="Đặt chỗ toàn nền tảng" subtitle="Mọi lượt đặt trên tất cả các trạm." />

      {s && (
        <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-4">
          <MetricCard label="TỔNG LƯỢT ĐẶT" value={String(s.total)} accent="#5b54e8" />
          <MetricCard label="HOÀN TẤT" value={String(s.byStatus.completed)} accent="#0d8a5a" />
          <MetricCard label="ĐÃ HỦY" value={String(s.byStatus.cancelled)} accent="#c0392b" />
          <MetricCard label="CHỜ THANH TOÁN" value={String(s.byStatus.pending)} accent="#9a6b16" />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(v) => resetTo(() => setSearch(v))}
          placeholder="Lọc theo mã, trạm, trụ…"
          className="max-w-[320px] min-w-[200px] flex-1"
        />
      </div>
      <div className="mb-3.5">
        <FilterTabs tabs={tabs} active={filter} onChange={(k) => resetTo(() => setFilter(k))} accent="brand" />
      </div>

      <Card className="overflow-hidden">
        {listQuery.isLoading || !data ? (
          <div className="p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="mb-2 h-11 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[820px]">
                <div
                  className="grid bg-surface-2 px-4 py-[11px] font-mono text-[10px] font-semibold tracking-[0.05em] text-faint"
                  style={{ gridTemplateColumns: GRID }}
                >
                  <span>MÃ</span>
                  <span>TRẠM</span>
                  <span>CHỦ TRẠM</span>
                  <span>TRỤ</span>
                  <span>KHUNG GIỜ</span>
                  <span className="text-right">SỐ TIỀN</span>
                  <span className="text-center">TRẠNG THÁI</span>
                </div>
                {data.items.length === 0 ? (
                  <EmptyState>Không có lượt đặt nào khớp bộ lọc.</EmptyState>
                ) : (
                  data.items.map((b) => <Row key={b.id} booking={b} />)
                )}
              </div>
            </div>
            <Pagination
              label={`Hiển thị ${from}–${to} / ${total}`}
              canPrev={page > 0}
              canNext={to < total}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </Card>
    </>
  );
}

function Row({ booking: b }: { booking: Booking }) {
  const meta = BOOKING_STATUS[b.status];
  return (
    <div
      className="grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium"
      style={{ gridTemplateColumns: GRID }}
    >
      <span className="font-mono text-[11.5px] font-semibold text-brand">{b.id}</span>
      <span className="font-semibold">{b.stationName}</span>
      <span className="text-muted">{b.ownerName}</span>
      <span className="text-muted">{b.chargerId}</span>
      <span className="text-muted">
        {formatTimeVn(b.startAt)}–{formatTimeVn(b.endAt)}
      </span>
      <span className="text-right font-semibold">{formatVnd(b.amountVnd)}</span>
      <span className="text-center">
        <StatusPill tone={meta.tone} label={meta.label} />
      </span>
    </div>
  );
}
