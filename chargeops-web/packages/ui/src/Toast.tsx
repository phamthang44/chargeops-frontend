import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconAlertCircle, IconAlertTriangle, IconCheckCircle, IconInfo, IconX } from './icons';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'primary' | 'danger';
}

export interface ToastOptions {
  title?: string;
  message: string;
  tone?: ToastTone;
  code?: string;
  durationMs?: number;
  action?: ToastAction;
}

export interface ToastItem {
  id: number;
  title?: string;
  message: string;
  tone: ToastTone;
  code?: string;
  durationMs: number;
  action?: ToastAction;
}

export interface ToastFn {
  (message: string, tone?: ToastTone, durationMs?: number): void;
  (options: ToastOptions): void;
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'tone'> | string) => void;
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'tone'> | string) => void;
  warning: (message: string, options?: Omit<ToastOptions, 'message' | 'tone'> | string) => void;
  info: (message: string, options?: Omit<ToastOptions, 'message' | 'tone'> | string) => void;
  dismiss: (id: number) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastFn | null>(null);

/**
 * useToast() hook providing rich, desktop-enhanced notification dispatchers.
 * - Call directly: `toast('Thành công', 'success')` or `toast({ title: 'Lỗi', message: 'Chi tiết', tone: 'error' })`
 * - Or use helper methods: `toast.success(...)`, `toast.error(...)`, `toast.warning(...)`, `toast.info(...)`
 */
