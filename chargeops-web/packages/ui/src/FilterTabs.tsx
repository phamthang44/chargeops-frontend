export interface FilterTab<K extends string = string> {
  key: K;
  label: string;
  count?: number;
}

export interface FilterTabsProps<K extends string> {
  tabs: FilterTab<K>[];
  active: K;
  onChange: (key: K) => void;
  /** Kept for API compatibility; the active tab is neutral in every console. */
  accent?: 'brand' | 'owner';
}

/** Quiet filter tabs with optional counts (booking status, tx type, users…). */
export function FilterTabs<K extends string>({ tabs, active, onChange }: FilterTabsProps<K>) {
  return (
    <div role="tablist" className="flex flex-wrap items-center gap-1">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={`flex items-center gap-1.5 rounded-ctl px-2.5 py-1.5 text-[13px] transition-colors ${
              on ? 'bg-chip font-semibold text-ink' : 'font-medium text-muted hover:bg-canvas hover:text-ink'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`text-[12px] tabular-nums ${on ? 'text-muted' : 'text-faint'}`}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
