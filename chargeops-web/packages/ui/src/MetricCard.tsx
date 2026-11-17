export interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  /**
   * @deprecated Kept so existing call sites compile. Summary strips no longer carry a colour bar:
   * colour is reserved for status, and a row of rainbow stripes read as decoration.
   */
  accent?: string;
}

/** Compact summary card for count strips (bookings, chargers, licences). */
export function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="rounded-[11px] border border-line bg-surface px-3.5 py-3">
      <div className="text-[12px] font-medium text-muted">{label}</div>
      <div className="mt-1 text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-faint">{sub}</div>}
    </div>
  );
}
