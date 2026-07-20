export interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  /** Left accent bar colour (hex or CSS var). */
  accent: string;
}

/** Compact summary card with a left accent bar (booking/charger/station strips). */
export function MetricCard({ label, value, sub, accent }: MetricCardProps) {
  return (
    <div
      className="rounded-[11px] border border-line-2 bg-white px-[13px] py-3"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.06em] text-faint">{label}</div>
      <div className="mt-[5px] text-[18px] font-bold tracking-[-0.01em] text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-[10.5px] text-faint">{sub}</div>}
    </div>
  );
}
