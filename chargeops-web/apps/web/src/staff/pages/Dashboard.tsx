import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApi, type StaffDashboardBookingView, type StaffDashboardTicketView } from '@chargeops/api';
import { Button, IconRefreshCw, KpiCard, PageHeader, Skeleton } from '@chargeops/ui';
import { useStaffStation } from '../context/StaffStationContext';

const PAGE_SIZE = 5;
const POLL_INTERVAL = () => (typeof document !== 'undefined' && document.visibilityState === 'visible' ? 30_000 : false);

function formatTime(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function Dashboard() {
  const { t } = useTranslation('staffDashboard');
  const api = useApi();
  const navigate = useNavigate();
  const { selectedStationId, currentStation } = useStaffStation();
  const [bookingView, setBookingView] = useState<StaffDashboardBookingView>('UPCOMING');
  const [ticketView, setTicketView] = useState<StaffDashboardTicketView>('UNCLAIMED');
  const [bookingPage, setBookingPage] = useState(1);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const stationId = selectedStationId;

  const summary = useQuery({
    queryKey: ['staff-dashboard', 'summary', stationId],
    queryFn: () => api.dashboard.staffSummary(stationId!),
    enabled: Boolean(stationId), refetchInterval: POLL_INTERVAL, refetchOnWindowFocus: true,
  });
  const bookings = useQuery({
    queryKey: ['staff-dashboard', 'bookings', stationId, bookingView, bookingPage],
    queryFn: () => api.dashboard.staffBookings(stationId!, bookingView, bookingPage, PAGE_SIZE),
    enabled: Boolean(stationId), refetchInterval: POLL_INTERVAL, refetchOnWindowFocus: true,
  });
  const equipment = useQuery({
    queryKey: ['staff-dashboard', 'equipment', stationId, equipmentPage],
    queryFn: () => api.dashboard.staffEquipment(stationId!, equipmentPage, PAGE_SIZE),
    enabled: Boolean(stationId), refetchInterval: POLL_INTERVAL, refetchOnWindowFocus: true,
  });
  const tickets = useQuery({
    queryKey: ['staff-dashboard', 'tickets', stationId, ticketView, ticketPage],
    queryFn: () => api.dashboard.staffTickets(stationId!, ticketView, ticketPage, PAGE_SIZE),
    enabled: Boolean(stationId), refetchInterval: POLL_INTERVAL, refetchOnWindowFocus: true,
  });

  const refresh = () => {
    void Promise.all([summary.refetch(), bookings.refetch(), equipment.refetch(), tickets.refetch()]);
  };
  const isRefreshing = [summary, bookings, equipment, tickets].some((query) => query.isFetching);

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={summary.data?.stationName || currentStation?.name || t('subtitle')}
        action={
          <Button variant="secondary" size="sm" onClick={refresh} disabled={isRefreshing}
            icon={<IconRefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />}>
            {isRefreshing ? t('refreshing') : t('refresh')}
          </Button>
        }
      />

      {!stationId ? (
        <StateCard message={t('states.noStation')} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <div className="flex flex-wrap items-center gap-2">
              <span>{summary.data?.address || currentStation?.address || t('stationAddressUnavailable')}</span>
              {summary.data?.operationalStatus && <StatusPill value={summary.data.operationalStatus} />}
            </div>
            <span>{summary.data?.generatedAt ? t('updatedAt', { time: formatTime(summary.data.generatedAt) }) : ''}</span>
          </div>

          <section aria-label={t('kpi.section')} className="grid grid-cols-2 gap-[13px] xl:grid-cols-4">
            {summary.isLoading ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-[104px] rounded-card" />) : summary.error ? (
              <div className="col-span-full"><WidgetError message={t('states.summaryError')} onRetry={() => void summary.refetch()} /></div>
            ) : <>
              <KpiCard label={t('kpi.bookingsToday')} value={String(summary.data?.bookingsToday ?? 0)} delta={t('kpi.bookingsTodayHint')} />
              <KpiCard label={t('kpi.chargingNow')} value={String(summary.data?.chargingBookings ?? 0)} delta={t('kpi.chargingNowHint')} />
              <KpiCard label={t('kpi.availableConnectors')} value={String(summary.data?.availableConnectors ?? 0)} delta={t('kpi.availableConnectorsHint')} />
              <KpiCard label={t('kpi.unclaimedTickets')} value={String(summary.data?.unclaimedTickets ?? 0)} delta={t('kpi.unclaimedTicketsHint')} />
            </>}
          </section>

          <div className="grid gap-[13px] xl:grid-cols-2">
            <section className="rounded-card border border-line bg-white p-4 shadow-card" aria-labelledby="staff-bookings-title">
              <WidgetHeader id="staff-bookings-title" title={t('bookings.title')} actionLabel={t('bookings.all')} onAction={() => navigate('../bookings')} />
              <Tabs value={bookingView} options={[
                { value: 'UPCOMING', label: t('bookings.upcoming') }, { value: 'CHARGING', label: t('bookings.charging') },
              ]} onChange={(value) => { setBookingView(value as StaffDashboardBookingView); setBookingPage(1); }} />
              {bookings.isLoading ? <ListSkeleton /> : bookings.error ? <WidgetError message={t('states.bookingsError')} onRetry={() => void bookings.refetch()} /> :
                bookings.data?.items.length ? <div className="divide-y divide-line">
                  {bookings.data.items.map((booking) => <button key={booking.bookingId} type="button"
                    onClick={() => navigate('../bookings')}
                    className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-surface/60">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 font-medium text-ink"><span>{formatTime(booking.startAt)}–{formatTime(booking.endAt)}</span><StatusPill value={booking.status} /></div>
                      <p className="mt-1 truncate text-sm text-muted">{booking.driverDisplayName} · {booking.connectorCode}</p>
                      {bookingView === 'CHARGING' && <p className="mt-1 text-xs text-muted">{t('bookings.startedAt', { time: formatTime(booking.chargingStartedAt) })}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted">{booking.bookingCode}</span>
                  </button>)}
                </div> : <StateCard message={t(bookingView === 'UPCOMING' ? 'bookings.emptyUpcoming' : 'bookings.emptyCharging')} />}
              <Pagination page={bookings.data?.page ?? bookingPage} pages={bookings.data?.totalPages ?? 0} onChange={setBookingPage} label={t('pagination', { page: bookings.data?.page ?? bookingPage, pages: bookings.data?.totalPages ?? 0 })} />
            </section>

            <section className="rounded-card border border-line bg-white p-4 shadow-card" aria-labelledby="staff-equipment-title">
              <WidgetHeader id="staff-equipment-title" title={t('equipment.title')} actionLabel={t('equipment.all')} onAction={() => navigate('../chargers')} />
              {equipment.isLoading ? <ListSkeleton /> : equipment.error ? <WidgetError message={t('states.equipmentError')} onRetry={() => void equipment.refetch()} /> :
                equipment.data?.items.length ? <div className="divide-y divide-line">
                  {equipment.data.items.map((item) => <button key={`${item.equipmentType}-${item.equipmentId}`} type="button"
                    onClick={() => navigate(`../chargers?chargePointId=${encodeURIComponent(item.chargePointId)}${item.connectorId ? `&connectorId=${encodeURIComponent(item.connectorId)}` : ''}`)}
                    className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-surface/60">
                    <div className="min-w-0"><p className="truncate font-medium text-ink">{item.code}</p>
                      <p className="mt-1 text-sm text-muted">{t(`equipment.types.${item.equipmentType}`)} · {t(`equipment.reasons.${item.reasonCode}`, { defaultValue: item.reasonCode })}</p>
                    </div><StatusPill value={item.chargePointStatus || item.connectorStatus || 'OFFLINE'} />
                  </button>)}
                </div> : <StateCard message={t('equipment.empty')} />}
              <Pagination page={equipment.data?.page ?? equipmentPage} pages={equipment.data?.totalPages ?? 0} onChange={setEquipmentPage} label={t('pagination', { page: equipment.data?.page ?? equipmentPage, pages: equipment.data?.totalPages ?? 0 })} />
            </section>

            <section className="rounded-card border border-line bg-white p-4 shadow-card xl:col-span-2" aria-labelledby="staff-tickets-title">
              <WidgetHeader id="staff-tickets-title" title={t('tickets.title')} actionLabel={t('tickets.all')} onAction={() => navigate('../tickets')} />
              <Tabs value={ticketView} options={[
                { value: 'UNCLAIMED', label: t('tickets.unclaimed') }, { value: 'MINE', label: t('tickets.mine') },
              ]} onChange={(value) => { setTicketView(value as StaffDashboardTicketView); setTicketPage(1); }} />
              {tickets.isLoading ? <ListSkeleton /> : tickets.error ? <WidgetError message={t('states.ticketsError')} onRetry={() => void tickets.refetch()} /> :
                tickets.data?.items.length ? <div className="divide-y divide-line md:grid md:grid-cols-2 md:gap-x-6">
                  {tickets.data.items.map((ticket) => <button key={ticket.ticketId} type="button" onClick={() => navigate(`../tickets/${encodeURIComponent(ticket.ticketId)}`)}
                    className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-surface/60">
                    <div className="min-w-0"><p className="truncate font-medium text-ink">{ticket.subject}</p>
                      <p className="mt-1 text-sm text-muted">{ticket.ticketCode} · {ticket.handlerDisplayName || t('tickets.notClaimed')}</p></div>
                    <div className="shrink-0 text-right"><StatusPill value={ticket.status} /><p className="mt-1 text-xs text-muted">{formatDateTime(ticket.createdAt)}</p></div>
                  </button>)}
                </div> : <StateCard message={t(ticketView === 'UNCLAIMED' ? 'tickets.emptyUnclaimed' : 'tickets.emptyMine')} />}
              <Pagination page={tickets.data?.page ?? ticketPage} pages={tickets.data?.totalPages ?? 0} onChange={setTicketPage} label={t('pagination', { page: tickets.data?.page ?? ticketPage, pages: tickets.data?.totalPages ?? 0 })} />
            </section>
          </div>
        </div>
      )}
    </>
  );
}

