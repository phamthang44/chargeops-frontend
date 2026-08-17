import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { IconAlertCircle, IconCheckCircle, IconInfo, IconX } from './icons';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  durationMs: number;
}

const ToastContext = createContext<(message: string, tone?: ToastTone, durationMs?: number) => void>(() => {});

/** useToast()('Đã lưu', 'success', 5000) — auto-dismisses after 5s (7s for errors), pause on hover. */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, tone: ToastTone = 'success', durationMs?: number) => {
    const id = Date.now() + Math.random();
    const defaultDuration = tone === 'error' ? 7000 : 5000;
    const finalDuration = durationMs ?? defaultDuration;

    setItems((prev) => [...prev, { id, message, tone, durationMs: finalDuration }]);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-[24px] left-1/2 z-60 flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(item.durationMs);
  const startRef = useRef(Date.now());

  const startTimer = () => {
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, remainingRef.current);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      remainingRef.current -= Date.now() - startRef.current;
    }
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const iconConfig = {
    success: <IconCheckCircle size={18} className="text-good shrink-0" />,
    error: <IconAlertCircle size={18} className="text-bad shrink-0" />,
    info: <IconInfo size={18} className="text-brand shrink-0" />,
  }[item.tone];

  const borderConfig = {
    success: 'border-good-border/60 bg-surface shadow-[0_8px_30px_rgba(13,138,90,.12)]',
    error: 'border-bad-border/60 bg-surface shadow-[0_8px_30px_rgba(192,57,43,.15)]',
    info: 'border-brand-border/60 bg-surface shadow-[0_8px_30px_rgba(91,84,232,.12)]',
  }[item.tone];

  return (
    <div
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      className={`pointer-events-auto flex max-w-[92vw] sm:max-w-[460px] items-center gap-2.5 rounded-[12px] border px-4 py-3 text-ink backdrop-blur-md transition-all ${borderConfig}`}
      style={{ animation: 'popIn .2s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {iconConfig}
      <span className="text-[13px] font-medium leading-snug flex-1 pr-1">{item.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink transition-colors"
        aria-label="Đóng thông báo"
      >
        <IconX size={14} />
      </button>
    </div>
  );
}

