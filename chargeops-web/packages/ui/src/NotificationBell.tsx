import { useEffect, useRef, useState, useMemo } from 'react';
import {
  IconBell,
  IconX,
  IconBolt,
  IconAlertTriangle,
  IconLifebuoy,
  IconShield,
  IconCheckCircle,
  IconSearch,
  IconArrowRight,
  IconCheck,
} from './icons';

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

  /** Category for tab filtering */
  category?: 'alert' | 'session' | 'ticket' | 'system';
  /** Station context */
  stationName?: string;
  /** Charger / Connector ID */
  chargerId?: string;
  /** Rich live telemetry metrics */
  metrics?: {
    powerKw?: number;
    progressPct?: number;
    amount?: string;
    temperature?: string;
    voltage?: string;
  };
  /** Direct action label */
  actionLabel?: string;
  /** Callback when direct action is clicked */
  onAction?: () => void;
  /** Status badge label */
  badge?: string;
}

const TONE_CONFIG: Record<
  NonNullable<NotificationItem['tone']>,
  { dot: string; bg: string; border: string; badgeBg: string; badgeFg: string }
> = {
  bad: {
    dot: 'bg-bad',
    bg: 'bg-bad-soft/40 hover:bg-bad-soft/70',
    border: 'border-bad/20',
    badgeBg: 'bg-bad/10',
    badgeFg: 'text-bad-deep',
  },
  warn: {
    dot: 'bg-warn',
    bg: 'bg-warn-soft/40 hover:bg-warn-soft/70',
    border: 'border-warn/25',
    badgeBg: 'bg-warn/10',
    badgeFg: 'text-warn-deep',
  },
  good: {
    dot: 'bg-owner',
    bg: 'bg-owner-soft/30 hover:bg-owner-soft/60',
    border: 'border-owner/20',
    badgeBg: 'bg-owner/10',
    badgeFg: 'text-owner-deep',
  },
  neutral: {
    dot: 'bg-faint',
    bg: 'bg-chip/50 hover:bg-chip',
    border: 'border-line/60',
    badgeBg: 'bg-line-2',
    badgeFg: 'text-body',
  },
};

export type CategoryFilter = 'all' | 'alert' | 'session' | 'ticket' | 'system';

