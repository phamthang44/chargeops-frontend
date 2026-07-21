import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  formatDateVn,
  LICENSE_STATUS,
  useApi,
  type License,
  type LicenseStatus,
} from '@chargeops/api';
import { Card, PageHeader, ProgressBar, Skeleton, StatusPill, useToast } from '@chargeops/ui';

type FilterKey = LicenseStatus | 'all';

/** Admin license monitoring + manual renewal recording (purchase is off-platform). */
export function Licenses() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data, isLoading, error } = useQuery({ queryKey: ['licenses'], queryFn: () => api.licenses.list() });

  const renew = useMutation({
    mutationFn: (stationId: string) => api.licenses.recordRenewal(stationId),
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      toast(t('licenses.toastRenewal', { name: l.stationName }), 'success');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const all = data ?? [];
  const rows = filter === 'all' ? all : all.filter((l) => l.status === filter);
  const renewalQueue = all.filter((l) => l.status !== 'active');

  const planLabels = {
    yearly: t('licenses.plans.yearly'),
    monthly: t('licenses.plans.monthly'),
  };

  const stats = useMemo(
    () => [
      { key: 'all' as const, label: t('licenses.metrics.total'), value: all.length, accent: '#5b54e8' },
      { key: 'active' as const, label: t('licenses.metrics.active'), value: all.filter((l) => l.status === 'active').length, accent: '#0d8a5a' },
      { key: 'expiring' as const, label: t('licenses.metrics.expiring'), value: all.filter((l) => l.status === 'expiring').length, accent: '#9a6b16' },
      { key: 'expired' as const, label: t('licenses.metrics.expired'), value: all.filter((l) => l.status === 'expired').length, accent: '#c0392b' },
    ],
    [all, t],
  );

  const planMix = useMemo(() => {
    const total = all.length || 1;
    return [
      { name: t('licenses.plans.yearlyPlan'), count: all.filter((l) => l.plan === 'yearly').length, color: '#5b54e8' },
      { name: t('licenses.plans.monthlyPlan'), count: all.filter((l) => l.plan === 'monthly').length, color: '#12a150' },
    ].map((m) => ({ ...m, pct: Math.round((m.count / total) * 100) }));
  }, [all, t]);

  return (
    <>
      <PageHeader title={t('console.nav.licenses.title')} subtitle={t('console.nav.licenses.subtitle')} />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('licenses.error', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <Skeleton className="h-[400px] rounded-card" />
      ) : (
        <>
          {/* clickable stat filters */}
          <div className="mb-3 grid grid-cols-2 gap-[11px] md:grid-cols-4">
            {stats.map((s) => {
              const on = filter === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setFilter(s.key)}
                  className="rounded-[11px] border bg-white px-[15px] py-[13px] text-left"
                  style={{ borderColor: on ? '#c2c6cf' : '#e9ebef', borderLeft: `3px solid ${s.accent}` }}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-faint">{s.label}</div>
                  <div className="mt-[5px] text-[22px] font-bold" style={{ color: s.accent }}>
                    {s.value}
                  </div>
                </button>
              );
            })}
          </div>

          {/* insights */}
          <div className="mb-3.5 grid gap-[13px] lg:grid-cols-2">
            <Card className="p-4">
              <div className="mb-3 text-[13px] font-semibold">{t('licenses.queue.title')}</div>
              {renewalQueue.length === 0 ? (
                <div className="py-5 text-center text-[12.5px] font-medium text-faint">
                  {t('licenses.queue.empty')}
                </div>
              ) : (
                <div className="flex flex-col gap-[9px]">
                  {renewalQueue.map((l) => {
                    const meta = LICENSE_STATUS[l.status];
                    return (
                      <div key={l.stationId} className="flex items-center justify-between gap-2.5 rounded-[9px] border border-line-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <div className="truncate text-[12.5px] font-semibold">{l.stationName}</div>
                          <div className="text-[11px] font-medium text-faint">
                            {l.ownerName} · {planLabels[l.plan]}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2.5">
                          <StatusPill tone={meta.tone} label={l.daysLeft < 0 ? t('licenses.queue.daysOverdue', { days: -l.daysLeft }) : t('licenses.queue.daysLeft', { days: l.daysLeft })} />
                          <button
                            onClick={() => renew.mutate(l.stationId)}
                            disabled={renew.isPending}
                            className="rounded-lg bg-brand px-[11px] py-1.5 text-[11px] font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
                          >
                            {t('licenses.queue.recordRenewal')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <div className="mb-3 text-[13px] font-semibold">{t('licenses.distribution.title')}</div>
              <div className="flex flex-col gap-[13px]">
                {planMix.map((m) => (
                  <div key={m.name}>
                    <div className="mb-[5px] flex justify-between text-[12px] font-medium">
                      <span className="flex items-center gap-[7px] text-body">
                        <span className="h-2 w-2 rounded-[3px]" style={{ background: m.color }} />
                        {m.name}
                      </span>
                      <span className="font-semibold">
                        {m.count} · {m.pct}%
                      </span>
                    </div>
                    <ProgressBar value={m.pct} color={m.color} className="h-[7px]" />
                  </div>
                ))}
              </div>
              <div className="mt-3.5 rounded-[9px] border border-brand-line bg-brand-faint px-[13px] py-[11px] text-[11.5px] leading-[1.5] text-body">
                {t('licenses.distribution.help')}
              </div>
            </Card>
          </div>

          {/* table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div
                  className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
                  style={{ gridTemplateColumns: '0.8fr 1.3fr 1.1fr 0.7fr 1fr 1fr 0.9fr 0.9fr' }}
                >
                  <span>{t('licenses.table.cols.id')}</span>
                  <span>{t('licenses.table.cols.station')}</span>
                  <span>{t('licenses.table.cols.owner')}</span>
                  <span>{t('licenses.table.cols.plan')}</span>
                  <span>{t('licenses.table.cols.expires')}</span>
                  <span>{t('licenses.table.cols.remaining')}</span>
                  <span>{t('licenses.table.cols.status')}</span>
                  <span className="text-right">{t('licenses.table.cols.action')}</span>
                </div>
                {rows.map((l) => (
                  <LicenseRow key={l.stationId} license={l} onRenew={() => renew.mutate(l.stationId)} />
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function LicenseRow({ license: l, onRenew }: { license: License; onRenew: () => void }) {
  const { t } = useTranslation('admin');
  const meta = LICENSE_STATUS[l.status];
  return (
    <div
      className="grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium"
      style={{ gridTemplateColumns: '0.8fr 1.3fr 1.1fr 0.7fr 1fr 1fr 0.9fr 0.9fr' }}
    >
      <span className="font-mono text-[11px] font-semibold text-brand">{l.stationId}</span>
      <span className="font-semibold">{l.stationName}</span>
      <span className="text-muted">{l.ownerName}</span>
      <span className="text-muted">{t(`licenses.plans.${l.plan}`)}</span>
      <span className="text-body">{formatDateVn(l.expiryDate)}</span>
      <span className="text-muted">
        {l.daysLeft < 0 ? t('licenses.table.overdueVal', { days: -l.daysLeft }) : t('licenses.table.daysLeftVal', { days: l.daysLeft })}
      </span>
      <span>
        <StatusPill tone={meta.tone} label={meta.label} />
      </span>
      <span className="text-right">
        {l.status !== 'active' && (
          <button onClick={onRenew} className="text-[11.5px] font-semibold text-brand">
            {t('licenses.table.renewBtn')}
          </button>
        )}
      </span>
    </div>
  );
}
