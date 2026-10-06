import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BOOKING_STATUS,
  formatDateVn,
  formatTimeVn,
  useApi,
} from '@chargeops/api';
import {
  Button,
  Card,
  DateTimeInput,
  EmptyState,
  IconRefreshCw,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../i18n';
import { useStaffStation } from '../context/StaffStationContext';
import { useStaffEquipment } from '../hooks/useStaffEquipment';

const PAGE_SIZE = 20;
/** Mã · Thời gian · Tài xế · SĐT · Cổng · Trạng thái — no plate column (see below). */
const GRID = '1fr 1.3fr 1.1fr 0.8fr 1fr 0.9fr';

/**
 * BKG-048 operational bookings, scoped to the assigned station and filtered by
 * connector / time window (Ops-05). Read-only: the DTO carries neither money
 * fields nor `driverPhone` (zero-leakage contract), and there is no plate data
 * anywhere yet — so the phone cell is a placeholder and the plate column is
 * omitted entirely instead of shipping an always-empty column. Contacting a
 * driver belongs in a dedicated flow, not in this list.
 */
export function StaffBookings() {
  const { t } = useTranslation('staff');
  const api = useApi();
  const { selectedStationId, currentStation } = useStaffStation();
  const stationId = selectedStationId || '';
  const equipment = useStaffEquipment(selectedStationId || undefined);

  const [connectorId, setConnectorId] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  // Any filter change collapses the paging window back to the first page.
  useEffect(() => {
    setPage(0);
  }, [connectorId, from, to, stationId]);

  const params = useMemo(() => {
    const p: { connectorId?: string; from?: string; to?: string; page: number; size: number } = {
      page,
      size: PAGE_SIZE,
    };
    if (connectorId !== 'all') p.connectorId = connectorId;
    if (from) p.from = new Date(from).toISOString();
    if (to) p.to = new Date(to).toISOString();
    return p;
  }, [connectorId, from, to, page]);

  const bookingsQ = useQuery({
    queryKey: ['staff', 'bookings', stationId, params],
    queryFn: () => api.staffOperations.listBookings(stationId, params),
    enabled: Boolean(stationId),
    placeholderData: (prev) => prev,
  });

  const connectorOptions = useMemo(
    () => [
      { value: 'all', label: t('bookings.filter.allConnectors') },
      ...equipment.connectors.map((c) => ({
        value: c.id,
        label: c.code || c.id,
      })),
    ],
    [equipment.connectors, t],
  );

  const rows = bookingsQ.data?.items ?? [];

  return (
    <>
      <PageHeader
        title={t('bookings.title')}
        subtitle={
          currentStation
            ? t('bookings.subtitle', { station: currentStation.name })
            : t('bookings.subtitleFallback')
        }
      />

      <Card className="mb-3 flex flex-wrap items-end gap-3 p-4">
        <div className="w-56">
          <Select
            value={connectorId}
            onChange={setConnectorId}
            options={connectorOptions}
            accent="owner"
            aria-label={t('bookings.filter.connector')}
          />
        </div>
        <div className="w-48">
          <DateTimeInput
            label={t('bookings.filter.from')}
            value={from}
            onChange={setFrom}
            accent="owner"
          />
        </div>
        <div className="w-48">
          <DateTimeInput label={t('bookings.filter.to')} value={to} onChange={setTo} accent="owner" />
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setConnectorId('all');
            setFrom('');
            setTo('');
          }}
        >
          <IconRefreshCw size={13} /> {t('bookings.filter.reset')}
        </Button>
        <span className="ml-auto text-[12px] font-medium text-muted">
          {t('bookings.filter.resultCount', { count: bookingsQ.data?.total ?? 0 })}
        </span>
      </Card>

      {bookingsQ.error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('bookings.loadError', { message: getApiErrorMessage(bookingsQ.error) })}
        </Card>
      ) : bookingsQ.isLoading ? (
        <Skeleton className="h-[380px] rounded-card" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <div className="min-w-[860px]">
            <div
              className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
              style={{ gridTemplateColumns: GRID }}
            >
              <span>{t('bookings.table.cols.id')}</span>
              <span>{t('bookings.table.cols.time')}</span>
              <span>{t('bookings.table.cols.driver')}</span>
              <span>{t('bookings.table.cols.phone')}</span>
              <span>{t('bookings.table.cols.connector')}</span>
              <span className="text-center">{t('bookings.table.cols.status')}</span>
            </div>

            {rows.length === 0 ? (
              <EmptyState>{t('bookings.emptyState')}</EmptyState>
            ) : (
              rows.map((b) => {
                const meta = BOOKING_STATUS[b.status] ?? { label: b.status, tone: 'neutral' as const };
                return (
                  <div
                    key={b.bookingId}
                    className="grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium last:border-b-0 hover:bg-row-hover"
                    style={{ gridTemplateColumns: GRID }}
                  >
                    <span className="font-mono text-[11.5px] font-semibold text-brand">
                      {b.bookingCode || b.bookingId}
                    </span>
                    <span className="text-muted">
                      {formatDateVn(b.startAt)} · {formatTimeVn(b.startAt)}–{formatTimeVn(b.endAt)}
                    </span>
                    <span className="truncate font-semibold">{b.driverDisplayName || '—'}</span>
                    <span className="font-mono text-muted" title={t('bookings.table.phoneHiddenHint')}>
                      {t('bookings.table.noData')}
                    </span>
                    <span className="text-muted">{b.connectorCode || b.connectorId}</span>
                    <span className="text-center">
                      <StatusPill tone={meta.tone} label={meta.label} />
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={bookingsQ.data?.total ?? 0}
            onPage={setPage}
          />
        </Card>
      )}
    </>
  );
}
