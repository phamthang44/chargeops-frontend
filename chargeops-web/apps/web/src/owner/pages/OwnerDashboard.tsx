import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi, type OwnerDashboardAttentionKind, type OwnerDashboardPeriod } from '@chargeops/api';
import {
  Button,
  Card,
  IconArrowRight,
  IconBarChart,
  IconBolt,
  IconCalendar,
  IconChevronRight,
  IconGrid,
  IconPin,
  IconRefreshCw,
  IconWrench,
  KpiCard,
  PageHeader,
  SegmentedControl,
  Select,
  type SelectOption,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
import { useOwnerStation } from '../context/OwnerStationContext';

const PERIODS: OwnerDashboardPeriod[] = ['7d', '30d'];
const KINDS: OwnerDashboardAttentionKind[] = ['EQUIPMENT', 'TICKET', 'LICENSE'];

export function OwnerDashboard() {
  const { t, i18n } = useTranslation('ownerDashboard');
  const api = useApi();
  const navigate = useNavigate();
  const { setSelectedStationId } = useOwnerStation();
  const [params, setParams] = useSearchParams();
  const stationId = params.get('stationId') || undefined;
  const period = PERIODS.includes(params.get('period') as OwnerDashboardPeriod) ? params.get('period') as OwnerDashboardPeriod : '7d';
  const kind = KINDS.includes(params.get('kind') as OwnerDashboardAttentionKind) ? params.get('kind') as OwnerDashboardAttentionKind : 'EQUIPMENT';
  const update = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const stationList = useQuery({
    queryKey: ['owner-dashboard', 'station-options'],
    queryFn: async () => {
      const collected: any[] = [];
      for (let pageNo = 1; pageNo <= 100; pageNo += 1) {
        const response = await api.stations.mine({ pageNo, pageSize: 100 }) as any;
        const items = Array.isArray(response) ? response : response?.items ?? [];
        collected.push(...items);
        const total = response?.total ?? response?.meta?.totalElements;
        if (items.length === 0 || (total != null && collected.length >= total) || (Array.isArray(response) && items.length < 100)) break;
      }
      return collected;
    },
  });
  const stations = stationList.data ?? [];
  const selectedStation = stations.find((station: any) => station.id === stationId);
  const stationOptions = useMemo<SelectOption[]>(
    () => [
      { value: '', label: t('filters.allStations') },
      ...stations.map((station: any) => ({
        value: station.id,
        label: `${station.name} · ${station.stationCode || station.id}`,
      })),
    ],
    [stations, t],
  );
  const summary = useQuery({ queryKey: ['owner-dashboard', 'summary'], queryFn: () => api.dashboard.owner(), enabled: !stationId });
  const activity = useQuery({ queryKey: ['owner-dashboard', 'activity', stationId, period], queryFn: () => api.dashboard.ownerActivity({ stationId, period }) });
  const stationRows = useQuery({ queryKey: ['owner-dashboard', 'stations', stationId, period], queryFn: () => api.dashboard.ownerStations({ stationId, period, page: 1, size: 5 }) });
  const attention = useQuery({ queryKey: ['owner-dashboard', 'attention', stationId, kind], queryFn: () => api.dashboard.ownerAttention({ stationId, kind, page: 1, size: 5 }) });
  const bookings = useQuery({
    queryKey: ['owner-dashboard', 'bookings', stationId],
    queryFn: () => api.ownerBookings.list({ stationId, status: 'confirmed' as any, from: new Date().toISOString(), sort: 'startAt,asc', windowMode: 'START_IN_WINDOW', pageSize: 5 }),
  });

  const locale = i18n.language.startsWith('en') ? 'en-US' : 'vi-VN';
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dateTime = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
  const chartDate = (value: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(`${value}T12:00:00+07:00`));
  const error = activity.error || stationRows.error || attention.error || (!stationId ? summary.error : undefined);
  const isRefreshing = activity.isFetching || stationRows.isFetching || attention.isFetching || bookings.isFetching || (!stationId && summary.isFetching);
  const retry = () => { void Promise.all([activity.refetch(), stationRows.refetch(), attention.refetch(), bookings.refetch(), ...(!stationId ? [summary.refetch()] : [])]); };
  const openAttention = (item: NonNullable<typeof attention.data>['items'][number]) => {
    setSelectedStationId(item.stationId);
    if (item.kind === 'TICKET') navigate(`/owner/tickets/${item.entityId}`);
    else if (item.kind === 'LICENSE') navigate(`/owner/license?stationId=${item.stationId}`);
    else navigate(`/owner/chargers?stationId=${item.stationId}&${item.reasonCode === 'CONNECTOR_OFFLINE' ? 'connectorId' : 'chargePointId'}=${item.entityId}`);
  };

  return <div className="role-dashboard space-y-6 pb-8">
    <header>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-owner">{t('hero.eyebrow')}</p>
      <PageHeader title={t('title')}
        subtitle={stationId
          ? t('hero.stationScope', { station: selectedStation?.name ?? t('hero.selectedStation') })
          : t('subtitleFormatted', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date()) })}
        action={<Button variant="secondary" accent="owner" size="sm" onClick={retry} disabled={isRefreshing}
          icon={<IconRefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />}>
          {isRefreshing ? t('actions.refreshing') : t('actions.refresh')}
        </Button>} />
    </header>

    <Card className="relative z-10 flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6 overflow-visible">
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-faint">
        <label htmlFor="owner-station-scope" className="cursor-pointer">{t('filters.scope')}</label>
        <div className="w-full sm:max-w-sm">
          <Select
            value={stationId ?? ''}
            onChange={(value) => update('stationId', value || undefined)}
            options={stationOptions}
            searchable={stations.length > 3}
            searchPlaceholder={t('filters.searchPlaceholder', { defaultValue: 'Tìm trạm sạc...' })}
            accent="owner"
            aria-label={t('filters.scope')}
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">{t('filters.period')}</p>
        <SegmentedControl segments={PERIODS.map((value) => ({ key: value, label: t(`filters.${value}`) }))}
          active={period} onChange={(value) => update('period', value)} accent="owner" />
      </div>
    </Card>

    {error && <ApiErrorState error={error} eyebrow={t('dashboard.error.eyebrow')} title={t('dashboard.error.title')} onRetry={retry} />}

    {!stationId && <section aria-labelledby="owner-current-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-owner">{t('hero.liveKicker')}</p><h2 id="owner-current-title" className="mt-1 text-lg font-semibold text-ink">{t('sections.current')}</h2></div>
        <span className="inline-flex items-center gap-2 text-xs text-muted"><span className="h-2 w-2 rounded-full bg-good" />{t('hero.liveStatus')}</span>
      </div>
      {summary.isLoading ? <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{PERIODS.concat(PERIODS).map((_, index) => <Skeleton key={index} className="h-36 rounded-card" />)}</div>
        : summary.data && <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="flex flex-col rounded-card border border-owner-border bg-owner-soft p-4 sm:p-6">
            <div className="flex items-center justify-between text-owner-deep"><IconGrid size={20} /><span className="text-xs font-semibold uppercase tracking-wide">{t('hero.now')}</span></div>
            <p className="mt-4 text-xs font-medium text-owner-deep">{t('kpi.activeStations')}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-owner-deep">{number.format(summary.data.stations.activeStations)}<span className="text-lg font-medium text-muted">/{number.format(summary.data.stations.totalStations)}</span></p>
            <p className="mt-auto pt-3 text-xs text-owner-deep">{t('hero.activeStationNote')}</p>
          </div>
          <KpiCard label={t('kpi.chargersOnline')} value={`${number.format(summary.data.stations.onlineChargePoints)}/${number.format(summary.data.stations.totalChargePoints)}`} delta={t('hero.onlineNote')} deltaClass="text-owner-deep" />
          <KpiCard label={t('kpi.connectorsAvailable')} value={`${number.format(summary.data.hardware.availableConnectors)}/${number.format(summary.data.hardware.totalConnectors)}`} delta={t('hero.availableNote')} deltaClass="text-owner-deep" />
          <KpiCard label={t('metrics.charging')} value={number.format(summary.data.hardware.chargingConnectors)} delta={t('hero.chargingNote')} deltaClass="text-muted" />
        </div>}
    </section>}

    <div className="grid gap-4 xl:grid-cols-12">
      <section className="xl:col-span-8" aria-labelledby="owner-stations-title">
        <Card className="h-full p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3"><span className="rounded-ctl bg-owner-soft p-2 text-owner"><IconPin size={18} /></span><div><h2 id="owner-stations-title" className="text-lg font-semibold text-ink">{t('sections.stations')}</h2><p className="mt-1 text-sm text-muted">{t('sections.stationHelp', { period: t(`filters.${period}`) })}</p></div></div>
            <Button variant="ghost" accent="owner" size="sm" onClick={() => navigate('/owner/stations')} className="text-owner" >{t('actions.viewAll')}<IconArrowRight size={15} /></Button>
          </div>
          {stationRows.isLoading ? <div className="space-y-3"><Skeleton className="h-32 rounded-card" /><Skeleton className="h-32 rounded-card" /></div>
            : stationRows.data?.items.length ? <div className="space-y-3">{stationRows.data.items.map((station) => {
              const availability = station.totalConnectors > 0 ? Math.round((station.availableConnectors / station.totalConnectors) * 100) : 0;
              const tone = station.status === 'ACTIVE' ? 'good' : station.status === 'SUSPENDED' ? 'bad' : 'warn';
              return <article key={station.stationId} className="rounded-card bg-surface-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold text-ink">{station.stationName}</h3><StatusPill tone={tone} label={t(`status.${station.status}`, { defaultValue: station.status })} /></div><p className="mt-1 text-xs text-muted">{station.stationCode}</p></div>
                  <Button variant="ghost" accent="owner" size="sm" onClick={() => { setSelectedStationId(station.stationId); navigate(`/owner/stations?stationId=${station.stationId}`); }} className="text-owner">{t('actions.manage')}<IconChevronRight size={15} /></Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-hairline pt-4 sm:grid-cols-4">
                  <Metric label={t('metrics.connectors')} value={`${number.format(station.availableConnectors)}/${number.format(station.totalConnectors)}`} />
                  <Metric label={t('metrics.charging')} value={number.format(station.chargingConnectors)} />
                  <Metric label={t('metrics.needsCheck')} value={number.format(station.connectorsNeedingCheck)} alert={station.connectorsNeedingCheck > 0} />
                  <Metric label={t('metrics.sessions')} value={number.format(station.sessionsStarted)} />
                </div>
                <div className="mt-4 flex items-center gap-3" aria-label={t('metrics.connectorAvailability', { available: station.availableConnectors, total: station.totalConnectors })}>
                  <span className="text-xs text-muted">{t('metrics.availability')}</span><div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-owner-tint"><span className="block h-full rounded-full bg-owner" style={{ width: `${availability}%` }} /></div><strong className="text-xs tabular-nums text-owner-deep">{availability}%</strong>
                </div>
              </article>;
            })}</div> : <Empty title={stationId ? t('empty.noStationData') : t('empty.noStations')} action={!stationId ? t('actions.registerStation') : undefined} onAction={() => navigate('/owner/stations')} />}
        </Card>
      </section>

      <section className="xl:col-span-4" aria-labelledby="owner-attention-title">
        <Card className="h-full p-4 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="rounded-ctl bg-warn-soft p-2 text-warn"><IconWrench size={18} /></span><div><h2 id="owner-attention-title" className="text-lg font-semibold text-ink">{t('sections.attention')}</h2><p className="mt-1 text-sm text-muted">{t('hero.attentionHint')}</p></div></div><span className="rounded-full bg-chip px-2 py-1 text-xs font-semibold tabular-nums text-body">{number.format(attention.data?.total ?? 0)}</span></div>
          <SegmentedControl segments={KINDS.map((value) => ({ key: value, label: t(`attentionKinds.${value}`) }))} active={kind} onChange={(value) => update('kind', value)} accent="owner" />
          {attention.isLoading ? <Skeleton className="mt-4 h-40 rounded-card" /> : attention.data?.items.length ? <div className="mt-4 divide-y divide-hairline">{attention.data.items.map((item) => <button key={`${item.kind}-${item.entityId}`} type="button" onClick={() => openAttention(item)} className="flex min-h-16 w-full items-center gap-3 py-3 text-left hover:bg-row-hover">
            <span className="rounded-ctl bg-owner-soft p-2 text-owner"><IconBolt size={16} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-ink">{item.code}</strong><span className="block truncate text-xs text-muted">{item.stationName}</span><span className="block truncate text-xs text-warn">{t(`reasons.${item.reasonCode}`, { defaultValue: item.status })}</span></span><IconChevronRight size={16} className="shrink-0 text-faint" />
          </button>)}</div> : <div className="mt-4"><Empty title={t('empty.noAttention')} /></div>}
          {!!attention.data?.total && <Button variant="ghost" accent="owner" size="sm" onClick={() => navigate(kind === 'TICKET' ? '/owner/tickets' : kind === 'LICENSE' ? '/owner/license' : '/owner/chargers')} className="mt-3 text-owner">{t('actions.viewAll')}<IconArrowRight size={15} /></Button>}
        </Card>
      </section>
    </div>

    <div className="grid gap-4 xl:grid-cols-12">
      <section className="xl:col-span-8" aria-labelledby="owner-activity-title">
        <Card className="h-full p-4 sm:p-6">
          <div className="mb-5 flex items-start gap-3"><span className="rounded-ctl bg-owner-soft p-2 text-owner"><IconBarChart size={18} /></span><div><h2 id="owner-activity-title" className="text-lg font-semibold text-ink">{t('sections.activity')}</h2><p className="mt-1 text-sm text-muted">{t('sections.generatedAt', { time: activity.data?.generatedAt ? dateTime(activity.data.generatedAt) : '—' })}</p></div></div>
          {activity.isLoading ? <Skeleton className="h-64 rounded-card" /> : activity.data ? <>
            <div className="mb-4 flex flex-wrap gap-6 border-b border-hairline pb-4"><Metric label={t('metrics.sessions')} value={number.format(activity.data.sessionsStarted)} featured /><Metric label={t('metrics.bookingsScheduled')} value={number.format(activity.data.bookingsScheduled)} featured /></div>
            <ActivityChart data={activity.data.daily} formatNumber={(value) => number.format(value)} formatDate={chartDate} />
            <div className="mt-4 flex flex-wrap gap-2" aria-label={t('chart.bookingStatuses')}>{Object.entries(activity.data.bookingsByStatus).map(([status, count]) => <span key={status} className="rounded-full bg-chip px-3 py-1.5 text-xs text-body">{t(`status.${status}`, { defaultValue: status })}: <strong className="tabular-nums">{number.format(count)}</strong></span>)}</div>
          </> : <Empty title={t('empty.noActivity')} />}
        </Card>
      </section>

      <section className="xl:col-span-4" aria-labelledby="owner-bookings-title">
        <Card className="h-full p-4 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="rounded-ctl bg-owner-soft p-2 text-owner"><IconCalendar size={18} /></span><div><h2 id="owner-bookings-title" className="text-lg font-semibold text-ink">{t('panel.upcomingBookings')}</h2><p className="mt-1 text-sm text-muted">{t('hero.confirmedOnly')}</p></div></div></div>
          {bookings.isLoading ? <div className="space-y-3"><Skeleton className="h-16 rounded-card" /><Skeleton className="h-16 rounded-card" /></div> : bookings.data?.items.length ? <div className="divide-y divide-hairline">{bookings.data.items.map((booking) => <button key={booking.bookingId} type="button" className="flex min-h-16 w-full items-center gap-3 py-3 text-left hover:bg-row-hover" onClick={() => { if (stationId) setSelectedStationId(stationId); navigate(`/owner/bookings?bookingId=${booking.bookingId}${stationId ? `&stationId=${stationId}` : ''}`); }}>
            <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-ctl bg-owner-soft text-owner-deep"><strong className="text-sm leading-none">{new Intl.DateTimeFormat(locale, { day: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(booking.startAt))}</strong><span className="text-xs uppercase">{new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(booking.startAt))}</span></span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-ink">{booking.bookingCode || booking.bookingId}</strong><span className="block truncate text-xs text-muted">{dateTime(booking.startAt)}</span><span className="block truncate text-xs text-muted">{booking.driverDisplayName}</span></span><IconChevronRight size={16} className="shrink-0 text-faint" />
          </button>)}</div> : <Empty title={t('panel.noUpcoming')} />}
          {!!bookings.data?.items.length && <Button variant="ghost" accent="owner" size="sm" onClick={() => navigate(`/owner/bookings${stationId ? `?stationId=${stationId}` : ''}`)} className="mt-3 text-owner">{t('actions.viewAll')}<IconArrowRight size={15} /></Button>}
        </Card>
      </section>
    </div>
  </div>;
}

