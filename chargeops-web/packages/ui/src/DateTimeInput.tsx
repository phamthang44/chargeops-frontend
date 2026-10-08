import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconCalendar,
  IconClock,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
} from './icons';

export interface DateTimeInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string | null;
  accent?: 'brand' | 'warn' | 'owner';
  showQuickPresets?: boolean;
  /** Show the "Vui lòng chọn ngày và giờ" helper line while the field is empty. */
  showEmptyHint?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
}

const QUICK_PRESETS = [
  { offset: 0, label: 'Bây giờ' },
  { offset: 15, label: '-15 phút' },
  { offset: 60, label: '-1 giờ' },
];

/** Shared spring curve for every interactive transition in this component. */
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

const MONTH_NAMES = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Formats a Date object to local YYYY-MM-DDTHH:mm string. */
function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

/** Parses a date string into components, or returns null if invalid. */
function parseDateTime(val: string) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
    dateObj: d,
  };
}

/** Formats local datetime string into pleasant Vietnamese readable text. */
function formatHumanVn(val: string): string {
  if (!val) return 'Chưa chọn thời gian';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[d.getDay()];
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    return `${dayName}, ${day}/${month}/${year} lúc ${hours}:${mins}`;
  } catch {
    return val;
  }
}

/** Formats trigger input text: e.g. 26/09/2026 lúc 14:18 */
function formatTriggerDisplay(val: string): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    return `${day}/${month}/${year} lúc ${hours}:${mins}`;
  } catch {
    return val;
  }
}

/**
 * Premium Custom DateTimePicker Popover built to Astryx / ChargeOps design system standards.
 * Completely replaces browser-native datetime pickers with a responsive calendar grid,
 * 24h time stepper, quick preset pills, and full Light/Dark mode token consistency.
 */
