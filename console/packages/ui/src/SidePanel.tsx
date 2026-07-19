export interface SidePanelRow {
  label: string;
  value: string;
  /** Dot colour class before the label, e.g. "bg-good". */
  dotClass?: string;
  /** Value colour class, defaults to ink. */
  valueClass?: string;
}

export interface SidePanelProps {
  title: string;
  link?: string;
  onLink?: () => void;
  bigNum?: string;
  bigClass?: string;
  rows: SidePanelRow[];
  /** Card tint, e.g. warn panel. Defaults to white. */
  tone?: 'white' | 'warn';
}

/** Small stacked panel next to the dashboard chart (design: dashSidePanels). */
export function SidePanel({
  title,
  link,
  onLink,
  bigNum,
  bigClass = 'text-ink',
  rows,
  tone = 'white',
}: SidePanelProps) {
  const toneClass =
    tone === 'warn' ? 'border-warn-border bg-warn-soft' : 'border-line-2 bg-white';
  return (
    <div className={`rounded-card border p-[15px] ${toneClass}`}>
      <div className="mb-[11px] flex items-center justify-between">
        <div className={`text-[13px] font-semibold ${tone === 'warn' ? 'text-warn-deep' : ''}`}>
          {title}
        </div>
        {link && (
          <span onClick={onLink} className="cursor-pointer text-[11.5px] font-semibold text-brand">
            {link}
          </span>
        )}
      </div>
      {bigNum && (
        <div className={`text-[30px] font-bold tracking-[-0.02em] ${bigClass}`}>{bigNum}</div>
      )}
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={`flex items-center justify-between py-1.5 text-[12.5px] font-medium ${
            i === 0 && !bigNum ? '' : 'border-t border-hairline'
          }`}
        >
          <span className="flex items-center gap-[7px] text-body">
            {r.dotClass && <span className={`h-[7px] w-[7px] rounded-[2px] ${r.dotClass}`} />}
            {r.label}
          </span>
          <span className={`font-semibold ${r.valueClass ?? ''}`}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
