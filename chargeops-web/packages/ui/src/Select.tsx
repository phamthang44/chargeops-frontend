import { useEffect, useMemo, useRef, useState } from 'react';
import { IconCheck, IconChevronDown, IconSearch, IconX } from './icons';

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
  searchable?: boolean;
  searchPlaceholder?: string;
  'aria-label'?: string;
}

function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Custom listbox with optional search filter — trigger + floating panel, not a native <select>.
 * Diacritic-insensitive search for Vietnamese names, styled with design system tokens.
 */
export function Select({
  value,
  onChange,
  options,
  accent = 'brand',
  className = '',
  disabled,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  ...rest
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    if (searchable) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
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
  }, [open, searchable]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = normalizeSearch(query.trim());
    return options.filter((o) => normalizeSearch(o.label).includes(q));
  }, [options, query, searchable]);

  const ring = accent === 'owner' ? 'focus:border-owner focus:ring-owner/15' : 'focus:border-brand focus:ring-brand/15';
  const selectedRowClass = accent === 'owner' ? 'bg-owner-soft text-owner-deep font-semibold' : 'bg-brand-soft text-brand font-semibold';

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
          className="absolute left-0 top-full z-45 mt-1.5 max-h-72 w-full min-w-full overflow-hidden rounded-[11px] border border-line-2 bg-surface shadow-[0_10px_30px_rgba(16,17,26,.12)]"
          style={{ animation: 'popIn .12s ease' }}
        >
          {searchable && (
            <div className="border-b border-line-2 p-2">
              <div className="flex items-center gap-1.5 rounded-[7px] border border-line bg-canvas px-2.5 py-1.5 text-[12px]">
                <IconSearch size={13} strokeWidth={2.2} className="shrink-0 text-faint" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full border-none bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="flex h-4 w-4 items-center justify-center rounded text-faint hover:text-ink"
                  >
                    <IconX size={11} strokeWidth={2.4} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-3 text-center text-[12px] text-faint">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((o) => {
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
                    className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-[13px] font-medium transition ${
                      on ? selectedRowClass : 'text-body hover:bg-chip'
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {on && <IconCheck size={14} strokeWidth={2.4} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
