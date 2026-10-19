import { useTranslation } from 'react-i18next';
import { useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import {
  BOOKING_STATUS,
  ApiError,
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
import { downloadBookingFile, getRangeWindow } from '../features/bookings/bookingExport';
import { ApiErrorState } from '../../shared/components/ApiErrorState';

const PAGE_SIZE = 10;
type FilterKey = ApiBookingStatus | 'all';

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
  const exportLock = useRef(false);
  const bookingFilter = {
    status: filter === 'all' ? undefined : filter,
    stationId: selectedStationId || undefined,
    ...timeWindow,
  };
  const exportMutation = useMutation({
    mutationFn: () => api.ownerBookings.export(bookingFilter),
    onSuccess: (file) => downloadBookingFile(file),
    onError: (error) => toast(t(error instanceof ApiError && error.code === 'BKG_EXPORT_LIMIT_EXCEEDED'
      ? 'bookings.exportLimitExceeded' : 'bookings.exportFailed'), 'error'),
    onSettled: () => { exportLock.current = false; },
  });
  const exportBookings = () => {
    if (exportLock.current) return;
    exportLock.current = true;
    exportMutation.mutate();
  };

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
        ...bookingFilter,
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
        label:
          k === 'all'
            ? t('bookings.tabs.all')
            : t(`bookings.status.${k}`, { defaultValue: BOOKING_STATUS[k]?.label ?? k }),
        count,
      };
    });
  }, [summaryQuery.data, t]);

  const data = listQuery.data;
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader title={t('bookings.title')} subtitle={t('bookings.subtitle')} />

      {summaryQuery.isError && <ApiErrorState error={summaryQuery.error} compact onRetry={() => void summaryQuery.refetch()} />}
      {summaryQuery.data && <BookingSummaryStrip summary={summaryQuery.data} />}

      <BookingToolbar
        range={range}
        onRange={(r) => resetTo(() => setRange(r))}
        onExport={exportBookings}
        exporting={exportMutation.isPending}
      />

      <div className="mb-3.5">
        <FilterTabs tabs={tabs} active={filter} onChange={(k) => resetTo(() => setFilter(k))} />
      </div>

      <Card className="overflow-hidden">
        {listQuery.isError && !data ? (
          <ApiErrorState error={listQuery.error} onRetry={() => void listQuery.refetch()} />
        ) : listQuery.isLoading || !data ? (
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
