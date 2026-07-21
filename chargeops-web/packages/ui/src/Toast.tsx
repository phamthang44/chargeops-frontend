import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

/** useToast()('Đã lưu', 'success') — auto-dismisses after 2.6s. */
export function useToast() {
  return useContext(ToastContext);
}

const DOT: Record<ToastTone, string> = {
  success: 'bg-owner',
  error: 'bg-bad',
  info: 'bg-brand',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-[22px] left-1/2 z-60 flex -translate-x-1/2 flex-col items-center gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex max-w-[90vw] items-center gap-2.5 rounded-[11px] bg-surface border border-line px-[18px] py-3 shadow-[0_8px_30px_rgba(0,0,0,.12)]"
            style={{ animation: 'popIn .2s ease' }}
          >
            <span className={`h-[18px] w-[18px] shrink-0 rounded-full ${DOT[t.tone]}`} />
            <span className="text-[13px] font-medium text-ink">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