export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    const noop: any = () => {};
    noop.success = () => {};
    noop.error = () => {};
    noop.warning = () => {};
    noop.info = () => {};
    noop.dismiss = () => {};
    noop.dismissAll = () => {};
    return noop as ToastFn;
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((input: string | ToastOptions, toneArg: ToastTone = 'success', durationMsArg?: number) => {
    const id = Date.now() + Math.random();
    let item: ToastItem;

    if (typeof input === 'string') {
      const defaultDuration = toneArg === 'error' ? 7000 : 5000;
      item = {
        id,
        message: input,
        tone: toneArg,
        durationMs: durationMsArg ?? defaultDuration,
      };
    } else {
      const tone = input.tone ?? 'info';
      const defaultDuration = tone === 'error' ? 7000 : 5000;
      item = {
        id,
        title: input.title,
        message: input.message,
        tone,
        code: input.code,
        action: input.action,
        durationMs: input.durationMs ?? defaultDuration,
      };
    }

    setItems((prev) => [...prev, item]);
  }, []);

  const toastFn = useMemo<ToastFn>(() => {
    const fn: any = (input: string | ToastOptions, tone?: ToastTone, duration?: number) => {
      push(input, tone, duration);
    };
    fn.success = (msg: string, opts?: any) => {
      const title = typeof opts === 'string' ? opts : opts?.title;
      push({ message: msg, title, tone: 'success', ...(typeof opts === 'object' ? opts : {}) });
    };
    fn.error = (msg: string, opts?: any) => {
      const title = typeof opts === 'string' ? opts : opts?.title;
      push({ message: msg, title, tone: 'error', ...(typeof opts === 'object' ? opts : {}) });
    };
    fn.warning = (msg: string, opts?: any) => {
      const title = typeof opts === 'string' ? opts : opts?.title;
      push({ message: msg, title, tone: 'warning', ...(typeof opts === 'object' ? opts : {}) });
    };
    fn.info = (msg: string, opts?: any) => {
      const title = typeof opts === 'string' ? opts : opts?.title;
      push({ message: msg, title, tone: 'info', ...(typeof opts === 'object' ? opts : {}) });
    };
    fn.dismiss = dismiss;
    fn.dismissAll = () => setItems([]);
    return fn;
  }, [push, dismiss]);

  return (
    <ToastContext.Provider value={toastFn}>
      {children}
      {/* Toast viewport anchored at top-right with comfortable margins & desktop expansion */}
      <aside
        className="fixed top-5 right-5 sm:top-6 sm:right-6 z-60 flex flex-col items-end gap-3 pointer-events-none w-full max-w-[calc(100vw-2.5rem)] sm:w-auto"
        aria-live="polite"
        aria-label="Thông báo hệ thống"
      >
        <style>{`
          @keyframes toastSlideInRight {
            from {
              opacity: 0;
              transform: translateX(100%) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
          @keyframes toastProgressBar {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

const DEFAULT_TITLES: Record<ToastTone, string> = {
  error: 'Thông báo lỗi',
  warning: 'Cảnh báo',
  success: 'Thành công',
  info: 'Thông tin',
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(item.durationMs);
  const startRef = useRef(Date.now());

  const startTimer = () => {
    setIsPaused(false);
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, remainingRef.current);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startRef.current));
      setIsPaused(true);
    }
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const toneConfig = {
    error: {
      icon: <IconAlertCircle size={20} strokeWidth={2.2} className="text-bad" />,
      iconWrap: 'bg-bad/12 text-bad ring-1 ring-bad/25 shadow-[0_2px_8px_rgba(220,38,38,0.15)]',
      shellRing: 'ring-1 ring-red-500/25 bg-red-500/[0.04] shadow-[0_16px_36px_rgba(220,38,38,0.18)] dark:shadow-[0_16px_36px_rgba(220,38,38,0.28)]',
      progressBg: 'bg-bad',
      titleColor: 'text-bad-deep dark:text-red-300',
    },
    warning: {
      icon: <IconAlertTriangle size={20} strokeWidth={2.2} className="text-amber-500" />,
      iconWrap: 'bg-amber-500/12 text-amber-500 ring-1 ring-amber-500/25 shadow-[0_2px_8px_rgba(245,158,11,0.15)]',
      shellRing: 'ring-1 ring-amber-500/25 bg-amber-500/[0.04] shadow-[0_16px_36px_rgba(245,158,11,0.16)] dark:shadow-[0_16px_36px_rgba(245,158,11,0.24)]',
      progressBg: 'bg-amber-500',
      titleColor: 'text-amber-900 dark:text-amber-300',
    },
    success: {
      icon: <IconCheckCircle size={20} strokeWidth={2.2} className="text-good" />,
      iconWrap: 'bg-good/12 text-good ring-1 ring-good/25 shadow-[0_2px_8px_rgba(16,185,129,0.15)]',
      shellRing: 'ring-1 ring-emerald-500/25 bg-emerald-500/[0.04] shadow-[0_16px_36px_rgba(16,185,129,0.16)] dark:shadow-[0_16px_36px_rgba(16,185,129,0.24)]',
      progressBg: 'bg-good',
      titleColor: 'text-good-deep dark:text-emerald-300',
    },
    info: {
      icon: <IconInfo size={20} strokeWidth={2.2} className="text-brand" />,
      iconWrap: 'bg-brand/12 text-brand ring-1 ring-brand/25 shadow-[0_2px_8px_rgba(91,84,232,0.15)]',
      shellRing: 'ring-1 ring-blue-500/25 bg-blue-500/[0.04] shadow-[0_16px_36px_rgba(59,130,246,0.16)] dark:shadow-[0_16px_36px_rgba(59,130,246,0.24)]',
      progressBg: 'bg-brand',
      titleColor: 'text-brand-strong dark:text-blue-300',
    },
  }[item.tone];

  const titleText = item.title || DEFAULT_TITLES[item.tone];

  return (
    <div
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      className={`pointer-events-auto w-full sm:w-[420px] md:w-[460px] lg:w-[480px] p-1 rounded-[1.25rem] transition-all duration-300 ${toneConfig.shellRing}`}
      style={{ animation: 'toastSlideInRight .28s cubic-bezier(0.16, 1, 0.3, 1)' }}
      role="alert"
    >
      <div className="relative overflow-hidden rounded-[calc(1.25rem-0.25rem)] border border-surface-border bg-surface/95 dark:bg-surface/90 backdrop-blur-xl p-4 sm:p-4.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
        <div className="flex items-start gap-3.5">
          {/* Tone Icon Badge */}
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneConfig.iconWrap}`}>
            {toneConfig.icon}
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <span className={`text-[13.5px] font-bold tracking-tight ${toneConfig.titleColor}`}>
                {titleText}
              </span>

              {item.code && (
                <span className="font-mono text-[10.5px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-chip text-muted border border-hairline">
                  {item.code}
                </span>
              )}
            </div>

            <p className="mt-1 text-[13px] leading-relaxed text-body dark:text-muted break-words font-normal">
              {item.message}
            </p>

            {/* Optional Interactive Action */}
            {item.action && (
              <div className="mt-2.5 flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    item.action?.onClick();
                    onDismiss();
                  }}
                  className="cursor-pointer text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-ink transition-colors border border-hairline shadow-xs active:scale-[0.98]"
                >
                  {item.action.label}
                </button>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink transition-colors"
            aria-label="Đóng thông báo"
          >
            <IconX size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Micro Countdown Progress Indicator */}
        <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-surface-2/70 overflow-hidden">
          <div
            className={`h-full ${toneConfig.progressBg} transition-opacity duration-200`}
            style={{
              animation: `toastProgressBar ${item.durationMs}ms linear forwards`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          />
        </div>
      </div>
    </div>
  );
}
