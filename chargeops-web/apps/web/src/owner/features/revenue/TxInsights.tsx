import { formatVndCompact, type TransactionSummary } from '@chargeops/api';
import { Card, ProgressBar } from '@chargeops/ui';
import { METHOD_META } from './methodMeta';

/** Daily revenue bar chart + payment-method breakdown. */
export function TxInsights({ summary }: { summary: TransactionSummary }) {
  const maxDay = Math.max(1, ...summary.dailyTrend.map((d) => d.vnd));

  return (
    <div className="mb-3.5 grid gap-[13px] lg:grid-cols-[1.4fr_1fr]">
      <Card className="p-4">
        <div className="mb-3.5 text-[13px] font-semibold">
          Doanh thu theo ngày · {summary.dailyTrend.length} ngày
        </div>
        <div className="flex h-[120px] items-end gap-1.5">
          {summary.dailyTrend.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div
                className="w-full rounded-t-[4px] bg-brand"
                style={{ height: `${Math.max(4, (d.vnd / maxDay) * 100)}%` }}
                title={`Ngày ${d.day}: ${formatVndCompact(d.vnd)}`}
              />
              <span className="font-mono text-[8.5px] text-disabled">{d.day}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3.5 text-[13px] font-semibold">Theo phương thức</div>
        <div className="flex flex-col gap-[13px]">
          {summary.methodBreakdown.map((m) => {
            const meta = METHOD_META[m.method];
            return (
              <div key={m.method}>
                <div className="mb-[5px] flex justify-between text-[12px] font-medium">
                  <span className="flex items-center gap-[7px] text-body">
                    <span className="h-2 w-2 rounded-[3px]" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                  <span className="font-semibold">
                    {formatVndCompact(m.totalVnd)} · {m.pct}%
                  </span>
                </div>
                <ProgressBar value={m.pct} color={meta.color} className="h-[7px]" />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
