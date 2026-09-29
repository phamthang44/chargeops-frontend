import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  BOOKING_STATUS,
  useApi,
  type ApiBookingStatus,
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
import { useOwnerStation } from '../context/OwnerStationContext';

const PAGE_SIZE = 10;
type FilterKey = ApiBookingStatus | 'all';

function getRangeWindow(range: BookingRange): { from?: string; to?: string } {
  if (range === 'all') return {};
  const now = new Date();
  const to = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  let fromDate: Date;
  if (range === 'today') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (range === '7d') {
    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    return {};
  }
  return {
    from: fromDate.toISOString(),
    to,
  };
}

export function Bookings() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const toast = useToast();
  const { selectedStationId } = useOwnerStation();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [range, setRange] = useState<BookingRange>('all');
  const [page, setPage] = useState(0);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const timeWindow = useMemo(() => getRangeWindow(range), [range]);

  const summaryQuery = useQuery({
    queryKey: ['ownerBookings', 'summary', { selectedStationId, range }],
    queryFn: () =>
      api.ownerBookings.summary({
        stationId: selectedStationId || undefined,
        from: timeWindow.from,
        to: timeWindow.to,
      }),
  });

  const listQuery = useQuery({
    queryKey: ['ownerBookings', 'list', { filter, selectedStationId, range, page }],
    queryFn: () =>
      api.ownerBookings.list({
        status: filter === 'all' ? undefined : filter,
        stationId: selectedStationId || undefined,
        from: timeWindow.from,
        to: timeWindow.to,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  // Reset to first page whenever the filter or range changes.
  const resetTo = (fn: () => void) => {
    setPage(0);
    fn();
  };

  const tabs = useMemo<FilterTab<FilterKey>[]>(() => {
    const s = summaryQuery.data;
    const order: FilterKey[] = [
      'all',
      'CONFIRMED',
      'CHECKED_IN',
      'CHARGING',
      'COMPLETED',
      'CANCELLED',
      'PENDING',
      'EXPIRED',
    ];
    return order.map((k) => {
      let count: number | undefined;
      if (s) {
        if (k === 'all') count = s.totalBookings;
        else if (k === 'CONFIRMED') count = s.confirmed;
        else if (k === 'CHECKED_IN') count = s.inSession;
        else if (k === 'CHARGING') count = undefined;
        else if (k === 'COMPLETED') count = s.completed;
        else if (k === 'CANCELLED') count = s.cancelled;
        else if (k === 'PENDING') count = s.pending;
        else if (k === 'EXPIRED') count = s.expired;
      }
      return {
        key: k,
        label: k === 'all' ? t('bookings.tabs.all') : BOOKING_STATUS[k]?.label ?? k,
        count,
      };
    });
  }, [summaryQuery.data, t]);

  const data = listQuery.data;
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader title={t('bookings.title')} subtitle={t('bookings.subtitle')} />

      {summaryQuery.data && <BookingSummaryStrip summary={summaryQuery.data} />}

      <BookingToolbar
        range={range}
        onRange={(r) => resetTo(() => setRange(r))}
        onExport={() => toast(t('bookings.exportToast'), 'info')}
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
              <BookingTable rows={data.items} onOpen={(b) => setSelectedBookingId(b.bookingId)} />
            </div>
            <div className="p-3 md:hidden">
              <BookingCards rows={data.items} onOpen={(b) => setSelectedBookingId(b.bookingId)} />
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
        )}
      </Card>

      <BookingDetailDrawer bookingId={selectedBookingId} onClose={() => setSelectedBookingId(null)} />
    </>
  );
}
