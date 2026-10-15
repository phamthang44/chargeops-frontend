import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi, type OwnerDashboardAttentionKind, type OwnerDashboardPeriod } from '@chargeops/api';
import { Button, IconRefreshCw, KpiCard, PageHeader, Skeleton } from '@chargeops/ui';
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
  const error = activity.error || stationRows.error || attention.error || (!stationId ? summary.error : undefined);
  const retry = () => { void Promise.all([activity.refetch(), stationRows.refetch(), attention.refetch(), summary.refetch()]); };
  const openAttention = (item: NonNullable<typeof attention.data>['items'][number]) => {
    setSelectedStationId(item.stationId);
    if (item.kind === 'TICKET') navigate(`/owner/tickets/${item.entityId}`);
    else if (item.kind === 'LICENSE') navigate(`/owner/license?stationId=${item.stationId}`);
    else navigate(`/owner/chargers?stationId=${item.stationId}&${item.reasonCode === 'CONNECTOR_OFFLINE' ? 'connectorId' : 'chargePointId'}=${item.entityId}`);
  };

  return <div className="role-dashboard space-y-4">
    <PageHeader title={t('title')} subtitle={t('subtitleFormatted', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date()) })}
      action={<Button variant="secondary" size="sm" onClick={retry} disabled={activity.isFetching || stationRows.isFetching || attention.isFetching}
        icon={<IconRefreshCw size={14} className={activity.isFetching ? 'animate-spin' : ''} />}>{t('actions.refresh')}</Button>} />

    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-3 text-sm font-medium text-body">
        <span>{t('filters.scope')}</span>
        <select aria-label={t('filters.scope')} className="min-h-11 min-w-52 rounded-lg border border-line bg-surface px-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          value={stationId ?? ''} onChange={(event) => update('stationId', event.target.value || undefined)}>
          <option value="">{t('filters.allStations')}</option>
          {stations.map((station: any) => <option key={station.id} value={station.id}>{station.name} · {station.stationCode || station.id}</option>)}
        </select>
      </label>
      <div className="flex gap-2" role="group" aria-label={t('filters.period')}>
        {PERIODS.map((value) => <button key={value} type="button" aria-pressed={period === value} onClick={() => update('period', value)}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${period === value ? 'bg-owner text-white' : 'border border-line bg-surface text-body'}`}>
          {t(`filters.${value}`)}
        </button>)}
      </div>
    </div>

    {error ? <ApiErrorState error={error} eyebrow={t('dashboard.error.eyebrow')} title={t('dashboard.error.title')} onRetry={retry} /> : null}
    {summary.data && !stationId && <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label={t('sections.current')}>
      <KpiCard label={t('kpi.activeStations')} value={`${summary.data.stations.activeStations}/${summary.data.stations.totalStations}`} />
      <KpiCard label={t('kpi.chargersOnline')} value={`${summary.data.stations.onlineChargePoints}/${summary.data.stations.totalChargePoints}`} />
      <KpiCard label={t('kpi.connectorsAvailable')} value={`${summary.data.hardware.availableConnectors}/${summary.data.hardware.totalConnectors}`} />
      <KpiCard label={t('kpi.charging')} value={number.format(summary.data.hardware.chargingConnectors)} />
    </section>}

    <div className="grid gap-4 xl:grid-cols-12">
      <section className="rounded-card border border-line bg-surface p-4 sm:p-5 xl:col-span-8" aria-labelledby="owner-stations-title">
        <div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="owner-stations-title" className="text-lg font-semibold text-ink">{t('sections.stations')}</h2><p className="mt-1 text-sm text-muted">{t('sections.stationHelp', { period: t(`filters.${period}`) })}</p></div>
          <button className="min-h-11 text-sm font-semibold text-owner" onClick={() => navigate('/owner/stations')}>{t('actions.viewAll')}</button></div>
        {stationRows.isLoading ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : stationRows.data?.items.length ? <div className="space-y-3">
          {stationRows.data.items.map((station) => <article key={station.stationId} className="rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-ink">{station.stationName}</h3><p className="text-xs text-muted">{station.stationCode} · {t(`status.${station.status}`, { defaultValue: station.status })}</p></div>
              <button className="min-h-11 rounded-lg px-3 text-sm font-semibold text-owner hover:bg-owner-soft" onClick={() => { setSelectedStationId(station.stationId); navigate(`/owner/stations?stationId=${station.stationId}`); }}>{t('actions.manage')}</button></div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Metric label={t('metrics.connectors')} value={`${number.format(station.availableConnectors)}/${number.format(station.totalConnectors)}`} />
              <Metric label={t('metrics.charging')} value={number.format(station.chargingConnectors)} />
              <Metric label={t('metrics.needsCheck')} value={number.format(station.connectorsNeedingCheck)} alert={station.connectorsNeedingCheck > 0} />
              <Metric label={t('metrics.sessions')} value={number.format(station.sessionsStarted)} />
            </div>
          </article>)}
        </div> : <Empty title={stationId ? t('empty.noStationData') : t('empty.noStations')} />}
      </section>

      <section className="rounded-card border border-line bg-surface p-4 sm:p-5 xl:col-span-4" aria-labelledby="owner-attention-title">
        <h2 id="owner-attention-title" className="text-lg font-semibold text-ink">{t('sections.attention')}</h2>
        <div className="my-3 flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label={t('sections.attention')}>
          {KINDS.map((value) => <button key={value} role="tab" aria-selected={kind === value} onClick={() => update('kind', value)} className={`min-h-11 shrink-0 border-b-2 px-2 text-sm ${kind === value ? 'border-owner font-semibold text-owner' : 'border-transparent text-muted'}`}>{t(`attentionKinds.${value}`)}</button>)}
        </div>
        {attention.isLoading ? <Skeleton className="h-36" /> : attention.data?.items.length ? <div className="divide-y divide-line">
          {attention.data.items.map((item) => <button key={`${item.kind}-${item.entityId}`} onClick={() => openAttention(item)} className="flex min-h-16 w-full items-center justify-between gap-3 py-3 text-left focus:outline-none focus:ring-2 focus:ring-brand">
            <span className="min-w-0"><span className="block truncate font-semibold text-ink">{item.code}</span><span className="block truncate text-xs text-muted">{item.stationName} · {t(`reasons.${item.reasonCode}`, { defaultValue: item.status })}</span></span>
            <span className="shrink-0 text-xs text-owner">{t('actions.open')}</span>
          </button>)}
        </div> : <Empty title={t('empty.noAttention')} />}
        {!!attention.data?.total && <button className="mt-2 min-h-11 text-sm font-semibold text-owner" onClick={() => navigate(kind === 'TICKET' ? '/owner/tickets' : kind === 'LICENSE' ? '/owner/license' : '/owner/chargers')}>{t('actions.viewAll')} · {number.format(attention.data.total)}</button>}
      </section>
    </div>

    <div className="grid gap-4 xl:grid-cols-12">
      <section className="rounded-card border border-line bg-surface p-4 sm:p-5 xl:col-span-8" aria-labelledby="owner-activity-title">
        <div className="mb-4"><h2 id="owner-activity-title" className="text-lg font-semibold text-ink">{t('sections.activity')}</h2><p className="mt-1 text-sm text-muted">{t('sections.generatedAt', { time: activity.data?.generatedAt ? dateTime(activity.data.generatedAt) : '—' })}</p></div>
        {activity.isLoading ? <Skeleton className="h-56" /> : activity.data ? <>
          <div className="mb-3 grid grid-cols-2 gap-3 sm:max-w-md"><KpiCard label={t('metrics.sessions')} value={number.format(activity.data.sessionsStarted)} /><KpiCard label={t('metrics.bookingsScheduled')} value={number.format(activity.data.bookingsScheduled)} /></div>
          <ActivityChart data={activity.data.daily} locale={locale} formatNumber={(value) => number.format(value)} />
          <div className="mt-3 flex flex-wrap gap-2">{Object.entries(activity.data.bookingsByStatus).map(([status, count]) => <span key={status} className="rounded-full bg-chip px-3 py-1.5 text-xs text-body">{t(`status.${status}`, { defaultValue: status })}: {number.format(count)}</span>)}</div>
        </> : <Empty title={t('empty.noActivity')} />}
      </section>
      <section className="rounded-card border border-line bg-surface p-4 sm:p-5 xl:col-span-4" aria-labelledby="owner-bookings-title">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 id="owner-bookings-title" className="text-lg font-semibold text-ink">{t('panel.upcomingBookings')}</h2><button className="min-h-11 text-sm font-semibold text-owner" onClick={() => navigate(`/owner/bookings${stationId ? `?stationId=${stationId}` : ''}`)}>{t('actions.viewAll')}</button></div>
        {bookings.isLoading ? <Skeleton className="h-36" /> : bookings.data?.items.length ? <div className="divide-y divide-line">{bookings.data.items.map((booking) => <button key={booking.bookingId} className="block min-h-16 w-full py-3 text-left" onClick={() => { if (stationId) setSelectedStationId(stationId); navigate(`/owner/bookings?bookingId=${booking.bookingId}${stationId ? `&stationId=${stationId}` : ''}`); }}><span className="block font-semibold text-ink">{booking.bookingCode || booking.bookingId}</span><span className="text-xs text-muted">{dateTime(booking.startAt)} · {booking.driverDisplayName}</span></button>)}</div> : <Empty title={t('panel.noUpcoming')} />}
      </section>
    </div>
  </div>;
}

function Metric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div><div className="text-xs text-muted">{label}</div><div className={`mt-1 font-semibold tabular-nums ${alert ? 'text-bad' : 'text-ink'}`}>{value}</div></div>;
}
function Empty({ title }: { title: string }) { return <p className="rounded-lg bg-chip px-4 py-6 text-center text-sm text-muted">{title}</p>; }

function ActivityChart({ data, locale, formatNumber }: { data: Array<{ date: string; sessionsStarted: number }>; locale: string; formatNumber: (value: number) => string }) {
  const max = Math.max(1, ...data.map((item) => item.sessionsStarted));
  const points = data.map((item, index) => `${data.length <= 1 ? 50 : (index / (data.length - 1)) * 100},${88 - (item.sessionsStarted / max) * 75}`).join(' ');
  return <div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full overflow-visible" role="img" aria-label={locale.startsWith('en') ? 'Charging sessions by day' : 'Phiên sạc theo ngày'}>
      {[25, 50, 75].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" className="text-line" strokeDasharray="1 2" />)}
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="text-owner" />
      {data.map((item, index) => <circle key={item.date} cx={data.length <= 1 ? 50 : (index / (data.length - 1)) * 100} cy={88 - (item.sessionsStarted / max) * 75} r="1.4" fill="currentColor" className="text-owner"><title>{`${item.date}: ${formatNumber(item.sessionsStarted)}`}</title></circle>)}
    </svg>
    <div className="mt-1 flex justify-between text-xs text-muted"><span>{data[0]?.date}</span><span>{data[data.length - 1]?.date}</span></div>
    <details className="mt-2"><summary className="min-h-11 cursor-pointer pt-3 text-sm font-medium text-owner">{locale.startsWith('en') ? 'View daily values' : 'Xem số liệu từng ngày'}</summary><ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">{data.map((item) => <li key={item.date} className="flex justify-between gap-2"><span>{item.date}</span><strong>{formatNumber(item.sessionsStarted)}</strong></li>)}</ul></details>
  </div>;
}
