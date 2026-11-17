import { Card } from './Card';

export interface KpiCardProps {
  label: string;
  value: string;
  suffix?: string;
  delta?: string;
  /** Tailwind text-colour class for the delta line, e.g. "text-good". */
  deltaClass?: string;
  /** Set false when nested inside an already-bordered container (single-border policy). */
  bordered?: boolean;
}

export function KpiCard({ label, value, suffix, delta, deltaClass = 'text-faint', bordered }: KpiCardProps) {
  return (
    <Card bordered={bordered} className="px-4 py-[15px]">
      <div className="text-[12.5px] font-medium text-muted">{label}</div>
      <div className="mt-1.5 text-[26px] font-semibold tabular-nums tracking-[-0.02em] text-ink">
        {value}
        {suffix && <span className="text-[15px] font-medium text-faint">{suffix}</span>}
      </div>
      {delta && <div className={`mt-1 text-[12px] ${deltaClass}`}>{delta}</div>}
    </Card>
  );
}