function WidgetHeader({ id, title, actionLabel, onAction }: { id: string; title: string; actionLabel: string; onAction: () => void }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 id={id} className="font-semibold text-ink">{title}</h2><button type="button" onClick={onAction} className="text-sm font-medium text-brand hover:underline">{actionLabel}</button></div>;
}

function Tabs({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <div className="mb-2 flex gap-1 rounded-lg bg-surface p-1" role="tablist">{options.map((option) => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} onClick={() => onChange(option.value)} className={`rounded-md px-3 py-1.5 text-sm ${value === option.value ? 'bg-white font-medium text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{option.label}</button>)}</div>;
}

function StatusPill({ value }: { value: string }) {
  const { t } = useTranslation('staffDashboard');
  const tone = ['OFFLINE', 'MAINTENANCE', 'OPEN', 'IN_PROGRESS'].includes(value) ? 'bg-amber-50 text-amber-800' : ['CHARGING', 'AVAILABLE', 'ACTIVE', 'CONFIRMED', 'CHECKED_IN'].includes(value) ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{t(`status.${value}`, { defaultValue: value.replaceAll('_', ' ') })}</span>;
}

function Pagination({ page, pages, onChange, label }: { page: number; pages: number; onChange: (page: number) => void; label: string }) {
  if (pages <= 1) return null;
  return <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-muted"><span>{label}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded border border-line px-2 py-1 disabled:opacity-40">‹</button><button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded border border-line px-2 py-1 disabled:opacity-40">›</button></div></div>;
}

function StateCard({ message }: { message: string }) {
  return <div className="rounded-lg bg-surface px-3 py-5 text-center text-sm text-muted">{message}</div>;
}

function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation('staffDashboard');
  return <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-3 text-sm text-rose-800"><span>{message}</span><button type="button" onClick={onRetry} className="font-medium underline">{t('retry')}</button></div>;
}

function ListSkeleton() {
  return <div className="space-y-3 py-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-12 rounded-md" />)}</div>;
}
