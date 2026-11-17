import { createContext, useContext, type ReactNode } from 'react';

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

const InStrip = createContext(false);

/**
 * One bordered bar holding several MetricCards, split by hairlines — a stats
 * bar instead of a row of separate tiles. 2 columns on phones, one row from md.
 */
export function MetricStrip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        'grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line',
        'md:auto-cols-fr md:grid-flow-col md:grid-cols-none',
        // An odd last cell spans the row on phones, so no grey hole shows.
        '[&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1',
        className,
      ].join(' ')}
    >
      <InStrip.Provider value={true}>{children}</InStrip.Provider>
    </div>
  );
}

/** Compact summary figure; a standalone card, or a cell inside MetricStrip. */
export function MetricCard({ label, value, sub }: MetricCardProps) {
  const inStrip = useContext(InStrip);
  return (
    <div className={inStrip ? 'bg-surface px-4 py-3' : 'rounded-card border border-line bg-surface px-3.5 py-3'}>
      <div className="text-[12px] font-medium text-muted">{label}</div>
      <div className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-[12px] text-faint">{sub}</div>}
    </div>
  );
}