/** Bell icon + modern informative notification dropdown panel. */
export function NotificationBell({
  items: initialItems,
  emptyLabel,
  onOpenCenter,
}: {
  items: NotificationItem[];
  emptyLabel: string;
  onOpenCenter?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (activeCategory !== 'all') {
        const cat = item.category || (item.tone === 'bad' || item.tone === 'warn' ? 'alert' : 'system');
        if (cat !== activeCategory) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSub = item.subtitle?.toLowerCase().includes(q) ?? false;
        const matchStation = item.stationName?.toLowerCase().includes(q) ?? false;
        const matchCharger = item.chargerId?.toLowerCase().includes(q) ?? false;
        return matchTitle || matchSub || matchStation || matchCharger;
      }
      return true;
    });
  }, [items, activeCategory, searchQuery]);

  const getCategoryIcon = (item: NotificationItem) => {
    const cat = item.category || (item.tone === 'bad' || item.tone === 'warn' ? 'alert' : 'system');
    switch (cat) {
      case 'session':
        return <IconBolt size={14} className="text-owner-deep" />;
      case 'alert':
        return <IconAlertTriangle size={14} className="text-bad-deep" />;
      case 'ticket':
        return <IconLifebuoy size={14} className="text-brand" />;
      case 'system':
      default:
        return <IconShield size={14} className="text-muted" />;
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group relative flex h-9 w-9 items-center justify-center rounded-ctl border border-line bg-surface hover:bg-canvas hover:border-line-3 transition-all duration-150 active:scale-95 shadow-sm"
      >
        <IconBell size={17} strokeWidth={1.9} className="text-body group-hover:text-ink transition-colors" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-alert px-1 font-mono text-[9.5px] font-extrabold text-white leading-none shadow-sm animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Modern Popover dropdown panel */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2.5 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line-2 bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.18),0_6px_16px_rgba(0,0,0,0.08)] backdrop-blur-xl"
          style={{ animation: 'popIn .18s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Header */}
          <div className="border-b border-line-2 bg-surface-2/80 px-4 py-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-extrabold text-ink tracking-tight">Thông báo</span>
                {unread > 0 ? (
                  <span className="flex h-5 items-center rounded-full bg-alert/10 border border-alert/20 px-2 font-mono text-[10px] font-bold text-alert">
                    {unread} chưa đọc
                  </span>
                ) : (
                  <span className="flex h-5 items-center rounded-full bg-owner/10 border border-owner/20 px-2 text-[10px] font-semibold text-owner-deep">
                    Đã đọc hết
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] font-bold text-brand hover:text-brand-strong transition-colors px-2 py-1 rounded-md hover:bg-brand-soft/50"
                  >
                    <IconCheck size={12} strokeWidth={2.5} />
                    <span>Đọc tất cả</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Search inside dropdown */}
            <div className="relative mt-2.5">
              <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="text"
                placeholder="Tìm nội dung thông báo, mã trạm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface py-1.5 pl-8 pr-7 text-[11.5px] text-ink placeholder:text-ghost focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
                >
                  <IconX size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'alert', label: 'Cảnh báo' },
                  { id: 'session', label: 'Phiên sạc' },
                  { id: 'ticket', label: 'Vé & Hỗ trợ' },
                ] as const
              ).map((tab) => {
                const active = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={[
                      'whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold transition-all',
                      active
                        ? 'bg-ink text-surface shadow-xs'
                        : 'text-muted hover:bg-chip hover:text-ink',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body list */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-line-2/40 bg-surface">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-chip text-faint">
                  <IconBell size={20} strokeWidth={1.6} />
                </span>
                <span className="text-[13px] font-semibold text-ink">Không có thông báo phù hợp</span>
                <span className="text-[11.5px] text-faint max-w-[240px] leading-relaxed">{emptyLabel}</span>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredItems.map((n) => {
                  const tone = n.tone ?? 'neutral';
                  const cfg = TONE_CONFIG[tone];

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                        n.onSelect();
                      }}
                      className={[
                        'group relative flex flex-col gap-2 rounded-xl p-3 text-left transition-all duration-150 cursor-pointer border',
                        n.read ? 'bg-surface hover:bg-chip/60 border-line/40 opacity-80 hover:opacity-100' : `${cfg.bg} ${cfg.border} shadow-xs`,
                      ].join(' ')}
                    >
                      {/* Top Bar: Icon + Category Badge + Title + Time */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Icon badge */}
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.badgeBg}`}>
                          {getCategoryIcon(n)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`text-[12.5px] font-extrabold leading-snug truncate ${n.read ? 'text-body' : 'text-ink'}`}>
                              {n.title}
                            </span>
                            {n.time && (
                              <span className="shrink-0 font-mono text-[10px] font-medium text-ghost">
                                {n.time}
                              </span>
                            )}
                          </div>

                          {n.subtitle && (
                            <p className="mt-0.5 text-[11.5px] font-medium text-muted leading-relaxed">
                              {n.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Dismiss X */}
                        <button
                          type="button"
                          aria-label="Dismiss"
                          onClick={(e) => dismiss(n.id, e)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ghost opacity-0 transition-opacity group-hover:opacity-100 hover:bg-line-3 hover:text-ink"
                        >
                          <IconX size={11} strokeWidth={2.2} />
                        </button>
                      </div>

                      {/* Context Info Pills (Station, Charger, Amount) */}
                      {(n.stationName || n.chargerId || n.metrics) && (
                        <div className="flex flex-wrap items-center gap-1.5 pl-[34px]">
                          {n.stationName && (
                            <span className="rounded-md bg-surface-2 border border-line-2 px-2 py-0.5 text-[10px] font-bold text-body">
                              📍 {n.stationName}
                            </span>
                          )}
                          {n.chargerId && (
                            <span className="rounded-md bg-surface-2 border border-line-2 px-2 py-0.5 font-mono text-[10px] font-bold text-muted">
                              ⚡ {n.chargerId}
                            </span>
                          )}
                          {n.metrics?.powerKw && (
                            <span className="rounded-md bg-owner/10 text-owner-deep px-2 py-0.5 font-mono text-[10px] font-bold">
                              {n.metrics.powerKw} kW
                            </span>
                          )}
                          {n.metrics?.temperature && (
                            <span className="rounded-md bg-bad/10 text-bad-deep px-2 py-0.5 font-mono text-[10px] font-bold">
                              🔥 {n.metrics.temperature}
                            </span>
                          )}
                          {n.metrics?.amount && (
                            <span className="rounded-md bg-owner-soft text-owner-deep px-2 py-0.5 font-mono text-[10px] font-extrabold">
                              {n.metrics.amount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Dynamic Progress Bar if present (e.g. charging session) */}
                      {n.metrics?.progressPct !== undefined && (
                        <div className="mt-1 pl-[34px] space-y-1">
                          <div className="flex items-center justify-between text-[10.5px] font-bold text-muted">
                            <span>Tiến độ sạc</span>
                            <span className="font-mono text-owner-deep">{n.metrics.progressPct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-line-3 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-owner transition-all duration-500"
                              style={{ width: `${n.metrics.progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Quick Action Button if present */}
                      {n.actionLabel && (
                        <div className="mt-1 flex items-center justify-end pl-[34px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(n.id);
                              setOpen(false);
                              if (n.onAction) n.onAction();
                              else n.onSelect();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-line-2 hover:border-brand/40 px-3 py-1 text-[11px] font-bold text-ink hover:text-brand hover:bg-brand-soft/30 transition-all shadow-2xs group/btn"
                          >
                            <span>{n.actionLabel}</span>
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-chip group-hover/btn:bg-brand group-hover/btn:text-white transition-colors">
                              <IconArrowRight size={10} strokeWidth={2.5} />
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-line-2 bg-surface-2/60 px-4 py-2.5 text-[11.5px]">
            <span className="font-medium text-faint">
              {unread === 0 ? 'Tất cả đã đọc' : `${unread} chưa đọc trong tổng số ${items.length}`}
            </span>
            {onOpenCenter && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenCenter();
                }}
                className="flex items-center gap-1 font-bold text-brand hover:text-brand-strong transition-colors"
              >
                <span>Xem tất cả</span>
                <IconArrowRight size={13} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
