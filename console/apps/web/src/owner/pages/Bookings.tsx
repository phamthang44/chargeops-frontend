import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  BOOKING_STATUS,
  useApi,
  type Booking,
  type BookingSearchField,
  type BookingStatus,
} from '@chargeops/api';
import {
  Card,
  FilterTabs,
  PageHeader,
  Pagination,
  Skeleton,
  useToast,
  type FilterTab,
} from '@chargeops/ui';
import { BookingSummaryStrip } from '../features/bookings/BookingSummaryStrip';
import { BookingToolbar, type BookingRange } from '../features/bookings/BookingToolbar';
import { BookingTable } from '../features/bookings/BookingTable';
import { BookingCards } from '../features/bookings/BookingCards';
import { BookingDetailDrawer } from '../features/bookings/BookingDetailDrawer';

const PAGE_SIZE = 10;
type FilterKey = BookingStatus | 'all';

export function Bookings() {
  const api = useApi();
  const toast = useToast();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [searchIn, setSearchIn] = useState<BookingSearchField>('all');
  const [range, setRange] = useState<BookingRange>('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Booking | null>(null);

  const summaryQuery = useQuery({ queryKey: ['bookings', 'summary'], queryFn: () => api.bookings.summary() });
  const listQuery = useQuery({
    queryKey: ['bookings', 'list', { filter, search, searchIn, page }],
    queryFn: () => api.bookings.list({ status: filter, search, searchIn, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  // Reset to first page whenever the filter or search changes.
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

  return (
    <>
      <PageHeader title="Đặt chỗ" subtitle="Theo dõi và xử lý các lượt đặt chỗ tại trạm." />

      {summaryQuery.data && <BookingSummaryStrip summary={summaryQuery.data} />}

      <BookingToolbar
        search={search}
        onSearch={(v) => resetTo(() => setSearch(v))}
        searchIn={searchIn}
        onSearchIn={(f) => resetTo(() => setSearchIn(f))}
        range={range}
        onRange={setRange}
        onExport={() => toast('Đang xuất CSV… (demo)', 'info')}
      />

      <div className="mb-3.5">
        <FilterTabs tabs={tabs} active={filter} onChange={(k) => resetTo(() => setFilter(k))} />
      </div>

      <Card className="overflow-hidden">
        {listQuery.isLoading || !data ? (
          <div className="p-4">
            <Skeleton className="mb-2 h-9 w-full" />
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="mb-2 h-11 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <BookingTable rows={data.items} onOpen={setSelected} />
            </div>
            <div className="p-3 md:hidden">
              <BookingCards rows={data.items} onOpen={setSelected} />
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
        )}
      </Card>

      <BookingDetailDrawer booking={selected} onClose={() => setSelected(null)} />
    </>
  );
}