function Metric({ label, value, alert = false, featured = false }: { label: string; value: string; alert?: boolean; featured?: boolean }) {
  return <div><span className="block text-xs text-muted">{label}</span><strong className={`mt-1 block tabular-nums ${featured ? 'text-2xl' : 'text-sm'} ${alert ? 'text-bad' : 'text-ink'}`}>{value}</strong></div>;
}

function Empty({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="rounded-card bg-surface-2 px-4 py-8 text-center"><p className="text-sm text-muted">{title}</p>{action && <Button variant="ghost" accent="owner" size="sm" onClick={onAction} className="mt-3 text-owner">{action}<IconArrowRight size={15} /></Button>}</div>;
}

function ActivityChart({ data, formatNumber, formatDate }: { data: Array<{ date: string; sessionsStarted: number }>; formatNumber: (value: number) => string; formatDate: (value: string) => string }) {
  const { t } = useTranslation('ownerDashboard');
  const max = Math.max(1, ...data.map((item) => item.sessionsStarted));
  const x = (index: number) => data.length <= 1 ? 50 : (index / (data.length - 1)) * 100;
  const y = (value: number) => 88 - (value / max) * 72;
  const points = data.map((item, index) => `${x(index)},${y(item.sessionsStarted)}`).join(' ');
  return <div>
    <p className="mb-2 text-xs font-medium text-muted">{t('chart.sessionsByDay')}</p>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-44 w-full overflow-visible" role="img" aria-label={t('chart.accessibleLabel')}>
      {[16, 40, 64, 88].map((line) => <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="currentColor" strokeDasharray="1 2" className="text-line" />)}
      <polygon points={`0,88 ${points} 100,88`} fill="currentColor" className="text-owner-soft" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="text-owner" />
      {data.map((item, index) => <circle key={item.date} cx={x(index)} cy={y(item.sessionsStarted)} r="1.5" fill="currentColor" className="text-owner"><title>{t('chart.pointLabel', { date: formatDate(item.date), count: formatNumber(item.sessionsStarted) })}</title></circle>)}
    </svg>
    <div className="mt-2 flex justify-between text-xs text-muted"><span>{data[0] ? formatDate(data[0].date) : '—'}</span><span>{data[data.length - 1] ? formatDate(data[data.length - 1].date) : '—'}</span></div>
    <details className="mt-3"><summary className="min-h-11 py-3 text-sm font-medium text-owner">{t('chart.viewDailyValues')}</summary><ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">{data.map((item) => <li key={item.date} className="flex justify-between gap-2"><span className="text-muted">{formatDate(item.date)}</span><strong className="tabular-nums text-ink">{formatNumber(item.sessionsStarted)}</strong></li>)}</ul></details>
  </div>;
}
