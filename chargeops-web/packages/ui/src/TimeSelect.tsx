import { useEffect, useMemo, useRef, useState } from 'react';
import { IconCheck, IconClock, IconChevronDown } from './icons';

export interface TimeSelectProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  stepMinutes?: number;
  accent?: 'brand' | 'owner';
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

/** Generate time options in 24h format (HH:mm) */
function generateTimeOptions(step: number = 30): string[] {
  const options: string[] = [];
  const validStep = step > 0 && step <= 120 ? step : 30;
  const totalMinutes = 24 * 60;
  for (let m = 0; m < totalMinutes; m += validStep) {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    const hh = hours.toString().padStart(2, '0');
    const mm = mins.toString().padStart(2, '0');
    options.push(`${hh}:${mm}`);
  }
  options.push('24:00');
  return options;
}

/**
 * Premium TimeSelect dropdown component matching ChargeOps design system.
 * Allows quick selection of time slots and smooth keyboard filtering.
 */
export function TimeSelect({
  value = '',
  onChange,
  disabled = false,
  stepMinutes = 30,
  accent = 'owner',
  placeholder = 'Chọn giờ',
  className = '',
  'aria-label': ariaLabel,
}: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement | null>(null);

  const timeOptions = useMemo(() => generateTimeOptions(stepMinutes), [stepMinutes]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!open) {
      setTypedInput('');
      return;
    }

    // Auto-focus search input if opened
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 40);

    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Auto-scroll to selected item when opened
  useEffect(() => {
    if (open && selectedItemRef.current && listRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!typedInput.trim()) return timeOptions;
    return timeOptions.filter((t) => t.includes(typedInput.trim()));
  }, [timeOptions, typedInput]);

  const ring =
    accent === 'owner'
      ? 'focus-within:border-owner focus-within:ring-2 focus-within:ring-owner/15'
      : 'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15';

  const selectedRowClass =
    accent === 'owner'
      ? 'bg-owner-soft text-owner-deep font-bold'
      : 'bg-brand-soft text-brand font-bold';

  return (
    <div ref={ref} className={`relative inline-block w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex h-[36px] w-full items-center justify-between gap-1.5 rounded-[9px] border px-2.5 text-center font-mono text-[12.5px] font-medium transition cursor-pointer ${
          disabled
            ? 'border-line-2 bg-chip text-faint cursor-not-allowed opacity-70'
            : open
              ? 'border-line-hover bg-surface text-ink shadow-xs ring-2 ring-owner/15'
              : 'border-line bg-surface text-ink hover:border-line-hover hover:bg-surface-2'
        } ${ring}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <IconClock
            size={13}
            className={`shrink-0 ${disabled ? 'text-faint' : 'text-faint'}`}
          />
          <span className={`truncate ${!value ? 'text-faint font-sans' : 'text-ink font-semibold'}`}>
            {value || placeholder}
          </span>
        </div>
        <IconChevronDown
          size={12}
          strokeWidth={2.4}
          className={`shrink-0 text-faint transition-transform duration-150 ${open ? 'rotate-180 text-ink' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full min-w-[130px] overflow-hidden rounded-[11px] border border-line-2 bg-surface shadow-[0_10px_30px_rgba(16,17,26,.14)]"
          style={{ animation: 'popIn .12s ease' }}
        >
          {/* Quick search input inside dropdown */}
          <div className="border-b border-hairline p-1.5 bg-surface-2">
            <input
              ref={searchInputRef}
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value.replace(/[^0-9:]/g, ''))}
              placeholder="Gõ giờ (VD: 08:30)..."
              className="w-full rounded-[6px] border border-line bg-surface px-2 py-1 font-mono text-[11.5px] text-ink outline-none focus:border-owner"
            />
          </div>

          <div ref={listRef} className="max-h-44 overflow-y-auto py-1 scroll-smooth">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-center text-[11.5px] text-faint">
                Không tìm thấy
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt === value;
                return (
                  <button
                    key={opt}
                    ref={(el) => {
                      if (isSelected) {
                        selectedItemRef.current = el;
                      }
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left font-mono text-[12px] transition hover:bg-chip cursor-pointer ${
                      isSelected ? selectedRowClass : 'text-body'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <IconCheck size={13} strokeWidth={2.4} className="shrink-0 text-owner-deep" />}
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
