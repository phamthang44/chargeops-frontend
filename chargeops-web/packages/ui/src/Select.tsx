import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconChevronDown } from './icons';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Focus-ring / selected-row colour family. */
  accent?: 'brand' | 'owner';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * Custom listbox — trigger + floating panel, not a native <select>. A native
 * select's open dropdown is OS-rendered and can't be themed (it stays a white
 * popup even in dark mode); this one is plain DOM so it inherits the app's
 * tokens like everything else.
 */
export function Select({ value, onChange, options, accent = 'brand', className = '', disabled, ...rest }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const ring = accent === 'owner' ? 'focus:border-owner focus:ring-owner/15' : 'focus:border-brand focus:ring-brand/15';
  const selectedRowClass = accent === 'owner' ? 'bg-owner-soft text-owner-deep' : 'bg-brand-soft text-brand';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        {...rest}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-[10px] border border-line bg-surface py-[9px] pl-3 pr-2.5 text-left text-[13px] font-medium text-ink transition hover:border-line-hover focus:ring-2 disabled:cursor-not-allowed disabled:opacity-55 ${ring}`}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <IconChevronDown
          size={14}
          strokeWidth={2.2}
          className={`shrink-0 text-faint transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-45 mt-1.5 max-h-64 w-full min-w-max overflow-y-auto rounded-[11px] border border-line-2 bg-surface py-1.5 shadow-[0_10px_30px_rgba(16,17,26,.12)]"
          style={{ animation: 'popIn .12s ease' }}
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-[13px] font-medium ${
                  on ? selectedRowClass : 'text-body hover:bg-chip'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {on && <IconCheck size={14} strokeWidth={2.4} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
