import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  useApi,
  type StaffDashboardBookingView,
  type StaffDashboardTicketView,
} from '@chargeops/api';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBolt,
  IconCalendar,
  IconCheckCircle,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconLifebuoy,
  IconPin,
  IconRefreshCw,
  IconUsers,
  IconWrench,
  Skeleton,
} from '@chargeops/ui';
import { useStaffStation } from '../context/StaffStationContext';

const PAGE_SIZE = 5;
const POLL_INTERVAL = () =>
  typeof document !== 'undefined' && document.visibilityState === 'visible' ? 30_000 : false;

function formatTime(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
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
    enabled: Boolean(stationId),
    refetchInterval: POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });

  const bookings = useQuery({
    queryKey: ['staff-dashboard', 'bookings', stationId, bookingView, bookingPage],
    queryFn: () => api.dashboard.staffBookings(stationId!, bookingView, bookingPage, PAGE_SIZE),
    enabled: Boolean(stationId),
    refetchInterval: POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });

  const equipment = useQuery({
    queryKey: ['staff-dashboard', 'equipment', stationId, equipmentPage],
    queryFn: () => api.dashboard.staffEquipment(stationId!, equipmentPage, PAGE_SIZE),
    enabled: Boolean(stationId),
    refetchInterval: POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });

  const tickets = useQuery({
    queryKey: ['staff-dashboard', 'tickets', stationId, ticketView, ticketPage],
    queryFn: () => api.dashboard.staffTickets(stationId!, ticketView, ticketPage, PAGE_SIZE),
    enabled: Boolean(stationId),
    refetchInterval: POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });

  const refresh = () => {
    void Promise.all([summary.refetch(), bookings.refetch(), equipment.refetch(), tickets.refetch()]);
  };
  const isRefreshing = [summary, bookings, equipment, tickets].some((query) => query.isFetching);

  const stationName = summary.data?.stationName || currentStation?.name || t('title');
  const stationAddress = summary.data?.address || currentStation?.address || t('stationAddressUnavailable');
  const operationalStatus = summary.data?.operationalStatus || currentStation?.operationalStatus;

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          HERO: Station Operational Beacon & Live HUD (Clean Single-Border Architecture)
          ========================================================================= */}
      <header className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-xs sm:p-7">
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0 space-y-3">
            {/* Eyebrow with Live Pulsing Radar Beacon */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-surface-2/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
                </span>
                <span>{t('title')}</span>
              </span>

              {operationalStatus && <StatusBadge value={operationalStatus} />}

              {summary.data?.generatedAt && (
                <span className="hidden items-center gap-1.5 text-xs text-muted/90 sm:inline-flex">
                  <IconClock size={13} className="text-muted" />
                  <span>{t('updatedAt', { time: formatTime(summary.data.generatedAt) })}</span>
                </span>
              )}
            </div>

            {/* Station Title & Location */}
            <div>
              <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                {stationName}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <IconPin size={15} className="shrink-0 text-brand" />
                <span className="truncate">{stationAddress}</span>
              </p>
            </div>
          </div>

          {/* Island Action Button (Button-in-Button Pattern) */}
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="group inline-flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-2.5 text-xs font-semibold text-ink shadow-sm transition-all duration-300 hover:border-line-hover hover:bg-surface-2 hover:shadow active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isRefreshing ? t('refreshing') : t('refresh')}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chip transition-transform duration-500 group-hover:rotate-180">
                <IconRefreshCw
                  size={12}
                  className={isRefreshing ? 'animate-spin text-brand' : 'text-body'}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {!stationId ? (
        <StateCard message={t('states.noStation')} icon={<IconAlertTriangle size={24} />} />
      ) : (
        <>
          {/* =========================================================================
              KPI OPERATIONAL COMMAND TIER (4-Card Asymmetrical Single-Border Bento)
              ========================================================================= */}
          <section aria-label={t('kpi.section')} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.isLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="mt-3 h-8 w-16 rounded-md" />
                  <Skeleton className="mt-2 h-3 w-32 rounded-md" />
                </div>
              ))
            ) : summary.error ? (
              <div className="col-span-full">
                <WidgetError message={t('states.summaryError')} onRetry={() => void summary.refetch()} />
              </div>
            ) : (
              <>
                <KpiTile
                  label={t('kpi.bookingsToday')}
                  value={summary.data?.bookingsToday ?? 0}
                  hint={t('kpi.bookingsTodayHint')}
                  icon={<IconCalendar size={18} />}
                  tone="brand"
                />
                <KpiTile
                  label={t('kpi.chargingNow')}
                  value={summary.data?.chargingBookings ?? 0}
                  hint={t('kpi.chargingNowHint')}
                  icon={<IconBolt size={18} />}
                  tone="purple"
                  pulse={Boolean((summary.data?.chargingBookings ?? 0) > 0)}
                />
                <KpiTile
                  label={t('kpi.availableConnectors')}
                  value={summary.data?.availableConnectors ?? 0}
                  hint={t('kpi.availableConnectorsHint')}
                  icon={<IconCheckCircle size={18} />}
                  tone="good"
                />
                <KpiTile
                  label={t('kpi.unclaimedTickets')}
                  value={summary.data?.unclaimedTickets ?? 0}
                  hint={t('kpi.unclaimedTicketsHint')}
                  icon={<IconLifebuoy size={18} />}
                  tone={(summary.data?.unclaimedTickets ?? 0) > 0 ? 'warn' : 'neutral'}
                />
              </>
            )}
          </section>

          {/* =========================================================================
              OPERATIONAL HUB: Live Stream & Attention Matrix (Clean Single-Border Bento Grid)
              ========================================================================= */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* PANEL 1: LỊCH ĐẶT CHỖ (Booking Stream) */}
            <section
              aria-labelledby="staff-bookings-title"
              className="overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs xl:col-span-6"
            >
              <PanelHeader
                id="staff-bookings-title"
                title={t('bookings.title')}
                actionLabel={t('bookings.all')}
                onAction={() => navigate('../bookings')}
                icon={<IconCalendar size={18} className="text-brand" />}
              />

                <div className="mt-4">
                  <CapsuleTabs
                    value={bookingView}
                    options={[
                      { value: 'UPCOMING', label: t('bookings.upcoming') },
                      { value: 'CHARGING', label: t('bookings.charging') },
                    ]}
                    onChange={(val) => {
                      setBookingView(val as StaffDashboardBookingView);
                      setBookingPage(1);
                    }}
                  />
                </div>

                <div className="mt-5 min-h-[300px]">
                  {bookings.isLoading ? (
                    <ListSkeleton />
                  ) : bookings.error ? (
                    <WidgetError message={t('states.bookingsError')} onRetry={() => void bookings.refetch()} />
                  ) : bookings.data?.items.length ? (
                    <div className="space-y-2.5">
                      {bookings.data.items.map((booking) => (
                        <button
                          key={booking.bookingId}
                          type="button"
                          onClick={() => navigate('../bookings')}
                          className="group/item flex w-full items-center justify-between gap-3 rounded-2xl border border-line/60 bg-surface-2/40 p-3.5 text-left transition-all duration-200 hover:border-brand/40 hover:bg-surface-2 hover:shadow-xs active:scale-[0.99]"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 font-mono text-xs font-bold text-ink shadow-2xs border border-line/50">
                                <IconClock size={12} className="text-brand" />
                                {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                              </span>
                              <StatusBadge value={booking.status} size="sm" />
                            </div>

                            <p className="truncate text-sm font-semibold text-ink">
                              {booking.driverDisplayName}
                              <span className="ml-2 font-mono text-xs font-normal text-muted">
                                · {booking.connectorCode}
                              </span>
                            </p>

                            {bookingView === 'CHARGING' && (
                              <p className="flex items-center gap-1.5 text-xs text-brand font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                                {t('bookings.startedAt', { time: formatTime(booking.chargingStartedAt) })}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-md bg-chip px-2 py-0.5 font-mono text-[11px] font-medium text-muted">
                              {booking.bookingCode}
                            </span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-muted transition-transform duration-200 group-hover/item:translate-x-1 group-hover/item:text-brand shadow-2xs">
                              <IconChevronRight size={14} />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel
                      message={t(bookingView === 'UPCOMING' ? 'bookings.emptyUpcoming' : 'bookings.emptyCharging')}
                      icon={<IconCalendar size={22} />}
                    />
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-line/60">
                  <PaginationBar
                    page={bookings.data?.page ?? bookingPage}
                    pages={bookings.data?.totalPages ?? 0}
                    onChange={setBookingPage}
                    label={t('pagination', {
                      page: bookings.data?.page ?? bookingPage,
                      pages: bookings.data?.totalPages ?? 0,
                    })}
                  />
                </div>
            </section>

            {/* PANEL 2: THIẾT BỊ CẦN KIỂM TRA (Equipment Diagnostics) */}
            <section
              aria-labelledby="staff-equipment-title"
              className="overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs xl:col-span-6"
            >
              <PanelHeader
                id="staff-equipment-title"
                title={t('equipment.title')}
                actionLabel={t('equipment.all')}
                onAction={() => navigate('../chargers')}
                icon={<IconWrench size={18} className="text-warn" />}
              />

                <div className="mt-4 min-h-[352px]">
                  {equipment.isLoading ? (
                    <ListSkeleton />
                  ) : equipment.error ? (
                    <WidgetError message={t('states.equipmentError')} onRetry={() => void equipment.refetch()} />
                  ) : equipment.data?.items.length ? (
                    <div className="space-y-2.5">
                      {equipment.data.items.map((item) => (
                        <button
                          key={`${item.equipmentType}-${item.equipmentId}`}
                          type="button"
                          onClick={() =>
                            navigate(
                              `../chargers?chargePointId=${encodeURIComponent(item.chargePointId)}${
                                item.connectorId ? `&connectorId=${encodeURIComponent(item.connectorId)}` : ''
                              }`,
                            )
                          }
                          className="group/item flex w-full items-center justify-between gap-3 rounded-2xl border border-line/60 bg-surface-2/40 p-3.5 text-left transition-all duration-200 hover:border-warn/40 hover:bg-surface-2 hover:shadow-xs active:scale-[0.99]"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-ink">{item.code}</span>
                              <span className="rounded-full bg-chip px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                                {t(`equipment.types.${item.equipmentType}`)}
                              </span>
                            </div>
                            <p className="truncate text-xs font-medium text-warn-deep">
                              {t(`equipment.reasons.${item.reasonCode}`, { defaultValue: item.reasonCode })}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge value={item.chargePointStatus || item.connectorStatus || 'OFFLINE'} size="sm" />
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-muted transition-transform duration-200 group-hover/item:translate-x-1 group-hover/item:text-warn shadow-2xs">
                              <IconChevronRight size={14} />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-good/30 bg-good-soft/20 px-6 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-good-soft text-good ring-4 ring-good/10 shadow-xs">
                        <IconCheckCircle size={24} />
                      </div>
                      <h3 className="mt-3.5 text-sm font-bold text-ink">{t('equipment.empty')}</h3>
                      <p className="mt-1 max-w-xs text-xs text-muted">
                        Tất cả các trụ và cổng sạc tại trạm đều đang vận hành ổn định.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-line/60">
                  <PaginationBar
                    page={equipment.data?.page ?? equipmentPage}
                    pages={equipment.data?.totalPages ?? 0}
                    onChange={setEquipmentPage}
                    label={t('pagination', {
                      page: equipment.data?.page ?? equipmentPage,
                      pages: equipment.data?.totalPages ?? 0,
                    })}
                  />
                </div>
            </section>

            {/* PANEL 3: YÊU CẦU HỖ TRỢ (Support Tickets Triage Matrix) */}
            <section
              aria-labelledby="staff-tickets-title"
              className="overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs xl:col-span-12"
            >
              <PanelHeader
                id="staff-tickets-title"
                title={t('tickets.title')}
                actionLabel={t('tickets.all')}
                onAction={() => navigate('../tickets')}
                icon={<IconLifebuoy size={18} className="text-brand" />}
              />

                <div className="mt-4">
                  <CapsuleTabs
                    value={ticketView}
                    options={[
                      { value: 'UNCLAIMED', label: t('tickets.unclaimed') },
                      { value: 'MINE', label: t('tickets.mine') },
                    ]}
                    onChange={(val) => {
                      setTicketView(val as StaffDashboardTicketView);
                      setTicketPage(1);
                    }}
                  />
                </div>

                <div className="mt-5 min-h-[160px]">
                  {tickets.isLoading ? (
                    <ListSkeleton />
                  ) : tickets.error ? (
                    <WidgetError message={t('states.ticketsError')} onRetry={() => void tickets.refetch()} />
                  ) : tickets.data?.items.length ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {tickets.data.items.map((ticket) => (
                        <button
                          key={ticket.ticketId}
                          type="button"
                          onClick={() => navigate(`../tickets/${encodeURIComponent(ticket.ticketId)}`)}
                          className="group/item flex items-start justify-between gap-4 rounded-2xl border border-line/60 bg-surface-2/40 p-4 text-left transition-all duration-200 hover:border-brand/40 hover:bg-surface-2 hover:shadow-xs active:scale-[0.99]"
                        >
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-brand bg-brand-soft/70 px-2.5 py-0.5 rounded-full">
                                {ticket.ticketCode}
                              </span>
                              <span className="text-[11px] text-muted">
                                {formatDateTime(ticket.createdAt)}
                              </span>
                            </div>

                            <p className="truncate text-sm font-semibold text-ink">
                              {ticket.subject}
                            </p>

                            <p className="flex items-center gap-1.5 text-xs text-muted">
                              <IconUsers size={12} className="text-faint" />
                              <span className="truncate">
                                {ticket.handlerDisplayName || t('tickets.notClaimed')}
                              </span>
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <StatusBadge value={ticket.status} size="sm" />
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-muted transition-transform duration-200 group-hover/item:translate-x-1 group-hover/item:text-brand shadow-2xs">
                              <IconChevronRight size={14} />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel
                      message={t(ticketView === 'UNCLAIMED' ? 'tickets.emptyUnclaimed' : 'tickets.emptyMine')}
                      icon={<IconLifebuoy size={22} />}
                    />
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-line/60">
                  <PaginationBar
                    page={tickets.data?.page ?? ticketPage}
                    pages={tickets.data?.totalPages ?? 0}
                    onChange={setTicketPage}
                    label={t('pagination', {
                      page: tickets.data?.page ?? ticketPage,
                      pages: tickets.data?.totalPages ?? 0,
                    })}
                  />
                </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================================
   COMPONENTS: Clean Single-Border Visual Primitives (Micro-HUD, Island Controls)
   ========================================================================= */

interface KpiTileProps {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  tone: 'brand' | 'good' | 'warn' | 'purple' | 'neutral';
  pulse?: boolean;
}

function KpiTile({ label, value, hint, icon, tone, pulse = false }: KpiTileProps) {
  const toneMap = {
    brand: {
      border: 'hover:border-brand/40',
      iconBg: 'bg-brand-soft/70 text-brand',
      glow: 'from-brand/10 to-transparent',
      textAccent: 'text-brand',
    },
    purple: {
      border: 'hover:border-purple-400/40',
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300',
      glow: 'from-purple-500/10 to-transparent',
      textAccent: 'text-purple-600 dark:text-purple-300',
    },
    good: {
      border: 'hover:border-good/40',
      iconBg: 'bg-good-soft/80 text-good',
      glow: 'from-good/10 to-transparent',
      textAccent: 'text-good',
    },
    warn: {
      border: 'hover:border-warn/40',
      iconBg: 'bg-warn-soft/90 text-warn-deep',
      glow: 'from-warn/15 to-transparent',
      textAccent: 'text-warn-deep',
    },
    neutral: {
      border: 'hover:border-line-hover',
      iconBg: 'bg-chip text-muted',
      glow: 'from-line/30 to-transparent',
      textAccent: 'text-muted',
    },
  };

  const style = toneMap[tone];

  return (
    <div
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${style.border}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          {label}
        </span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs transition-transform duration-300 group-hover:scale-105 ${style.iconBg}`}
        >
          {icon}
        </span>
      </div>

      <div className="my-3 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums text-ink sm:text-4xl">
          {value}
        </span>
        {pulse && (
          <span className="relative flex h-2.5 w-2.5 mb-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-good" />
          </span>
        )}
      </div>

      <p className="text-[11.5px] font-medium text-muted/90 truncate">{hint}</p>
    </div>
  );
}

function PanelHeader({
  id,
  title,
  actionLabel,
  onAction,
  icon,
}: {
  id: string;
  title: string;
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-chip/80 text-ink shadow-2xs">
            {icon}
          </span>
        )}
        <h2 id={id} className="text-base font-bold tracking-tight text-ink sm:text-lg">
          {title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-body transition-all duration-200 hover:border-brand/40 hover:bg-brand-soft hover:text-brand shadow-2xs"
      >
        <span>{actionLabel}</span>
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          <IconArrowRight size={12} />
        </span>
      </button>
    </div>
  );
}

function CapsuleTabs({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line/70 bg-surface-2 p-1 gap-1" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
            value === option.value
              ? 'bg-surface text-ink shadow-xs ring-1 ring-line/80 font-bold'
              : 'text-muted hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ value, size = 'md' }: { value: string; size?: 'sm' | 'md' }) {
  const { t } = useTranslation('staffDashboard');

  const tone = ['OFFLINE', 'MAINTENANCE', 'OPEN', 'IN_PROGRESS'].includes(value)
    ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300'
    : ['CHARGING', 'AVAILABLE', 'ACTIVE', 'CONFIRMED', 'CHECKED_IN', 'OPERATING'].includes(value)
    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300'
    : 'bg-chip text-muted border-line';

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${sizeClass} ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span>{t(`status.${value}`, { defaultValue: value.replaceAll('_', ' ') })}</span>
    </span>
  );
}

function PaginationBar({
  page,
  pages,
  onChange,
  label,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  label: string;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs text-muted">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink transition-all hover:bg-surface-2 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-2xs"
        >
          <IconChevronLeft size={13} />
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink transition-all hover:bg-surface-2 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-2xs"
        >
          <IconChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function EmptyPanel({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-2/30 px-6 py-10 text-center">
      {icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-chip text-muted ring-4 ring-chip/50">
          {icon}
        </div>
      )}
      <p className="mt-3 max-w-xs text-xs font-medium text-muted">{message}</p>
    </div>
  );
}

function StateCard({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-line bg-surface px-6 py-12 text-center shadow-sm">
      {icon && <div className="text-warn mb-3">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{message}</p>
    </div>
  );
}

function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation('staffDashboard');
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bad-border bg-bad-soft px-4 py-3 text-xs font-medium text-bad-deep">
      <span className="flex items-center gap-2">
        <IconAlertTriangle size={15} />
        <span>{message}</span>
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-white px-3 py-1 font-semibold text-bad shadow-2xs hover:bg-surface-2 active:scale-95 transition-all"
      >
        {t('retry')}
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center justify-between rounded-2xl border border-line/40 bg-surface-2/40 p-3.5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
