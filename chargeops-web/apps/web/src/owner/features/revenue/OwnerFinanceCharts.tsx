import { useState, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@chargeops/auth';
import { useApi, type OwnerDashboardPeriod, type OwnerFinanceAnalytics } from '@chargeops/api';
import {
  Button,
  Card,
  IconArrowRight,
  IconCalendar,
  IconCard,
  IconCheckCircle,
  IconChevronDown,
  IconChevronRight,
  IconPin,
  IconRefreshCw,
  Skeleton,
} from '@chargeops/ui';
import { ApiErrorState } from '../../../shared/components/ApiErrorState';

export interface OwnerFinanceChartsProps {
  stationId?: string;
  period: OwnerDashboardPeriod;
  onSelectStation?: (stationId: string) => void;
}

export function OwnerFinanceCharts({ stationId, period, onSelectStation }: OwnerFinanceChartsProps) {
  const { t, i18n } = useTranslation('ownerDashboard');
  const { user } = useAuth();
  const api = useApi();

  // Include the Vietnam calendar day so the report window rolls over at midnight.
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const report = useQuery({
    queryKey: ['owner-finance-analytics', user?.id, stationId, period, day],
    queryFn: () => api.ownerFinance.analytics({ stationId, period }),
    enabled: !!user,
    refetchInterval: 60000,
    retry: false,
  });

  const locale = i18n.language.startsWith('en') ? 'en-US' : 'vi-VN';
  const money = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(
      new Date(`${value}T12:00:00+07:00`),
    );
  const fullDate = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(
      new Date(`${value}T12:00:00+07:00`),
    );

  return (
    <section aria-labelledby="owner-finance-title" className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-ctl bg-owner-soft p-1.5 text-owner">
              <IconCard size={16} />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-owner">
              {t('finance.eyebrow')}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-owner-border/70 bg-owner-soft/80 px-2 py-0.5 text-[10.5px] font-semibold text-owner-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-owner animate-pulse" />
              {t('finance.simulatorBadge')}
            </span>
          </div>
          <h2 id="owner-finance-title" className="text-xl font-bold tracking-tight text-ink">
            {t('finance.title')}
          </h2>
          <p className="max-w-3xl text-xs sm:text-sm text-muted leading-relaxed">
            {t('finance.description')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            accent="owner"
            size="sm"
            onClick={() => void report.refetch()}
            disabled={report.isFetching}
            icon={<IconRefreshCw size={14} className={report.isFetching ? 'animate-spin' : ''} />}
          >
            {report.isFetching ? t('actions.refreshing') : t('actions.refresh')}
          </Button>
        </div>
      </div>

      {report.isError ? (
        <ApiErrorState error={report.error} compact onRetry={() => void report.refetch()} />
      ) : report.isPending ? (
        <FinanceSkeleton />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <FinanceKpis data={report.data} money={money} t={t} />

          {/* Main Dual Analytics Cards */}
          <div className="grid gap-4 xl:grid-cols-2">
            <CashFlowCard daily={report.data.daily} money={money} date={date} fullDate={fullDate} t={t} />
            <StationRankingCard
              stations={report.data.stations}
              stationCount={report.data.stationCount}
              selectedStationId={stationId}
              onSelectStation={onSelectStation}
              money={money}
              t={t}
            />
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <p>
              {t('finance.generatedAt', {
                time: new Intl.DateTimeFormat(locale, {
                  dateStyle: 'short',
                  timeStyle: 'medium',
                  timeZone: 'Asia/Ho_Chi_Minh',
                }).format(new Date(report.data.generatedAt)),
              })}
            </p>
            <p className="text-[11px] text-faint">{t('finance.unit')}</p>
          </div>
        </>
      )}
    </section>
  );
}

function FinanceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-card" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    </div>
  );
}

