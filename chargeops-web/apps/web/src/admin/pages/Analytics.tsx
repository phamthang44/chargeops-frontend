import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatVndCompact, useApi, type AnalyticsOverview } from '@chargeops/api';
import { Card, KpiCard, PageHeader, ProgressBar, SegmentedControl, Skeleton } from '@chargeops/ui';

const CONNECTOR_COLOR: Record<string, string> = {
  CCS2: '#5b54e8',
  CHAdeMO: '#12a150',
  Type2AC: '#9a6b16',
  GBT: '#c0392b',
};
const CONNECTOR_LABEL: Record<string, string> = {
  CCS2: 'CCS2',
  CHAdeMO: 'CHAdeMO',
  Type2AC: 'Type 2 AC',
  GBT: 'GB/T',
};

function translateDelta(d: string, t: any): string {
  if (d.includes('so với kỳ trước')) {
    return d.replace('so với kỳ trước', t('analytics.deltas.vsPrevious'));
  }
  if (d.includes('lượt')) {
    return d.replace('lượt', t('analytics.deltas.bookings'));
  }
  if (d.includes('tuần này')) {
    return d.replace('tuần này', t('analytics.deltas.thisWeek'));
  }
  if (d.includes('điểm')) {
    return d.replace('điểm', t('analytics.deltas.points'));
  }
  return d;
}

/** Platform-wide analytics (admin, read-only). */
export function Analytics() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const [range, setRange] = useState<'30d' | '90d' | '12m'>('12m');
  const { data, isLoading, error } = useQuery({ queryKey: ['analytics'], queryFn: () => api.analytics.overview() });

  return (
    <>
      <PageHeader title={t('console.nav.analytics.title')} subtitle={t('console.nav.analytics.subtitle')} />

      <div className="mb-3.5 flex justify-end">
        <SegmentedControl
          segments={[
            { key: '30d', label: t('analytics.ranges.30d') },
            { key: '90d', label: t('analytics.ranges.90d') },
            { key: '12m', label: t('analytics.ranges.12m') },
          ]}
          active={range}
          onChange={setRange}
        />
      </div>

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('analytics.error', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <Skeleton className="h-[500px] rounded-card" />
      ) : (
        <Body data={data} />
      )}
    </>
  );
}

function Body({ data }: { data: AnalyticsOverview }) {
  const { t } = useTranslation('admin');
  const maxRev = Math.max(...data.revenueTrend.map((m) => m.vnd));
  const maxPeak = Math.max(...data.peakHours.map((p) => p.sessions), 1);

  const kpiKeys: Record<string, string> = {
    'DOANH THU 12TH': 'analytics.kpis.revenue12m',
    'TỔNG ĐẶT CHỖ': 'analytics.kpis.totalBookings',
    'TRẠM HOẠT ĐỘNG': 'analytics.kpis.activeStations',
    'TỶ LỆ LẤP ĐẦY': 'analytics.kpis.occupancyRate',
    'HỦY / NO-SHOW': 'analytics.kpis.cancellationNoShow',
  };

  return (
    <>
      <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-3 xl:grid-cols-5">
        {data.kpis.map((k) => (
          <KpiCard
            key={k.label}
            label={t(kpiKeys[k.label] || k.label, { defaultValue: k.label })}
            value={k.value}
            delta={translateDelta(k.delta, t)}
            deltaClass={k.deltaPositive ? 'text-good' : 'text-bad'}
          />
        ))}
      </div>

      <div className="mb-3.5 grid gap-[13px] lg:grid-cols-[1fr_340px]">
        {/* revenue 12m bars */}
        <Card className="p-4">
          <div className="mb-3.5 text-[14px] font-semibold">{t('analytics.charts.bookingsRevenue')}</div>
          <div className="flex h-[160px] items-end gap-1.5">
            {data.revenueTrend.map((m) => (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div
                  className="w-full rounded-t-[3px] bg-brand"
                  style={{ height: `${Math.max(4, (m.vnd / maxRev) * 100)}%` }}
                  title={`${m.month}: ${formatVndCompact(m.vnd)}`}
                />
                <span className="font-mono text-[8.5px] text-disabled">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* top stations */}
        <Card className="p-4">
          <div className="mb-3.5 text-[14px] font-semibold">{t('analytics.charts.revenueByStation')}</div>
          <div className="flex flex-col gap-[13px]">
            {data.topStations.map((s) => (
              <div key={s.name}>
                <div className="mb-[5px] flex justify-between text-[12px] font-medium">
                  <span className="text-body">{s.name}</span>
                  <span className="font-semibold">{formatVndCompact(s.revenueVnd)}</span>
                </div>
                <ProgressBar value={s.pct} color="#5b54e8" className="h-[7px]" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-[13px] lg:grid-cols-[1fr_340px]">
        {/* peak hours */}
        <Card className="p-4">
          <div className="mb-1 text-[14px] font-semibold">{t('analytics.charts.peakHours')}</div>
          <div className="mb-3.5 text-[11.5px] text-faint">{t('analytics.charts.peakHoursSub')}</div>
          <div className="flex h-[120px] items-end gap-[3px]">
            {data.peakHours.map((p) => (
              <div key={p.hour} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div
                  className="w-full rounded-t-[3px]"
                  style={{
                    height: `${Math.max(3, (p.sessions / maxPeak) * 100)}%`,
                    background: p.sessions > maxPeak * 0.7 ? '#5b54e8' : '#c8c5f6',
                  }}
                />
                <span className="h-2.5 font-mono text-[8px] text-disabled">{p.hour % 6 === 0 ? p.hour : ''}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* connector mix */}
        <Card className="p-4">
          <div className="mb-3.5 text-[14px] font-semibold">{t('analytics.charts.connectionTypes')}</div>
          <div className="mb-4 flex h-[13px] overflow-hidden rounded-[7px]">
            {data.connectorMix.map((c) => (
              <div key={c.connector} style={{ width: `${c.pct}%`, background: CONNECTOR_COLOR[c.connector] }} />
            ))}
          </div>
          <div className="flex flex-col gap-[11px]">
            {data.connectorMix.map((c) => (
              <div key={c.connector} className="flex items-center justify-between text-[12.5px] font-medium">
                <span className="flex items-center gap-2 text-body">
                  <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: CONNECTOR_COLOR[c.connector] }} />
                  {CONNECTOR_LABEL[c.connector]}
                </span>
                <span className="font-semibold">{c.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
