import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  BOOKING_STATUS,
  formatTimeVn,
  formatVnd,
  useApi,
  type Booking,
  type BookingSearchField,
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
  Select,
  Skeleton,
  StatusPill,
  type FilterTab,
} from '@chargeops/ui';

const PAGE_SIZE = 10;
type FilterKey = BookingStatus | 'all';
const GRID = '0.9fr 1.2fr 1.1fr 0.8fr 1fr 0.9fr 0.9fr';

/** Platform-wide bookings (admin, all stations). */
export function Bookings() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [searchIn, setSearchIn] = useState<BookingSearchField>('all');
  const [page, setPage] = useState(0);

  const searchFields = [
    { value: 'all', label: t('bookings.searchFields.all') },
    { value: 'id', label: t('bookings.searchFields.id') },
    { value: 'station', label: t('bookings.searchFields.station') },
    { value: 'driver', label: t('bookings.searchFields.driver') },
    { value: 'charger', label: t('bookings.searchFields.charger') },
  ];

  const summaryQuery = useQuery({ queryKey: ['bookings', 'summary'], queryFn: () => api.bookings.summary() });
  const listQuery = useQuery({
    queryKey: ['bookings', 'list', { filter, search, searchIn, page }],
    queryFn: () => api.bookings.list({ status: filter, search, searchIn, page, pageSize: PAGE_SIZE }),
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
      label: t(`bookings.status.${k}`),
      count: !s ? undefined : k === 'all' ? s.total : s.byStatus[k],
    }));
  }, [summaryQuery.data, t]);

  const data = listQuery.data;
  const total = data?.total ?? 0;
  const s = summaryQuery.data;

  return (
    <>
      <PageHeader title={t('console.nav.bookings.title')} subtitle={t('console.nav.bookings.subtitle')} />

      {s && (
        <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-4">
          <MetricCard label={t('bookings.metrics.total')} value={String(s.total)} accent="#5b54e8" />
          <MetricCard label={t('bookings.metrics.completed')} value={String(s.byStatus.completed)} accent="#0d8a5a" />
          <MetricCard label={t('bookings.metrics.cancelled')} value={String(s.byStatus.cancelled)} accent="#c0392b" />
          <MetricCard label={t('bookings.metrics.pending')} value={String(s.byStatus.pending)} accent="#9a6b16" />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(v) => resetTo(() => setSearch(v))}
          placeholder={t('bookings.placeholder')}
          className="max-w-[320px] min-w-[200px] flex-1"
        />
        <Select
          value={searchIn}
          onChange={(v) => resetTo(() => setSearchIn(v as BookingSearchField))}
          options={searchFields}
          className="w-[142px]"
          aria-label={t('bookings.searchFieldLabel')}
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
                  className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
                  style={{ gridTemplateColumns: GRID }}
                >
                  <span>{t('bookings.table.cols.id')}</span>
                  <span>{t('bookings.table.cols.station')}</span>
                  <span>{t('bookings.table.cols.owner')}</span>
                  <span>{t('bookings.table.cols.charger')}</span>
                  <span>{t('bookings.table.cols.timeSlot')}</span>
                  <span className="text-right">{t('bookings.table.cols.amount')}</span>
                  <span className="text-center">{t('bookings.table.cols.status')}</span>
                </div>
                {data.items.length === 0 ? (
                  <EmptyState>{t('bookings.table.empty')}</EmptyState>
                ) : (
                  data.items.map((b) => <Row key={b.id} booking={b} />)
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

function Row({ booking: b }: { booking: Booking }) {
  const { t } = useTranslation('admin');
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
        <StatusPill tone={meta.tone} label={t(`bookings.status.${b.status}`, { defaultValue: meta.label })} />
      </span>
    </div>
  );
}
