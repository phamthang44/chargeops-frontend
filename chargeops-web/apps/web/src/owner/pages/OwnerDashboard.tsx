import { useId, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi, type OwnerDashboardAttentionKind, type OwnerDashboardPeriod } from '@chargeops/api';
import {
  Button,
  Card,
  IconAlertTriangle,
  IconArrowRight,
  IconBarChart,
  IconBolt,
  IconCalendar,
  IconCheckCircle,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconGrid,
  IconInfoCircle,
  IconLifebuoy,
  IconPin,
  IconRefreshCw,
  IconShieldAlert,
  IconWrench,
  IconX,
  PageHeader,
  SegmentedControl,
  Select,
  type SelectOption,
  Skeleton,
  StatusPill,
  type PillTone,
} from '@chargeops/ui';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
import { useOwnerStation } from '../context/OwnerStationContext';
import { OwnerFinanceCharts } from '../features/revenue/OwnerFinanceCharts';

const PERIODS: OwnerDashboardPeriod[] = ['7d', '30d'];
const KINDS: OwnerDashboardAttentionKind[] = ['EQUIPMENT', 'TICKET', 'LICENSE'];

export function OwnerDashboard() {
  const { t, i18n } = useTranslation('ownerDashboard');
  const api = useApi();
  const navigate = useNavigate();
  const { setSelectedStationId } = useOwnerStation();
  const [params, setParams] = useSearchParams();
  const stationId = params.get('stationId') || undefined;
  const period = PERIODS.includes(params.get('period') as OwnerDashboardPeriod)
    ? (params.get('period') as OwnerDashboardPeriod)
    : '7d';
  const kind = KINDS.includes(params.get('kind') as OwnerDashboardAttentionKind)
    ? (params.get('kind') as OwnerDashboardAttentionKind)
    : 'EQUIPMENT';

  const update = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const stationList = useQuery({
    queryKey: ['owner-dashboard', 'station-options'],
    queryFn: async () => {
      const collected: any[] = [];
      for (let pageNo = 1; pageNo <= 100; pageNo += 1) {
        const response = (await api.stations.mine({ pageNo, pageSize: 100 })) as any;
        const items = Array.isArray(response) ? response : response?.items ?? [];
        collected.push(...items);
        const total = response?.total ?? response?.meta?.totalElements;
        if (
          items.length === 0 ||
          (total != null && collected.length >= total) ||
          (Array.isArray(response) && items.length < 100)
        )
          break;
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

  const summary = useQuery({
    queryKey: ['owner-dashboard', 'summary'],
    queryFn: () => api.dashboard.owner(),
    enabled: !stationId,
  });
  const activity = useQuery({
    queryKey: ['owner-dashboard', 'activity', stationId, period],
    queryFn: () => api.dashboard.ownerActivity({ stationId, period }),
  });
  const stationRows = useQuery({
    queryKey: ['owner-dashboard', 'stations', stationId, period],
    queryFn: () => api.dashboard.ownerStations({ stationId, period, page: 1, size: 5 }),
  });
  const attention = useQuery({
    queryKey: ['owner-dashboard', 'attention', stationId, kind],
    queryFn: () => api.dashboard.ownerAttention({ stationId, kind, page: 1, size: 5 }),
  });
  const bookings = useQuery({
    queryKey: ['owner-dashboard', 'bookings', stationId],
    queryFn: () =>
      api.ownerBookings.list({
        stationId,
        status: 'CONFIRMED',
        from: new Date().toISOString(),
        sort: 'startAt,asc',
        windowMode: 'START_IN_WINDOW',
        pageSize: 5,
      }),
  });

  const locale = i18n.language.startsWith('en') ? 'en-US' : 'vi-VN';
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(value));
  const chartDate = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(`${value}T12:00:00+07:00`));

  const error =
    activity.error ||
    stationRows.error ||
    attention.error ||
    (!stationId ? summary.error : undefined);
  const isRefreshing =
    activity.isFetching ||
    stationRows.isFetching ||
    attention.isFetching ||
    bookings.isFetching ||
    (!stationId && summary.isFetching);

  const retry = () => {
    void Promise.all([
      activity.refetch(),
      stationRows.refetch(),
      attention.refetch(),
      bookings.refetch(),
      ...(!stationId ? [summary.refetch()] : []),
    ]);
  };

  const openAttention = (item: NonNullable<typeof attention.data>['items'][number]) => {
    setSelectedStationId(item.stationId);
    if (item.kind === 'TICKET') navigate(`/owner/tickets/${item.entityId}`);
    else if (item.kind === 'LICENSE') navigate(`/owner/license?stationId=${item.stationId}`);
    else
      navigate(
        `/owner/chargers?stationId=${item.stationId}&${
          item.reasonCode === 'CONNECTOR_OFFLINE' ? 'connectorId' : 'chargePointId'
        }=${item.entityId}`,
      );
  };

  return (
    <div className="role-dashboard space-y-6 pb-8">
      {/* Page Header (No kicker/eyebrow per craft-floor rule) */}
      <header>
        <PageHeader
          title={t('title')}
          subtitle={
            stationId
              ? t('hero.stationScope', { station: selectedStation?.name ?? t('hero.selectedStation') })
              : t('subtitleFormatted', {
                  date: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date()),
                })
          }
          action={
            <Button
              variant="secondary"
              accent="owner"
              size="sm"
              onClick={retry}
              disabled={isRefreshing}
              icon={<IconRefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
            >
              {isRefreshing ? t('actions.refreshing') : t('actions.refresh')}
            </Button>
          }
        />
      </header>

      {/* Scope and Period Control Toolbar */}
      <div className="relative z-10 flex flex-col gap-3 rounded-card border border-line bg-surface p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-owner-soft text-owner">
            <IconPin size={16} />
          </span>
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
          {stationId && (
            <button
              type="button"
              onClick={() => update('stationId', undefined)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-3 hover:text-ink"
              title={t('finance.clearStationFilter', { defaultValue: 'Bỏ lọc trạm' })}
            >
              <IconX size={12} />
              <span>{t('finance.clearStationFilter', { defaultValue: 'Bỏ lọc' })}</span>
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SegmentedControl
            segments={PERIODS.map((value) => ({ key: value, label: t(`filters.${value}`) }))}
            active={period}
            onChange={(value) => update('period', value)}
            accent="owner"
          />
        </div>
      </div>

      {error && (
        <ApiErrorState
          error={error}
          eyebrow={t('dashboard.error.eyebrow')}
          title={t('dashboard.error.title')}
          onRetry={retry}
        />
      )}

      {/* Real-Time Fleet Operational Snapshot (Single-border policy, uniform KPI vocabulary) */}
      {!stationId && (
        <section aria-labelledby="owner-current-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 id="owner-current-title" className="text-base font-semibold text-ink">
                {t('sections.current')}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
                {t('hero.liveStatus')}
              </span>
            </div>
          </div>

          {summary.isLoading ? (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {PERIODS.concat(PERIODS).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-card" />
              ))}
            </div>
          ) : (
            summary.data && (
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {/* Active Stations */}
                <div className="flex flex-col justify-between rounded-card border border-line bg-surface p-4 shadow-2xs transition-all hover:border-line-hover sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {t('kpi.activeStations')}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-owner-soft text-owner">
                      <IconGrid size={15} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold tracking-tight text-ink tabular-nums sm:text-3xl">
                      {number.format(summary.data.stations.activeStations)}
                      <span className="text-base font-normal text-muted">
                        /{number.format(summary.data.stations.totalStations)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-owner-deep font-medium">
                      {t('hero.activeStationNote')}
                    </p>
                  </div>
                </div>

                {/* Chargers Online */}
                <div className="flex flex-col justify-between rounded-card border border-line bg-surface p-4 shadow-2xs transition-all hover:border-line-hover sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {t('kpi.chargersOnline')}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-owner-soft text-owner">
                      <IconBolt size={15} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold tracking-tight text-ink tabular-nums sm:text-3xl">
                      {number.format(summary.data.stations.onlineChargePoints)}
                      <span className="text-base font-normal text-muted">
                        /{number.format(summary.data.stations.totalChargePoints)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-owner-deep font-medium">
                      {t('hero.onlineNote')}
                    </p>
                  </div>
                </div>

                {/* Available Connectors */}
                <div className="flex flex-col justify-between rounded-card border border-line bg-surface p-4 shadow-2xs transition-all hover:border-line-hover sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {t('kpi.connectorsAvailable')}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-good-soft text-good">
                      <IconCheckCircle size={15} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold tracking-tight text-ink tabular-nums sm:text-3xl">
                      {number.format(summary.data.hardware.availableConnectors)}
                      <span className="text-base font-normal text-muted">
                        /{number.format(summary.data.hardware.totalConnectors)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-good font-medium">
                      {t('hero.availableNote')}
                    </p>
                  </div>
                </div>

                {/* Currently Charging */}
                <div className="flex flex-col justify-between rounded-card border border-line bg-surface p-4 shadow-2xs transition-all hover:border-line-hover sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {t('metrics.charging')}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-muted">
                      <IconClock size={15} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold tracking-tight text-ink tabular-nums sm:text-3xl">
                      {number.format(summary.data.hardware.chargingConnectors)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {t('hero.chargingNote')}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </section>
      )}

      {/* Cashflow & Financial Insights */}
      <OwnerFinanceCharts
        stationId={stationId}
        period={period}
        onSelectStation={(id) => {
          if (id) setSelectedStationId(id);
          update('stationId', id || undefined);
        }}
      />

      {/* Fleet Operations & Action Items Grid */}
      <div className="grid gap-4 xl:grid-cols-12">
        {/* Station Operations Fleet (xl:col-span-8, single-border list design) */}
        <section className="xl:col-span-8" aria-labelledby="owner-stations-title">
          <Card className="h-full p-4 sm:p-6 shadow-2xs">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-owner-soft text-owner">
                  <IconPin size={18} />
                </span>
                <div>
                  <h2 id="owner-stations-title" className="text-base font-semibold text-ink">
                    {t('sections.stations')}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {t('sections.stationHelp', { period: t(`filters.${period}`) })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                accent="owner"
                size="sm"
                onClick={() => navigate('/owner/stations')}
                className="text-owner"
              >
                {t('actions.viewAll')}
                <IconArrowRight size={14} />
              </Button>
            </div>

            {stationRows.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 rounded-card" />
                <Skeleton className="h-28 rounded-card" />
              </div>
            ) : stationRows.data?.items.length ? (
              <div className="divide-y divide-hairline">
                {stationRows.data.items.map((station) => {
                  const availability =
                    station.totalConnectors > 0
                      ? Math.round((station.availableConnectors / station.totalConnectors) * 100)
                      : 0;
                  const normStatus = String(station.status || '').toUpperCase();
                  const tone: PillTone =
                    normStatus === 'ACTIVE'
                      ? 'good'
                      : normStatus === 'SUSPENDED' || normStatus === 'REJECTED'
                      ? 'bad'
                      : normStatus === 'PENDING' || normStatus === 'PENDING_APPROVAL'
                      ? 'warn'
                      : 'neutral';
                  const statusLabel = t(`status.${station.status}`, {
                    defaultValue: t(`status.${normStatus}`, { defaultValue: station.status }),
                  });

                  return (
                    <article
                      key={station.stationId}
                      className="py-4 first:pt-0 last:pb-0 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold text-ink text-sm sm:text-base">
                              {station.stationName}
                            </h3>
                            <StatusPill tone={tone} label={statusLabel} />
                          </div>
                          <p className="mt-0.5 font-mono text-xs text-muted">
                            {station.stationCode}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          accent="owner"
                          size="sm"
                          onClick={() => {
                            setSelectedStationId(station.stationId);
                            navigate(`/owner/stations?stationId=${station.stationId}`);
                          }}
                        >
                          <span>{t('actions.manage')}</span>
                          <IconChevronRight size={14} />
                        </Button>
                      </div>

                      {/* 4-Column Aligned Operational Metrics */}
                      <div className="mt-3.5 grid grid-cols-2 gap-3 rounded-lg bg-surface-2 p-3 sm:grid-cols-4">
                        <Metric
                          label={t('metrics.connectors')}
                          value={`${number.format(station.availableConnectors)}/${number.format(
                            station.totalConnectors,
                          )}`}
                        />
                        <Metric
                          label={t('metrics.charging')}
                          value={number.format(station.chargingConnectors)}
                        />
                        <Metric
                          label={t('metrics.needsCheck')}
                          value={number.format(station.connectorsNeedingCheck)}
                          alert={station.connectorsNeedingCheck > 0}
                        />
                        <Metric
                          label={t('metrics.sessions')}
                          value={number.format(station.sessionsStarted)}
                        />
                      </div>

                      {/* Availability Rail */}
                      <div
                        className="mt-3 flex items-center gap-3"
                        aria-label={t('metrics.connectorAvailability', {
                          available: station.availableConnectors,
                          total: station.totalConnectors,
                        })}
                      >
                        <span className="text-xs text-muted shrink-0">
                          {t('metrics.availability')}
                        </span>
                        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3">
                          <span
                            className={`block h-full rounded-full transition-all duration-300 ${
                              availability >= 50
                                ? 'bg-good'
                                : availability > 20
                                ? 'bg-warn'
                                : 'bg-bad'
                            }`}
                            style={{ width: `${availability}%` }}
                          />
                        </div>
                        <strong className="text-xs tabular-nums text-ink font-semibold">
                          {availability}%
                        </strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <Empty
                icon={<IconPin size={24} className="text-muted" />}
                title={stationId ? t('empty.noStationData') : t('empty.noStations')}
                action={!stationId ? t('actions.registerStation') : undefined}
                onAction={() => navigate('/owner/stations')}
              />
            )}
          </Card>
        </section>

        {/* Attention / Action Required (xl:col-span-4) */}
        <section className="xl:col-span-4" aria-labelledby="owner-attention-title">
          <Card className="flex h-full flex-col p-4 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warn-soft text-warn">
                  <IconWrench size={18} />
                </span>
                <div>
                  <h2 id="owner-attention-title" className="text-base font-semibold text-ink">
                    {t('sections.attention')}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">{t('hero.attentionHint')}</p>
                </div>
              </div>
              <span className="rounded-full border border-hairline bg-surface-2 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-body">
                {number.format(attention.data?.total ?? 0)}
              </span>
            </div>

            <SegmentedControl
              segments={KINDS.map((value) => ({
                key: value,
                label: t(`attentionKinds.${value}`),
              }))}
              active={kind}
              onChange={(value) => update('kind', value)}
              accent="owner"
            />

            <div className="mt-3 flex-1">
              {attention.isLoading ? (
                <Skeleton className="h-40 rounded-card" />
              ) : attention.data?.items.length ? (
                <div className="divide-y divide-hairline">
                  {attention.data.items.map((item) => {
                    const isSevere = [
                      'REJECTED',
                      'SUSPENDED',
                      'LICENSE_EXPIRED',
                    ].includes(String(item.reasonCode || item.status).toUpperCase());

                    return (
                      <button
                        key={`${item.kind}-${item.entityId}`}
                        type="button"
                        onClick={() => openAttention(item)}
                        className="group flex min-h-14 w-full items-center gap-3 py-3 text-left transition-colors hover:bg-surface-2/60 rounded-lg px-2 -mx-2"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isSevere ? 'bg-bad-soft text-bad' : 'bg-warn-soft text-warn'
                          }`}
                        >
                          {item.kind === 'TICKET' ? (
                            <IconLifebuoy size={16} />
                          ) : item.kind === 'LICENSE' ? (
                            <IconShieldAlert size={16} />
                          ) : (
                            <IconBolt size={16} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate font-mono text-xs font-semibold text-ink">
                            {item.code}
                          </strong>
                          <span className="block truncate text-xs text-muted">
                            {item.stationName}
                          </span>
                          <span
                            className={`block truncate text-xs ${
                              isSevere ? 'font-medium text-bad' : 'text-warn'
                            }`}
                          >
                            {t(`reasons.${item.reasonCode}`, {
                              defaultValue: t(`status.${item.status}`, {
                                defaultValue: t(
                                  `status.${String(item.status || '').toUpperCase()}`,
                                  { defaultValue: item.reasonCode || item.status },
                                ),
                              }),
                            })}
                          </span>
                        </span>
                        <IconChevronRight
                          size={15}
                          className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-good-soft text-good">
                    <IconCheckCircle size={20} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-ink">{t('empty.noAttention')}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {t('panel.noActionItems', { defaultValue: 'Không có mục cần xử lý.' })}
                  </p>
                </div>
              )}
            </div>

            {!!attention.data?.total && (
              <Button
                variant="ghost"
                accent="owner"
                size="sm"
                onClick={() =>
                  navigate(
                    kind === 'TICKET'
                      ? '/owner/tickets'
                      : kind === 'LICENSE'
                      ? '/owner/license'
                      : '/owner/chargers',
                  )
                }
                className="mt-3 text-owner self-start"
              >
                {t('actions.viewAll')}
                <IconArrowRight size={14} />
              </Button>
            )}
          </Card>
        </section>
      </div>

      {/* Activity Timeline & Upcoming Bookings Grid */}
      <div className="grid gap-4 xl:grid-cols-12">
        {/* Activity Chart Section (xl:col-span-8) */}
        <section className="xl:col-span-8" aria-labelledby="owner-activity-title">
          <Card className="h-full p-4 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-owner-soft text-owner">
                <IconBarChart size={18} />
              </span>
              <div>
                <h2 id="owner-activity-title" className="text-base font-semibold text-ink">
                  {t('sections.activity')}
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  {t('sections.generatedAt', {
                    time: activity.data?.generatedAt ? dateTime(activity.data.generatedAt) : '—',
                  })}
                </p>
              </div>
            </div>

            {activity.isLoading ? (
              <Skeleton className="h-64 rounded-card" />
            ) : activity.data ? (
              <>
                <div className="mb-4 flex flex-wrap gap-8 border-b border-hairline pb-4">
                  <Metric
                    label={t('metrics.sessions')}
                    value={number.format(activity.data.sessionsStarted)}
                    featured
                  />
                  <Metric
                    label={t('metrics.bookingsScheduled')}
                    value={number.format(activity.data.bookingsScheduled)}
                    featured
                  />
                </div>

                <ActivityChart
                  data={activity.data.daily}
                  formatNumber={(value) => number.format(value)}
                  formatDate={chartDate}
                />

                <div
                  className="mt-4 flex flex-wrap items-center gap-2"
                  aria-label={t('chart.bookingStatuses')}
                >
                  <span className="text-xs text-muted mr-1">
                    {t('chart.bookingStatuses', { defaultValue: 'Trạng thái:' })}
                  </span>
                  {Object.entries(activity.data.bookingsByStatus).map(([status, count]) => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-2.5 py-1 text-xs text-body"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-owner" />
                      <span>{t(`status.${status}`, { defaultValue: status })}:</span>
                      <strong className="font-mono tabular-nums text-ink">{number.format(count)}</strong>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <Empty
                icon={<IconBarChart size={24} className="text-muted" />}
                title={t('empty.noActivity')}
              />
            )}
          </Card>
        </section>

        {/* Upcoming Bookings Panel (xl:col-span-4) */}
        <section className="xl:col-span-4" aria-labelledby="owner-bookings-title">
          <Card className="flex h-full flex-col p-4 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-owner-soft text-owner">
                <IconCalendar size={18} />
              </span>
              <div>
                <h2 id="owner-bookings-title" className="text-base font-semibold text-ink">
                  {t('panel.upcomingBookings')}
                </h2>
                <p className="mt-0.5 text-xs text-muted">{t('hero.confirmedOnly')}</p>
              </div>
            </div>

            <div className="flex-1">
              {bookings.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 rounded-card" />
                  <Skeleton className="h-16 rounded-card" />
                </div>
              ) : bookings.isError ? (
                <ApiErrorState
                  error={bookings.error}
                  compact
                  onRetry={() => void bookings.refetch()}
                />
              ) : bookings.data?.items.length ? (
                <div className="divide-y divide-hairline">
                  {bookings.data.items.map((booking) => (
                    <button
                      key={booking.bookingId}
                      type="button"
                      className="group flex min-h-16 w-full items-center gap-3 py-3 text-left transition-colors hover:bg-surface-2/60 rounded-lg px-2 -mx-2"
                      onClick={() => {
                        if (stationId) setSelectedStationId(stationId);
                        navigate(
                          `/owner/bookings?bookingId=${booking.bookingId}${
                            stationId ? `&stationId=${stationId}` : ''
                          }`,
                        );
                      }}
                    >
                      {/* Date Block */}
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-hairline bg-surface-2 text-ink">
                        <strong className="text-xs font-bold leading-none">
                          {new Intl.DateTimeFormat(locale, {
                            day: '2-digit',
                            timeZone: 'Asia/Ho_Chi_Minh',
                          }).format(new Date(booking.startAt))}
                        </strong>
                        <span className="mt-0.5 text-[9px] font-semibold uppercase text-muted">
                          {new Intl.DateTimeFormat(locale, {
                            month: 'short',
                            timeZone: 'Asia/Ho_Chi_Minh',
                          }).format(new Date(booking.startAt))}
                        </span>
                      </span>

                      {/* Info */}
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate font-mono text-xs font-semibold text-ink">
                          {booking.bookingCode || booking.bookingId}
                        </strong>
                        <span className="block truncate text-xs text-muted">
                          {dateTime(booking.startAt)}
                        </span>
                        <span className="block truncate text-xs text-muted font-medium">
                          {booking.driverDisplayName}
                        </span>
                      </span>

                      <IconChevronRight
                        size={15}
                        className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  icon={<IconCalendar size={24} className="text-muted" />}
                  title={t('panel.noUpcoming')}
                />
              )}
            </div>

            {!!bookings.data?.items.length && (
              <Button
                variant="ghost"
                accent="owner"
                size="sm"
                onClick={() =>
                  navigate(`/owner/bookings${stationId ? `?stationId=${stationId}` : ''}`)
                }
                className="mt-3 text-owner self-start"
              >
                {t('actions.viewAll')}
                <IconArrowRight size={14} />
              </Button>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  alert = false,
  featured = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
  featured?: boolean;
}) {
  return (
    <div>
      <span className="block text-[11px] font-medium text-muted">{label}</span>
      <strong
        className={`mt-0.5 block tabular-nums ${
          featured ? 'text-2xl sm:text-3xl font-bold tracking-tight' : 'text-sm font-semibold'
        } ${alert ? 'text-warn font-semibold' : 'text-ink'}`}
      >
        {value}
      </strong>
    </div>
  );
}

function Empty({
  icon,
  title,
  action,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline py-8 px-4 text-center">
      {icon && <div className="mb-2">{icon}</div>}
      <p className="text-xs text-muted">{title}</p>
      {action && (
        <Button
          variant="secondary"
          accent="owner"
          size="sm"
          onClick={onAction}
          className="mt-3 text-owner"
        >
          {action}
          <IconArrowRight size={13} />
        </Button>
      )}
    </div>
  );
}

function ActivityChart({
  data,
  formatNumber,
  formatDate,
}: {
  data: Array<{ date: string; sessionsStarted: number }>;
  formatNumber: (value: number) => string;
  formatDate: (value: string) => string;
}) {
  const { t } = useTranslation('ownerDashboard');
  const gradientId = useId();
  const max = Math.max(1, ...data.map((item) => item.sessionsStarted));
  const x = (index: number) => (data.length <= 1 ? 50 : (index / (data.length - 1)) * 100);
  const y = (value: number) => 88 - (value / max) * 72;
  const points = data.map((item, index) => `${x(index)},${y(item.sessionsStarted)}`).join(' ');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{t('chart.sessionsByDay')}</p>
        <span className="text-[11px] text-faint">
          {t('chart.accessibleLabel', { defaultValue: 'Số phiên / ngày' })}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-surface-2/40 p-3">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-44 w-full overflow-visible"
          role="img"
          aria-label={t('chart.accessibleLabel')}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-owner)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-owner)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Clean guide lines */}
          {[16, 40, 64, 88].map((line) => (
            <line
              key={line}
              x1="0"
              x2="100"
              y1={line}
              y2={line}
              stroke="var(--color-line)"
              strokeDasharray="2 3"
              strokeWidth="0.75"
            />
          ))}

          {/* Area fill */}
          <polygon points={`0,88 ${points} 100,88`} fill={`url(#${gradientId})`} />

          {/* Line stroke */}
          <polyline
            points={points}
            fill="none"
            stroke="var(--color-owner)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data point markers */}
          {data.map((item, index) => (
            <circle
              key={item.date}
              cx={x(index)}
              cy={y(item.sessionsStarted)}
              r="2"
              fill="var(--color-surface)"
              stroke="var(--color-owner)"
              strokeWidth="1.5"
            >
              <title>
                {t('chart.pointLabel', {
                  date: formatDate(item.date),
                  count: formatNumber(item.sessionsStarted),
                })}
              </title>
            </circle>
          ))}
        </svg>

        <div className="mt-2 flex justify-between text-[11px] text-muted">
          <span>{data[0] ? formatDate(data[0].date) : '—'}</span>
          <span>{data[data.length - 1] ? formatDate(data[data.length - 1].date) : '—'}</span>
        </div>
      </div>

      {/* Daily Data Table Accordion */}
      <details className="group rounded-lg border border-hairline bg-surface-2/40 px-3 py-2 text-xs">
        <summary className="flex cursor-pointer items-center justify-between font-medium text-owner select-none">
          <span>{t('chart.viewDailyValues')}</span>
          <IconChevronDown
            size={14}
            className="transition-transform group-open:rotate-180 text-muted"
          />
        </summary>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-hairline pt-3 sm:grid-cols-3">
          {data.map((item) => (
            <li key={item.date} className="flex justify-between gap-2 text-[11px]">
              <span className="text-muted">{formatDate(item.date)}</span>
              <strong className="font-mono tabular-nums text-ink">
                {formatNumber(item.sessionsStarted)}
              </strong>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
