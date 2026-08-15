import { useEffect, useState } from 'react';
import { NotificationItem } from './NotificationBell';
import { IconBolt, IconAlertTriangle, IconLifebuoy, IconShield, IconX, IconArrowRight } from './icons';

interface NotificationToastStackProps {
  toasts: NotificationItem[];
  onDismiss: (id: string) => void;
}

export function NotificationToastStack({ toasts, onDismiss }: NotificationToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: NotificationItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in entry animation
    requestAnimationFrame(() => setVisible(true));

    // Auto dismiss after 6 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 200);
    }, 6000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const tone = toast.tone ?? 'neutral';

  return (
    <div
      className={[
        'pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300 transform',
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95',
        tone === 'bad'
          ? 'border-bad/30 bg-bad-soft/90 text-ink'
          : tone === 'warn'
            ? 'border-warn/30 bg-warn-soft/90 text-ink'
            : tone === 'good'
              ? 'border-owner/30 bg-owner-soft/90 text-ink'
              : 'border-line-2 bg-surface/95 text-ink',
      ].join(' ')}
    >
      {/* Icon */}
      <div
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-2xs',
          tone === 'bad'
            ? 'bg-bad/20 text-bad-deep'
            : tone === 'warn'
              ? 'bg-warn/20 text-warn-deep'
              : tone === 'good'
                ? 'bg-owner/20 text-owner-deep'
                : 'bg-brand/10 text-brand',
        ].join(' ')}
      >
        {toast.category === 'session' ? (
          <IconBolt size={18} />
        ) : toast.category === 'ticket' ? (
          <IconLifebuoy size={18} />
        ) : toast.category === 'alert' || tone === 'bad' ? (
          <IconAlertTriangle size={18} />
        ) : (
          <IconShield size={18} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-extrabold tracking-tight text-ink truncate">{toast.title}</span>
          {toast.time && <span className="font-mono text-[10px] font-medium text-ghost">{toast.time}</span>}
        </div>

        {toast.subtitle && <p className="mt-0.5 text-[11.5px] font-medium text-muted">{toast.subtitle}</p>}

        {toast.actionLabel && (
          <button
            type="button"
            onClick={() => {
              toast.onSelect();
              onDismiss(toast.id);
            }}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
          >
            <span>{toast.actionLabel}</span>
            <IconArrowRight size={12} />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 200);
        }}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ghost hover:text-ink hover:bg-line-3"
      >
        <IconX size={12} />
      </button>
    </div>
  );
}
