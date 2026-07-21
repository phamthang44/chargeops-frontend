import { useEffect, useRef, useState } from 'react';
import { IconBell, IconX } from './icons';

export interface NotificationItem {
  id: string;
  title: string;
  subtitle?: string;
  /** Relative time string, e.g. "2m ago" */
  time?: string;
  tone?: 'warn' | 'bad' | 'good' | 'neutral';
  /** Whether the item has been read. */
  read?: boolean;
  onSelect: () => void;
}

const TONE_CONFIG: Record<NonNullable<NotificationItem['tone']>, { dot: string; bg: string; icon: string }> = {
  bad:     { dot: 'bg-bad',     bg: 'bg-bad-soft',     icon: 'text-bad-deep'   },
  warn:    { dot: 'bg-warn',    bg: 'bg-warn-soft',    icon: 'text-warn-deep'  },
  good:    { dot: 'bg-owner',   bg: 'bg-owner-soft',   icon: 'text-owner-deep' },
  neutral: { dot: 'bg-faint',   bg: 'bg-chip',         icon: 'text-faint'      },
};

/** Bell icon + premium notification dropdown panel. */
export function NotificationBell({
  items: initialItems,
  emptyLabel,
}: {
  items: NotificationItem[];
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Sync new incoming items while preserving local read state.
  useEffect(() => {
    setItems((prev) =>
      initialItems.map((item) => {
        const existing = prev.find((p) => p.id === item.id);
        return existing ? { ...item, read: existing.read } : item;
      }),
    );
  }, [initialItems]);

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

  const unread = items.filter((i) => !i.read).length;

  const markRead = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));

  const markAllRead = () => setItems((prev) => prev.map((i) => ({ ...i, read: true })));

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex h-[34px] w-[34px] items-center justify-center rounded-ctl border border-line bg-surface hover:bg-canvas transition-colors duration-100"
      >
        <IconBell size={16} strokeWidth={1.9} className="text-body" />
        {unread > 0 && (
          <span className="absolute -right-[3px] -top-[3px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-surface bg-alert px-[3px] font-mono text-[9px] font-bold text-white leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-45 mt-2 w-[360px] overflow-hidden rounded-[13px] border border-line-2 bg-surface shadow-[0_16px_48px_rgba(16,17,26,.16),0_4px_12px_rgba(16,17,26,.08)]"
          style={{ animation: 'popIn .15s ease' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-bold text-ink">Thông báo</span>
              {unread > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-alert px-1 font-mono text-[9.5px] font-bold text-white leading-none">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11.5px] font-semibold text-brand hover:text-brand-strong transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-chip">
                  <IconBell size={18} strokeWidth={1.7} className="text-faint" />
                </span>
                <span className="text-[12.5px] font-medium text-faint">{emptyLabel}</span>
              </div>
            ) : (
              <div className="py-1.5">
                {items.map((n) => {
                  const tone = n.tone ?? 'neutral';
                  const cfg = TONE_CONFIG[tone];
                  return (
                    <button
                      key={n.id}
                      role="menuitem"
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                        n.onSelect();
                      }}
                      className={[
                        'group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-100',
                        n.read ? 'hover:bg-chip' : `${cfg.bg} hover:brightness-[0.97]`,
                      ].join(' ')}
                    >
                      {/* Tone dot */}
                      <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${cfg.dot} ${n.read ? 'opacity-40' : ''}`} />

                      {/* Content */}
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[12.5px] font-semibold leading-snug ${n.read ? 'text-muted' : 'text-ink'}`}>
                          {n.title}
                        </span>
                        {n.subtitle && (
                          <span className="mt-0.5 block text-[11.5px] text-faint leading-snug">{n.subtitle}</span>
                        )}
                        {n.time && (
                          <span className="mt-1 block text-[10.5px] font-medium text-ghost">{n.time}</span>
                        )}
                      </span>

                      {/* Unread indicator bar */}
                      {!n.read && (
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ background: `var(--color-${tone === 'neutral' ? 'faint' : tone})` }} />
                      )}

                      {/* Dismiss button */}
                      <span
                        role="button"
                        aria-label="Dismiss"
                        onClick={(e) => dismiss(n.id, e)}
                        className="ml-1 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 hover:bg-line"
                      >
                        <IconX size={11} strokeWidth={2.2} className="text-faint" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-hairline px-4 py-2.5">
              <span className="text-[11px] font-medium text-faint">
                {unread === 0 ? 'Tất cả đã đọc' : `${unread} chưa đọc`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
