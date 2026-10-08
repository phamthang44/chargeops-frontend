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
  IconArrowRight,
  IconCalendar,
  IconRefreshCw,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
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
  const total = bookingsQ.data?.total ?? 0;
  const isFiltered = connectorId !== 'all' || Boolean(from || to);

  const resetFilters = () => {
    setConnectorId('all');
    setFrom('');
    setTo('');
  };

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

      <section
        aria-label={t('bookings.filter.eyebrow')}
        className="mb-4 rounded-panel border border-line-2 bg-surface-2/70 p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        style={{ animation: 'riseIn .6s cubic-bezier(0.32,0.72,0,1) both' }}
      >
        <div className="relative rounded-[8px] border border-hairline bg-surface px-4 pb-4 pt-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {/* Clipped ambient glow — glass plate resting in a machined tray */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
            <div className="absolute -top-24 right-[-5rem] h-56 w-56 rounded-full bg-owner/[0.08] blur-3xl" />
            <div className="absolute bottom-[-7rem] left-[-6rem] h-48 w-48 rounded-full bg-brand/[0.05] blur-3xl" />
          </div>

          {/* Header band — eyebrow · live count · reset island */}
          <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-owner-border bg-owner-soft px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-owner-deep">
              <IconCalendar size={10} strokeWidth={2.6} />
              {t('bookings.filter.eyebrow')}
            </span>

            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1.5" role="status">
                <span className="sr-only">{t('bookings.filter.resultCount', { count: total })}</span>
                <span className="font-mono text-[16px] font-semibold tabular-nums text-ink" aria-hidden="true">
                  {total}
                </span>
                <span className="text-[11px] font-medium text-faint" aria-hidden="true">
                  {t('bookings.filter.countNoun')}
                </span>
              </div>
              <span className="h-4 w-px bg-line-2" aria-hidden="true" />
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                disabled={!isFiltered}
                className="group -mr-1.5"
              >
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-line-2 bg-surface-2 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-180">
                  <IconRefreshCw size={11} strokeWidth={2.2} />
                </span>
                {t('bookings.filter.reset')}
              </Button>
            </div>
          </div>

          {/* Controls — connector · range with directional cue */}
          <div className="relative mt-3.5 flex flex-wrap items-start gap-3">
            <div className="w-full sm:w-52">
              <div className="mb-1.5 text-[12px] font-semibold text-body">
                {t('bookings.filter.connector')}
              </div>
              <Select
                value={connectorId}
                onChange={setConnectorId}
                options={connectorOptions}
                accent="owner"
                aria-label={t('bookings.filter.connector')}
              />
            </div>

            <div className="flex w-full flex-wrap items-start gap-x-3 gap-y-3 sm:flex-1">
              <div className="w-full min-w-0 sm:w-auto sm:min-w-[176px] sm:flex-1">
                <DateTimeInput
                  label={t('bookings.filter.from')}
                  value={from}
                  onChange={setFrom}
                  accent="owner"
                  showEmptyHint={false}
                />
              </div>
              <div className="mt-[37px] hidden shrink-0 sm:block" aria-hidden="true">
                <IconArrowRight size={14} className="text-faint" />
              </div>
              <div className="w-full min-w-0 sm:w-auto sm:min-w-[176px] sm:flex-1">
                <DateTimeInput
                  label={t('bookings.filter.to')}
                  value={to}
                  onChange={setTo}
                  accent="owner"
                  showEmptyHint={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {bookingsQ.error ? (
        <ApiErrorState
          error={bookingsQ.error}
          eyebrow={t('bookings.error.eyebrow', { defaultValue: 'Lịch đặt chỗ' })}
          title={t('bookings.error.title', { defaultValue: 'Không thể tải danh sách lịch đặt chỗ' })}
          onRetry={() => bookingsQ.refetch()}
          isRetrying={bookingsQ.isFetching}
        />
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

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </Card>
      )}
    </>
  );
}
