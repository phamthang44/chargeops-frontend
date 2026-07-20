import { Card } from './Card';

export interface KpiCardProps {
  label: string;
  value: string;
  suffix?: string;
  delta?: string;
  /** Tailwind text-colour class for the delta line, e.g. "text-good". */
  deltaClass?: string;
}

export function KpiCard({ label, value, suffix, delta, deltaClass = 'text-faint' }: KpiCardProps) {
  return (
    <Card className="px-4 py-[15px]">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">
        {label}
      </div>
      <div className="mt-[7px] text-[27px] font-bold tracking-[-0.02em]">
        {value}
        {suffix && <span className="text-[16px] font-medium text-faint">{suffix}</span>}
      </div>
      {delta && <div className={`mt-1 text-[11.5px] font-medium ${deltaClass}`}>{delta}</div>}
    </Card>
  );
}