function FinanceKpis({
  data,
  money,
  t,
}: {
  data: OwnerFinanceAnalytics;
  money: (n: number) => string;
  t: (key: string, opts?: any) => string;
}) {
  const refundRate =
    data.grossVnd > 0 ? ((data.refundedVnd / data.grossVnd) * 100).toFixed(1) : '0';
  const isNetPositive = data.netVnd >= 0;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {/* Gross Inflow */}
      <Card className="relative overflow-hidden p-4 sm:p-5 border-line/80 transition-all hover:border-owner-border/60 hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t('finance.grossVnd')}
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-owner-soft text-owner">
            <span className="font-bold text-xs">+</span>
          </span>
        </div>
        <p className="mt-2.5 break-words text-2xl sm:text-3xl font-bold tracking-tight text-ink tabular-nums">
          {money(data.grossVnd)}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-owner-deep">
          <span className="inline-flex items-center gap-1 rounded-full bg-owner-soft px-2 py-0.5 text-[10.5px] font-medium">
            {t('finance.inflow')}
          </span>
        </div>
      </Card>

      {/* Refunds Outflow */}
      <Card className="relative overflow-hidden p-4 sm:p-5 border-line/80 transition-all hover:border-warn-border/60 hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t('finance.refundedVnd')}
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warn-soft text-warn">
            <span className="font-bold text-xs">-</span>
          </span>
        </div>
        <p className="mt-2.5 break-words text-2xl sm:text-3xl font-bold tracking-tight text-ink tabular-nums">
          {money(data.refundedVnd)}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[10.5px] font-medium text-warn-deep">
            {t('finance.refundRate', { rate: refundRate })}
          </span>
        </div>
      </Card>

      {/* Net Receipts Hero */}
      <Card
        className={`relative overflow-hidden p-4 sm:p-5 transition-all hover:shadow-xs ${
          isNetPositive
            ? 'border-owner-border/80 bg-gradient-to-br from-surface to-owner-soft/25'
            : 'border-bad-border/80 bg-gradient-to-br from-surface to-bad-soft/25'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t('finance.netVnd')}
          </span>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              isNetPositive ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'
            }`}
          >
            {isNetPositive ? <IconCheckCircle size={15} /> : <span className="font-bold text-xs">!</span>}
          </span>
        </div>
        <p
          className={`mt-2.5 break-words text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
            isNetPositive ? 'text-owner-deep' : 'text-bad'
          }`}
        >
          {money(data.netVnd)}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
              isNetPositive ? 'bg-good-soft text-good-deep' : 'bg-bad-soft text-bad'
            }`}
          >
            {isNetPositive ? t('finance.positiveCashflow') : t('finance.negativeCashflow')}
          </span>
        </div>
      </Card>
    </div>
  );
}

function CashFlowCard({
  daily,
  money,
  date,
  fullDate,
  t,
}: {
  daily: OwnerFinanceAnalytics['daily'];
  money: (n: number) => string;
  date: (s: string) => string;
  fullDate: (s: string) => string;
  t: (key: string, opts?: any) => string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const gradientId = useId();

  const activeRow = hoveredIndex !== null && daily[hoveredIndex] ? daily[hoveredIndex] : null;
  const hasData = daily.some((r) => r.grossVnd > 0 || r.refundedVnd > 0);

  return (
    <Card className="flex flex-col justify-between p-4 sm:p-6 border-line/80">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink">{t('finance.dailyTitle')}</h3>
            <p className="mt-0.5 text-xs text-muted">{t('finance.dailySubtitle')}</p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-body">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-owner shadow-xs" />
              {t('finance.receiptsLegend')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-warn shadow-xs" />
              {t('finance.refundsLegend')}
            </span>
          </div>
        </div>

        {/* Live Inspection Bar */}
        <div className="mt-3 min-h-[38px] rounded-ctl bg-surface-2 px-3 py-1.5 border border-line/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          {activeRow ? (
            <>
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <IconCalendar size={13} className="text-owner" />
                {fullDate(activeRow.date)}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-owner-deep">
                  +{money(activeRow.grossVnd)}
                </span>
                <span className="text-warn-deep">
                  -{money(activeRow.refundedVnd)}
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    activeRow.netVnd < 0 ? 'text-bad' : 'text-ink'
                  }`}
                >
                  {t('finance.netLegend')}: {money(activeRow.netVnd)}
                </span>
              </div>
            </>
          ) : (
            <span className="text-faint italic">{t('finance.inspectHint')}</span>
          )}
        </div>

        {/* Chart View */}
        {!hasData ? (
          <p className="flex min-h-52 items-center justify-center text-sm text-muted">
            {t('finance.empty')}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto pb-1">
            <CashFlowSvg
              daily={daily}
              money={money}
              date={date}
              hoveredIndex={hoveredIndex}
              onHover={setHoveredIndex}
              gradientId={gradientId}
            />
          </div>
        )}
      </div>

      {/* Collapsible Data Table */}
      <div className="mt-4 border-t border-hairline pt-3">
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-owner hover:text-owner-strong transition-colors py-1 cursor-pointer"
        >
          <span>{showTable ? t('finance.hideData') : t('finance.showData')}</span>
          <IconChevronDown
            size={14}
            className={`transition-transform duration-200 ${showTable ? 'rotate-180' : ''}`}
          />
        </button>

        {showTable && (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-card border border-line bg-surface-2/40">
            <table className="w-full text-right text-xs tabular-nums">
              <thead className="sticky top-0 bg-surface-2 text-faint uppercase text-[10px] tracking-wider border-b border-line">
                <tr>
                  <th scope="col" className="p-2.5 text-left font-semibold">
                    {t('finance.date')}
                  </th>
                  <th scope="col" className="p-2.5 font-semibold text-owner">
                    {t('finance.receiptsLegend')}
                  </th>
                  <th scope="col" className="p-2.5 font-semibold text-warn">
                    {t('finance.refundsLegend')}
                  </th>
                  <th scope="col" className="p-2.5 font-semibold text-ink">
                    {t('finance.netLegend')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {daily.map((row) => (
                  <tr key={row.date} className="hover:bg-row-hover transition-colors">
                    <th scope="row" className="p-2.5 text-left font-normal text-body">
                      {date(row.date)}
                    </th>
                    <td className="p-2.5 text-body">{money(row.grossVnd)}</td>
                    <td className="p-2.5 text-body">{money(row.refundedVnd)}</td>
                    <td
                      className={`p-2.5 font-semibold ${
                        row.netVnd < 0 ? 'text-bad' : 'text-owner-deep'
                      }`}
                    >
                      {money(row.netVnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

function CashFlowSvg({
  daily,
  money,
  date,
  hoveredIndex,
  onHover,
  gradientId,
}: {
  daily: OwnerFinanceAnalytics['daily'];
  money: (n: number) => string;
  date: (s: string) => string;
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  gradientId: string;
}) {
  const max = Math.max(1, ...daily.flatMap((row) => [row.grossVnd, row.refundedVnd]));
  const count = daily.length;
  // Usable width and coordinate setup
  const chartWidth = 640;
  const chartHeight = 220;
  const leftMargin = 95;
  const rightMargin = 20;
  const topMargin = 20;
  const baselineY = 175;
  const plotWidth = chartWidth - leftMargin - rightMargin;
  const plotHeight = baselineY - topMargin;
  const step = plotWidth / count;
  const barWidth = Math.min(24, Math.max(4, step * 0.36));

  const ticks = [0, 0.5, 1];

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className={`w-full ${count > 10 ? 'min-w-[480px]' : ''} h-auto select-none`}
      role="img"
      onMouseLeave={() => onHover(null)}
    >
      <defs>
        <linearGradient id={`gross-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12a150" />
          <stop offset="100%" stopColor="#0c7a3e" />
        </linearGradient>
        <linearGradient id={`warn-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Grid horizontal guidelines & Y-axis labels */}
      {ticks.map((ratio) => {
        const y = baselineY - ratio * plotHeight;
        return (
          <g key={ratio}>
            <line
              x1={leftMargin}
              x2={chartWidth - rightMargin}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeDasharray={ratio > 0 ? '3 3' : 'none'}
              className="text-line"
              opacity={ratio === 0 ? 0.9 : 0.5}
            />
            <text
              x={leftMargin - 10}
              y={y + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              className="text-muted font-mono"
            >
              {money(max * ratio)}
            </text>
          </g>
        );
      })}

      {/* Daily Bars & Hover columns */}
      {daily.map((row, index) => {
        const colCenterX = leftMargin + index * step + step / 2;
        const grossH = (row.grossVnd / max) * plotHeight;
        const refundH = (row.refundedVnd / max) * plotHeight;
        const isHovered = hoveredIndex === index;

        // Skip label collisions on long periods (e.g. 30 days)
        const showLabel =
          count <= 10 ||
          index === 0 ||
          index === count - 1 ||
          index % Math.ceil(count / 7) === 0;

        return (
          <g
            key={row.date}
            className="cursor-pointer"
            onMouseEnter={() => onHover(index)}
            onClick={() => onHover(index)}
          >
            {/* Hover highlight background */}
            <rect
              x={leftMargin + index * step + 1}
              y={topMargin - 5}
              width={step - 2}
              height={plotHeight + 10}
              rx="4"
              fill="currentColor"
              className={`transition-colors ${
                isHovered ? 'text-owner/10' : 'text-transparent'
              }`}
            />

            {/* Gross Receipts Bar */}
            <rect
              x={colCenterX - barWidth - 1}
              y={baselineY - grossH}
              width={barWidth}
              height={Math.max(grossH > 0 ? 3 : 0, grossH)}
              rx="3"
              fill={`url(#gross-${gradientId})`}
              className={`transition-opacity ${isHovered ? 'opacity-100' : 'opacity-90'}`}
            />

            {/* Refund Bar */}
            <rect
              x={colCenterX + 1}
              y={baselineY - refundH}
              width={barWidth}
              height={Math.max(refundH > 0 ? 3 : 0, refundH)}
              rx="3"
              fill={`url(#warn-${gradientId})`}
              className={`transition-opacity ${isHovered ? 'opacity-100' : 'opacity-90'}`}
            />

            {/* Date label */}
            {showLabel && (
              <text
                x={colCenterX}
                y={baselineY + 18}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className={`font-mono transition-colors ${
                  isHovered ? 'text-owner font-bold' : 'text-muted'
                }`}
              >
                {date(row.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function StationRankingCard({
  stations,
  stationCount,
  selectedStationId,
  onSelectStation,
  money,
  t,
}: {
  stations: OwnerFinanceAnalytics['stations'];
  stationCount: number;
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  money: (n: number) => string;
  t: (key: string, opts?: any) => string;
}) {
  const max = Math.max(1, ...stations.map((row) => Math.abs(row.netVnd)));

  return (
    <Card className="flex flex-col justify-between p-4 sm:p-6 border-line/80">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink">{t('finance.stationsTitle')}</h3>
            <p className="mt-0.5 text-xs text-muted">
              {t('finance.stationLimit', { count: stationCount, shown: stations.length })}
            </p>
          </div>
        </div>

        {!stations.length ? (
          <p className="flex min-h-52 items-center justify-center text-sm text-muted">
            {t('finance.emptyStation')}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {stations.map((row, index) => {
              const rank = index + 1;
              const isSelected = selectedStationId === row.stationId;
              const barPercent = Math.min(100, Math.round((Math.abs(row.netVnd) / max) * 100));
              const isNetPositive = row.netVnd >= 0;

              return (
                <li
                  key={row.stationId}
                  onClick={() => onSelectStation?.(isSelected ? '' : row.stationId)}
                  className={`group rounded-card p-3 transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? 'border-owner bg-owner-soft/40 shadow-xs'
                      : 'border-line/60 bg-surface-2/40 hover:bg-surface-2 hover:border-line'
                  }`}
                  title={isSelected ? t('finance.clearStationFilter') : t('finance.filterToStation')}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          rank === 1
                            ? 'bg-owner text-white'
                            : rank === 2
                            ? 'bg-chip text-ink'
                            : 'bg-surface text-muted'
                        }`}
                      >
                        {rank}
                      </span>
                      <span className="truncate font-medium text-ink text-sm">
                        {row.stationName}
                      </span>
                      <span className="shrink-0 rounded bg-chip px-1.5 py-0.5 font-mono text-[10px] text-muted">
                        {row.stationCode}
                      </span>
                    </div>

                    <div className="text-right">
                      <strong
                        className={`tabular-nums text-sm font-semibold ${
                          isNetPositive ? 'text-owner-deep' : 'text-bad'
                        }`}
                      >
                        {money(row.netVnd)}
                      </strong>
                    </div>
                  </div>

                  {/* Flow breakdown pill */}
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                    <div className="flex items-center gap-2">
                      <span className="text-owner">+{money(row.grossVnd)}</span>
                      <span>·</span>
                      <span className="text-warn">-{money(row.refundedVnd)}</span>
                    </div>
                    <span className="font-mono text-[10px] text-faint">
                      {t('finance.stationShare', { share: barPercent })}
                    </span>
                  </div>

                  {/* High-end gradient progress bar */}
                  <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line/60" aria-hidden="true">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isNetPositive
                          ? 'bg-gradient-to-r from-owner to-owner-strong'
                          : 'bg-gradient-to-r from-bad to-bad-strong'
                      }`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {stations.length > 0 && selectedStationId && (
        <div className="mt-4 border-t border-hairline pt-3 flex justify-end">
          <Button
            variant="ghost"
            accent="owner"
            size="sm"
            onClick={() => onSelectStation?.('')}
            className="text-owner text-xs"
          >
            {t('finance.clearStationFilter')}
          </Button>
        </div>
      )}
    </Card>
  );
}