export function DateTimeInput({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  hint,
  error,
  accent = 'brand',
  showQuickPresets = true,
  showEmptyHint = true,
  className = '',
  id,
  placeholder = 'Chọn ngày và giờ...',
}: DateTimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsed initial state
  const parsed = useMemo(() => parseDateTime(value), [value]);

  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState<number>(() => parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => parsed?.month ?? now.getMonth());
  const [hours, setHours] = useState<number>(() => parsed?.hours ?? now.getHours());
  const [minutes, setMinutes] = useState<number>(() => parsed?.minutes ?? now.getMinutes());

  // Synchronize internal stepper state when prop value changes
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
      setHours(parsed.hours);
      setMinutes(parsed.minutes);
    }
  }, [value, parsed]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build 42-cell calendar grid (6 rows of 7 days, Mon - Sun)
  const calendarCells = useMemo(() => {
    const cells: Array<{
      year: number;
      month: number;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    const firstDay = new Date(viewYear, viewMonth, 1);
    // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    // Previous month tail days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const isToday = y === todayY && m === todayM && d === todayD;
      const isSelected = parsed ? y === parsed.year && m === parsed.month && d === parsed.day : false;
      cells.push({ year: y, month: m, day: d, isCurrentMonth: false, isToday, isSelected });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const isToday = viewYear === todayY && viewMonth === todayM && d === todayD;
      const isSelected = parsed ? viewYear === parsed.year && viewMonth === parsed.month && d === parsed.day : false;
      cells.push({ year: viewYear, month: viewMonth, day: d, isCurrentMonth: true, isToday, isSelected });
    }

    // Next month head days
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const isToday = y === todayY && m === todayM && d === todayD;
      const isSelected = parsed ? y === parsed.year && m === parsed.month && d === parsed.day : false;
      cells.push({ year: y, month: m, day: d, isCurrentMonth: false, isToday, isSelected });
    }

    return cells;
  }, [viewYear, viewMonth, now, parsed]);

  // Select a day
  const handleSelectDay = (cell: { year: number; month: number; day: number }) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const newY = cell.year;
    const newM = pad(cell.month + 1);
    const newD = pad(cell.day);
    const newH = pad(hours);
    const newMin = pad(minutes);

    onChange(`${newY}-${newM}-${newD}T${newH}:${newMin}`);
    if (cell.month !== viewMonth) {
      setViewMonth(cell.month);
      setViewYear(cell.year);
    }
  };

  // Adjust time hours & minutes
  const updateTime = (newH: number, newMin: number) => {
    const clampedH = (newH + 24) % 24;
    const clampedMin = (newMin + 60) % 60;
    setHours(clampedH);
    setMinutes(clampedMin);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const targetDate = parsed ? new Date(parsed.year, parsed.month, parsed.day) : new Date();
    const y = targetDate.getFullYear();
    const m = pad(targetDate.getMonth() + 1);
    const d = pad(targetDate.getDate());
    const h = pad(clampedH);
    const min = pad(clampedMin);

    onChange(`${y}-${m}-${d}T${h}:${min}`);
  };

  // Quick preset helper
  const setPreset = (offsetMinutes: number) => {
    const target = new Date(Date.now() - offsetMinutes * 60 * 1000);
    onChange(toLocalDatetimeString(target));
  };

  // Theme accent styles
  const accentClasses = useMemo(() => {
    switch (accent) {
      case 'warn':
        return {
          activeBorder: 'border-amber-500/80',
          ring: 'focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20',
          openRing: 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs',
          pillSelected: 'bg-amber-500 text-white font-bold shadow-xs',
          todayRing: 'ring-1 ring-inset ring-amber-500/60 dark:ring-amber-400/60 font-bold text-amber-700 dark:text-amber-300',
          badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25',
          chipHover: 'hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300',
        };
      case 'owner':
        return {
          activeBorder: 'border-owner',
          ring: 'focus-within:border-owner focus-within:ring-2 focus-within:ring-owner/20',
          openRing: 'border-owner ring-2 ring-owner/20 shadow-xs',
          pillSelected: 'bg-owner text-white font-bold shadow-xs',
          todayRing: 'ring-1 ring-inset ring-owner/60 font-bold text-owner-deep',
          badge: 'bg-owner-soft text-owner-deep border border-owner-border',
          chipHover: 'hover:border-owner/40 hover:bg-owner-soft hover:text-owner-deep',
        };
      case 'brand':
      default:
        return {
          activeBorder: 'border-brand',
          ring: 'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
          openRing: 'border-brand ring-2 ring-brand/20 shadow-xs',
          pillSelected: 'bg-brand text-white font-bold shadow-xs',
          todayRing: 'ring-1 ring-inset ring-brand/60 font-bold text-brand',
          badge: 'bg-brand-soft text-brand-strong border border-brand/20',
          chipHover: 'hover:border-brand/40 hover:bg-brand-soft hover:text-brand',
        };
    }
  }, [accent]);

  const triggerFormatted = useMemo(() => formatTriggerDisplay(value), [value]);
  const previewVn = useMemo(() => formatHumanVn(value), [value]);

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {/* Label — own row so it never wraps around the quick presets */}
      {label && (
        <label htmlFor={id} className="block text-[12px] font-semibold text-body">
          {label} {required && <span className="text-bad font-bold">*</span>}
        </label>
      )}

      {/* Custom Trigger Input */}
      <div
        id={id}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`group flex items-center justify-between gap-2 rounded-xl border bg-surface px-3 py-[9px] text-left cursor-pointer shadow-2xs select-none transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.995] ${
          error
            ? 'border-bad ring-1 ring-bad/20'
            : isOpen
              ? accentClasses.openRing
              : 'border-line-2 hover:border-line'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-surface-2' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <IconCalendar
            size={16}
            className={`shrink-0 transition-colors ${
              isOpen ? 'text-ink' : 'text-faint group-hover:text-muted'
            }`}
          />
          {triggerFormatted ? (
            <span className="font-mono text-[13px] font-medium text-ink truncate">
              {triggerFormatted}
            </span>
          ) : (
            <span className="text-[13px] text-faint truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              title="Xóa lựa chọn"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="rounded-md p-1 text-faint hover:text-bad hover:bg-bad/10 transition-colors cursor-pointer"
            >
              <IconX size={13} strokeWidth={2.4} />
            </button>
          )}
          <IconChevronDown
            size={14}
            strokeWidth={2.2}
            className={`text-faint transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isOpen ? 'rotate-180 text-ink' : 'group-hover:text-muted'
            }`}
          />
        </div>
      </div>

      {/* Quick presets — own row below the trigger so the label never gets crushed */}
      {label && showQuickPresets && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-faint">
            Chọn nhanh
          </span>
          {QUICK_PRESETS.map((preset, i) => (
            <span
              key={preset.offset}
              className="inline-block"
              style={{
                animation: `riseIn .45s ${EASE} both`,
                animationDelay: `${90 + i * 50}ms`,
              }}
            >
              <button
                type="button"
                onClick={() => setPreset(preset.offset)}
                className={`cursor-pointer rounded-full border border-line-2 bg-surface-2 px-2.5 py-[3px] text-[10.5px] font-semibold text-muted transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px active:scale-95 ${accentClasses.chipHover}`}
              >
                {preset.label}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Astryx / ChargeOps Custom DateTime Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Bộ chọn ngày giờ"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-max min-w-[300px] max-w-[calc(100vw-1.5rem)] origin-top-left rounded-2xl border border-line-2 bg-surface p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_22px_55px_rgba(0,0,0,0.7)] backdrop-blur-md ring-1 ring-black/5"
          style={{ animation: 'popIn .12s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Popover Header: Month & Year Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <button
              type="button"
              onClick={prevMonth}
              title="Tháng trước"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line-2 bg-surface hover:bg-chip hover:text-ink text-muted transition-colors cursor-pointer active:scale-95"
            >
              <IconChevronLeft size={14} strokeWidth={2.4} />
            </button>

            <div className="text-[13px] font-bold text-ink tracking-tight">
              {MONTH_NAMES[viewMonth]}, {viewYear}
            </div>

            <button
              type="button"
              onClick={nextMonth}
              title="Tháng sau"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line-2 bg-surface hover:bg-chip hover:text-ink text-muted transition-colors cursor-pointer active:scale-95"
            >
              <IconChevronRight size={14} strokeWidth={2.4} />
            </button>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 pt-2.5 pb-1 text-center font-mono text-[10.5px] font-bold uppercase tracking-wider text-faint">
            {WEEKDAYS.map((wd) => (
              <span key={wd}>{wd}</span>
            ))}
          </div>

          {/* Days Grid (42 cells) */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((cell, idx) => {
              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                  type="button"
                  onClick={() => handleSelectDay(cell)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg font-mono text-[12px] transition-all cursor-pointer ${
                    cell.isSelected
                      ? accentClasses.pillSelected
                      : cell.isToday
                        ? accentClasses.todayRing
                        : cell.isCurrentMonth
                          ? 'text-ink hover:bg-chip font-medium'
                          : 'text-faint/40 hover:bg-chip/50 font-normal'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-hairline" />

          {/* 24-Hour Time Stepper Section */}
          <div className="space-y-2 rounded-xl border border-line-2 bg-surface-2/60 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted">
              <span className="flex items-center gap-1.5 text-ink">
                <IconClock size={12} className="text-faint" />
                <span>Giờ thực hiện (24h)</span>
              </span>
              <span className="font-mono text-[12px] font-semibold text-ink">
                {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* Hours Stepper */}
              <div className="flex flex-1 items-center justify-between rounded-lg border border-line bg-surface px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => updateTime(hours - 1, minutes)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-chip hover:text-ink active:scale-95 cursor-pointer text-[13px] font-bold"
                >
                  -
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[13px] font-bold text-ink">
                    {hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-medium text-faint uppercase">Giờ</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateTime(hours + 1, minutes)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-chip hover:text-ink active:scale-95 cursor-pointer text-[13px] font-bold"
                >
                  +
                </button>
              </div>

              <span className="font-mono text-[14px] font-bold text-faint">:</span>

              {/* Minutes Stepper */}
              <div className="flex flex-1 items-center justify-between rounded-lg border border-line bg-surface px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => updateTime(hours, minutes - 5)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-chip hover:text-ink active:scale-95 cursor-pointer text-[13px] font-bold"
                >
                  -
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[13px] font-bold text-ink">
                    {minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-medium text-faint uppercase">Phút</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateTime(hours, minutes + 5)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-chip hover:text-ink active:scale-95 cursor-pointer text-[13px] font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick minute interval pills */}
            <div className="flex items-center justify-between gap-1 pt-0.5">
              {[0, 15, 30, 45].map((m) => {
                const isActive = minutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateTime(hours, m)}
                    className={`flex-1 rounded-md py-1 text-center font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                      isActive
                        ? accentClasses.pillSelected
                        : 'border border-line bg-surface text-muted hover:bg-chip hover:text-ink'
                    }`}
                  >
                    :{m.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-hairline">
            <button
              type="button"
              onClick={() => {
                setPreset(0);
                setIsOpen(false);
              }}
              className="rounded-lg border border-line-2 bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted hover:border-line hover:text-ink hover:bg-surface transition-colors cursor-pointer"
            >
              Chọn bây giờ
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1 text-[11.5px] font-bold transition-all cursor-pointer active:scale-95 ${accentClasses.pillSelected}`}
            >
              <IconCheck size={12} strokeWidth={2.4} />
              <span>Xác nhận</span>
            </button>
          </div>
        </div>
      )}

      {/* Human-friendly preview & hints */}
      {(value || showEmptyHint || hint || error) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {value ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
              <IconClock size={11} className="text-amber-500 shrink-0" />
              <span>{previewVn}</span>
            </div>
          ) : (
            showEmptyHint && <span className="text-[11px] text-faint">Vui lòng chọn ngày và giờ</span>
          )}

          {hint && <span className="text-[11px] text-faint">{hint}</span>}
          {error && <span className="text-[11px] font-medium text-bad">{error}</span>}
        </div>
      )}
    </div>
  );
}
