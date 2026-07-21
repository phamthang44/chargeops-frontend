export interface FilterTab<K extends string = string> {
  key: K;
  label: string;
  count?: number;
}

export interface FilterTabsProps<K extends string> {
  tabs: FilterTab<K>[];
  active: K;
  onChange: (key: K) => void;
  /** Active pill colour theme. */
  accent?: 'brand' | 'owner';
}

/** Row of pill filters with optional counts (booking status, tx type, users…). */
export function FilterTabs<K extends string>({
  tabs,
  active,
  onChange,
  accent = 'owner',
}: FilterTabsProps<K>) {
  const activeCls =
    accent === 'owner'
      ? 'border-owner bg-owner-soft text-owner-deep'
      : 'border-brand bg-brand-soft text-brand';
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex items-center gap-[7px] rounded-ctl border px-3 py-[7px] text-[12.5px] font-semibold ${
              on ? activeCls : 'border-line bg-surface text-body hover:bg-canvas'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="font-mono text-[10.5px] opacity-70">{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
