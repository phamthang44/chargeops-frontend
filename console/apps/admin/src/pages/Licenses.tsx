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
const PLAN_LABEL = { yearly: 'Năm', monthly: 'Tháng' } as const;

/** Admin license monitoring + manual renewal recording (purchase is off-platform). */
export function Licenses() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data, isLoading, error } = useQuery({ queryKey: ['licenses'], queryFn: () => api.licenses.list() });

  const renew = useMutation({
    mutationFn: (stationId: string) => api.licenses.recordRenewal(stationId),
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      toast(`Đã ghi nhận gia hạn ${l.stationName}`, 'success');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const all = data ?? [];
  const rows = filter === 'all' ? all : all.filter((l) => l.status === filter);
  const renewalQueue = all.filter((l) => l.status !== 'active');

  const stats = useMemo(
    () => [
      { key: 'all' as const, label: 'TỔNG GIẤY PHÉP', value: all.length, accent: '#5b54e8' },
      { key: 'active' as const, label: 'ĐANG HOẠT ĐỘNG', value: all.filter((l) => l.status === 'active').length, accent: '#0d8a5a' },
      { key: 'expiring' as const, label: 'SẮP HẾT HẠN', value: all.filter((l) => l.status === 'expiring').length, accent: '#9a6b16' },
      { key: 'expired' as const, label: 'ĐÃ HẾT HẠN', value: all.filter((l) => l.status === 'expired').length, accent: '#c0392b' },
    ],
    [all],
  );

  const planMix = useMemo(() => {
    const total = all.length || 1;
    return [
      { name: 'Gói Năm', count: all.filter((l) => l.plan === 'yearly').length, color: '#5b54e8' },
      { name: 'Gói Tháng', count: all.filter((l) => l.plan === 'monthly').length, color: '#12a150' },
    ].map((m) => ({ ...m, pct: Math.round((m.count / total) * 100) }));
  }, [all]);

  return (
    <>
      <PageHeader title="Giấy phép" subtitle="Giám sát hạn giấy phép và ghi nhận gia hạn thủ công." />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          Không tải được giấy phép: {(error as Error).message}
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
                  <div className="font-mono text-[10px] font-semibold tracking-[0.04em] text-faint">{s.label}</div>
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
              <div className="mb-3 text-[13px] font-semibold">Hàng đợi gia hạn</div>
              {renewalQueue.length === 0 ? (
                <div className="py-5 text-center text-[12.5px] font-medium text-faint">
                  Không có giấy phép nào cần gia hạn.
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
                            {l.ownerName} · {PLAN_LABEL[l.plan]}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2.5">
                          <StatusPill tone={meta.tone} label={l.daysLeft < 0 ? `Quá ${-l.daysLeft} ngày` : `Còn ${l.daysLeft} ngày`} />
                          <button
                            onClick={() => renew.mutate(l.stationId)}
                            disabled={renew.isPending}
                            className="rounded-lg bg-brand px-[11px] py-1.5 text-[11px] font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
                          >
                            Ghi nhận gia hạn
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <div className="mb-3 text-[13px] font-semibold">Phân bổ gói</div>
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
                Mua/gia hạn xử lý ngoài nền tảng (theo SRS). Quản trị viên ghi nhận trạng thái tại đây.
              </div>
            </Card>
          </div>

          {/* table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div
                  className="grid bg-surface-2 px-4 py-[11px] font-mono text-[10px] font-semibold tracking-[0.05em] text-faint"
                  style={{ gridTemplateColumns: '0.8fr 1.3fr 1.1fr 0.7fr 1fr 1fr 0.9fr 0.9fr' }}
                >
                  <span>MÃ</span>
                  <span>TRẠM</span>
                  <span>CHỦ TRẠM</span>
                  <span>GÓI</span>
                  <span>HẾT HẠN</span>
                  <span>CÒN LẠI</span>
                  <span>TRẠNG THÁI</span>
                  <span className="text-right">HÀNH ĐỘNG</span>
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
  const meta = LICENSE_STATUS[l.status];
  return (
    <div
      className="grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium"
      style={{ gridTemplateColumns: '0.8fr 1.3fr 1.1fr 0.7fr 1fr 1fr 0.9fr 0.9fr' }}
    >
      <span className="font-mono text-[11px] font-semibold text-brand">{l.stationId}</span>
      <span className="font-semibold">{l.stationName}</span>
      <span className="text-muted">{l.ownerName}</span>
      <span className="text-muted">{PLAN_LABEL[l.plan]}</span>
      <span className="text-body">{formatDateVn(l.expiryDate)}</span>
      <span className="text-muted">{l.daysLeft < 0 ? `Quá ${-l.daysLeft} ngày` : `${l.daysLeft} ngày`}</span>
      <span>
        <StatusPill tone={meta.tone} label={meta.label} />
      </span>
      <span className="text-right">
        {l.status !== 'active' && (
          <button onClick={onRenew} className="text-[11.5px] font-semibold text-brand">
            Gia hạn
          </button>
        )}
      </span>
    </div>
  );
}
