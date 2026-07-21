import type { ReactNode } from 'react';

export interface Segment<K extends string> {
  key: K;
  label: string;
  /** Optional leading icon shown inside the button. */
  icon?: ReactNode;
  /** Optional description shown below the label (only in 'card' variant). */
  desc?: string;
}

export interface SegmentedControlProps<K extends string> {
  segments: Segment<K>[];
  active: K;
  onChange: (key: K) => void;
  /** 'pill' = compact joined pill bar (default). 'card' = large tappable cards in a row. */
  variant?: 'pill' | 'card';
  /** Active colour: 'brand' (indigo) or 'owner' (emerald). Defaults to 'brand'. */
  accent?: 'brand' | 'owner';
}

/** Joined button group with one active segment — pill bar (default) or large card tiles. */
export function SegmentedControl<K extends string>({
  segments,
  active,
  onChange,
  variant = 'pill',
  accent = 'brand',
}: SegmentedControlProps<K>) {
  if (variant === 'card') {
    return (
      <div className="flex gap-2.5">
        {segments.map((s) => {
          const on = s.key === active;
          const accentBg   = accent === 'owner' ? 'bg-owner-soft border-owner-border' : 'bg-brand-soft border-brand-line';
          const accentText = accent === 'owner' ? 'text-owner-deep' : 'text-brand';
          const accentRing = accent === 'owner' ? 'ring-owner/20' : 'ring-brand/20';
          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              className={[
                'flex flex-1 flex-col items-center gap-[9px] rounded-[11px] border-[1.5px] px-4 py-[14px] text-center transition-all duration-150 select-none',
                on
                  ? `${accentBg} ring-2 ${accentRing} shadow-sm`
                  : 'border-line bg-surface hover:border-line-hover hover:bg-canvas',
              ].join(' ')}
            >
              {s.icon && (
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors duration-150 ${
                    on ? `${accent === 'owner' ? 'bg-owner/20' : 'bg-brand/15'} ${accentText}` : 'bg-chip text-faint'
                  }`}
                >
                  {s.icon}
                </span>
              )}
              <span className="flex flex-col items-center gap-0.5">
                <span className={`text-[13px] font-semibold leading-none ${on ? accentText : 'text-ink'}`}>
                  {s.label}
                </span>
                {s.desc && (
                  <span className="text-[11px] text-faint leading-snug">{s.desc}</span>
                )}
              </span>
              {/* Active check indicator */}
              <span
                className={`h-[6px] w-[6px] rounded-full transition-all duration-150 ${on ? (accent === 'owner' ? 'bg-owner' : 'bg-brand') : 'bg-transparent'}`}
              />
            </button>
          );
        })}
      </div>
    );
  }

  // Default: pill bar
  return (
    <div className="flex overflow-hidden rounded-ctl border border-line">
      {segments.map((s, i) => {
        const on = s.key === active;
        const accentActive = accent === 'owner' ? 'bg-owner-soft text-owner-deep' : 'bg-brand-soft text-brand';
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={[
              'inline-flex items-center gap-[6px] px-[13px] py-2 text-[12px] font-semibold transition-colors duration-100',
              i > 0 ? 'border-l border-line-3' : '',
              on ? accentActive : 'bg-surface text-body hover:bg-canvas',
            ].join(' ')}
          >
            {s.icon && <span className="shrink-0 opacity-80">{s.icon}</span>}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
