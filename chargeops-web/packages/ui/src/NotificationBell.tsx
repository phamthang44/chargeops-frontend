import { useEffect, useRef, useState, useMemo } from 'react';
import {
  IconBell,
  IconX,
  IconBolt,
  IconAlertTriangle,
  IconLifebuoy,
  IconShield,
  IconSearch,
  IconArrowRight,
  IconCheck,
} from './icons';

export interface NotificationItem {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  /** Relative time string, e.g. "2m ago" */
  time?: string;
  tone?: 'warn' | 'bad' | 'good' | 'neutral';
  /** Whether the item has been read. */
  read?: boolean;
  onSelect?: () => void;

  /** Category for tab filtering */
  category?: 'alert' | 'session' | 'ticket' | 'system' | 'billing';
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
  primaryAction?: {
    label: string;
    actionUrl?: string;
    actionType?: 'link' | 'api_call';
    variant?: 'default' | 'outline' | 'destructive';
  };
  secondaryAction?: {
    label: string;
    actionUrl?: string;
    actionType?: 'link' | 'api_call';
  };
  /** Status badge label */
  badge?: string;
}

const TONE_CONFIG: Record<
  NonNullable<NotificationItem['tone']>,
  { dot: string; bg: string; border: string; badgeBg: string; badgeFg: string }
> = {
  bad: {
    dot: 'bg-bad',
    bg: 'bg-bad-soft/30 hover:bg-bad-soft/60',
    border: 'border-bad/20',
    badgeBg: 'bg-bad/10',
    badgeFg: 'text-bad-deep',
  },
  warn: {
    dot: 'bg-warn',
    bg: 'bg-warn-soft/30 hover:bg-warn-soft/60',
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
export type StatusFilter = 'all' | 'unread';

export interface NotificationBellProps {
  items: NotificationItem[];
  emptyLabel?: string;
  unreadCount?: number;
  onOpenCenter?: () => void;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDismiss?: (id: string) => void;
}

/**
 * Novu & Knock inspired Header Notification Bell + Action-Driven Inbox Popover.
 * Supports:
 * - Segmented Status Tabs: "Tất cả" vs "Chưa đọc"
 * - Instant Optimistic mark-as-read
 * - Inline Quick Action buttons (Primary / Secondary CTAs)
 * - Telemetry context pills (kW, °C, revenue, station)
 */
export function NotificationBell({
  items: initialItems,
  emptyLabel = 'Không có thông báo mới',
  unreadCount: externalUnread,
  onOpenCenter,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [localItems, setLocalItems] = useState<NotificationItem[]>([]);
  const [statusTab, setStatusTab] = useState<StatusFilter>('all');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Sync external items into local state while tracking read status
  useEffect(() => {
    setLocalItems(initialItems);
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

  const items = localItems;
  const unreadCount = externalUnread !== undefined ? externalUnread : items.filter((i) => !i.read).length;

  const handleMarkRead = (id: string) => {
    if (onMarkRead) {
      onMarkRead(id);
    } else {
      setLocalItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    }
  };

  const handleMarkAllRead = () => {
    if (onMarkAllRead) {
      onMarkAllRead();
    } else {
      setLocalItems((prev) => prev.map((i) => ({ ...i, read: true })));
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(id);
    } else {
      setLocalItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Status tab filter (All vs Unread)
      if (statusTab === 'unread' && item.read) return false;

      // 2. Category filter
      if (activeCategory !== 'all') {
        const cat = item.category || (item.tone === 'bad' || item.tone === 'warn' ? 'alert' : 'system');
        if (cat !== activeCategory) return false;
      }

      // 3. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSub = item.subtitle?.toLowerCase().includes(q) ?? false;
        const matchBody = item.body?.toLowerCase().includes(q) ?? false;
        const matchStation = item.stationName?.toLowerCase().includes(q) ?? false;
        const matchCharger = item.chargerId?.toLowerCase().includes(q) ?? false;
        return matchTitle || matchSub || matchBody || matchStation || matchCharger;
      }
      return true;
    });
  }, [items, statusTab, activeCategory, searchQuery]);

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
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface hover:bg-surface-2 hover:border-line-3 transition-all duration-150 active:scale-95 shadow-2xs"
        title="Thông báo"
      >
        <IconBell size={17} strokeWidth={1.9} className="text-body group-hover:text-ink transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-brand px-1 font-mono text-[9.5px] font-black text-white leading-none shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Novu-Style Popover Dropdown Panel */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2.5 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line-2 bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.18),0_6px_16px_rgba(0,0,0,0.08)] backdrop-blur-xl"
          style={{ animation: 'popIn .18s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Header Bar */}
          <div className="border-b border-line-2 bg-surface-2/90 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-ink tracking-tight">Hộp Thông Báo</span>
                {unreadCount > 0 ? (
                  <span className="flex h-5 items-center rounded-full bg-brand/10 border border-brand/20 px-2 font-mono text-[10px] font-bold text-brand">
                    {unreadCount} chưa đọc
                  </span>
                ) : (
                  <span className="flex h-5 items-center rounded-full bg-owner/10 border border-owner/20 px-2 text-[10px] font-semibold text-owner-deep">
                    Đã đọc hết
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-bold text-brand hover:text-brand-strong transition-colors px-2 py-1 rounded-lg hover:bg-brand-soft/50"
                  title="Đánh dấu tất cả thông báo là đã đọc"
                >
                  <IconCheck size={13} strokeWidth={2.5} />
                  <span>Đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Novu / Knock Segmented Tabs (Tất cả vs Chưa đọc) */}
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center rounded-lg bg-surface border border-line-2 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setStatusTab('all')}
                  className={[
                    'rounded-md px-3 py-1 text-[11px] font-bold transition-all',
                    statusTab === 'all'
                      ? 'bg-ink text-surface shadow-xs'
                      : 'text-muted hover:text-ink',
                  ].join(' ')}
                >
                  Tất cả ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('unread')}
                  className={[
                    'rounded-md px-3 py-1 text-[11px] font-bold transition-all',
                    statusTab === 'unread'
                      ? 'bg-ink text-surface shadow-xs'
                      : 'text-muted hover:text-ink',
                  ].join(' ')}
                >
                  Chưa đọc ({unreadCount})
                </button>
              </div>

              {/* Mini Search input */}
              <div className="relative flex-1 max-w-[160px]">
                <IconSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type="text"
                  placeholder="Lọc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface py-1 pl-7 pr-6 text-[11px] text-ink placeholder:text-ghost focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
                  >
                    <IconX size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'Tất cả chủ đề' },
                  { id: 'alert', label: 'Cảnh báo' },
                  { id: 'session', label: 'Phiên sạc' },
                  { id: 'ticket', label: 'Vé hỗ trợ' },
                ] as const
              ).map((tab) => {
                const active = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={[
                      'whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-bold transition-all',
                      active
                        ? 'bg-brand/10 text-brand border border-brand/20'
                        : 'text-ghost hover:text-body hover:bg-chip/50',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Feed List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-line-2/40 bg-surface">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-chip text-faint">
                  <IconBell size={20} strokeWidth={1.6} />
                </span>
                <span className="text-[13px] font-bold text-ink">
                  {statusTab === 'unread' ? 'Bạn đã đọc hết mọi thông báo! 🎉' : 'Không có thông báo phù hợp'}
                </span>
                <span className="text-[11.5px] text-muted max-w-[240px] leading-relaxed">{emptyLabel}</span>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {filteredItems.map((n) => {
                  const tone = n.tone ?? 'neutral';
                  const cfg = TONE_CONFIG[tone];

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        handleMarkRead(n.id);
                        if (n.onSelect) {
                          setOpen(false);
                          n.onSelect();
                        }
                      }}
                      className={[
                        'group relative flex flex-col gap-2 rounded-xl p-3 text-left transition-all duration-150 cursor-pointer border',
                        n.read
                          ? 'bg-surface hover:bg-chip/50 border-line/30 opacity-75 hover:opacity-100'
                          : `${cfg.bg} ${cfg.border} shadow-2xs`,
                      ].join(' ')}
                    >
                      {/* Top Bar: Icon + Title + Time + Actions */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Icon badge */}
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.badgeBg} shadow-2xs`}>
                          {getCategoryIcon(n)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {!n.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                              )}
                              <span className={`text-[12.5px] font-bold leading-snug truncate ${n.read ? 'text-body' : 'text-ink'}`}>
                                {n.title}
                              </span>
                            </div>
                            {n.time && (
                              <span className="shrink-0 font-mono text-[10px] font-medium text-ghost">
                                {n.time}
                              </span>
                            )}
                          </div>

                          {(n.subtitle || n.body) && (
                            <p className="mt-0.5 text-[11.5px] font-medium text-muted leading-relaxed line-clamp-2">
                              {n.subtitle || n.body}
                            </p>
                          )}
                        </div>

                        {/* Hover Quick Actions: Mark Read & Dismiss */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button
                              type="button"
                              aria-label="Đánh dấu đã đọc"
                              title="Đánh dấu đã đọc"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(n.id);
                              }}
                              className="flex h-5 w-5 items-center justify-center rounded-md text-ghost hover:bg-owner-soft hover:text-owner-deep transition-colors"
                            >
                              <IconCheck size={12} strokeWidth={2.5} />
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label="Xóa thông báo"
                            title="Xóa thông báo"
                            onClick={(e) => handleDismiss(n.id, e)}
                            className="flex h-5 w-5 items-center justify-center rounded-md text-ghost hover:bg-bad-soft hover:text-bad-deep transition-colors"
                          >
                            <IconX size={11} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>

                      {/* Context Info Pills (Station, Charger, Metrics) */}
                      {(n.stationName || n.chargerId || n.metrics) && (
                        <div className="flex flex-wrap items-center gap-1.5 pl-[34px]">
                          {n.stationName && (
                            <span className="rounded-md bg-surface border border-line-2 px-1.5 py-0.5 text-[10px] font-bold text-body shadow-2xs">
                              📍 {n.stationName}
                            </span>
                          )}
                          {n.chargerId && (
                            <span className="rounded-md bg-surface border border-line-2 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted shadow-2xs">
                              ⚡ {n.chargerId}
                            </span>
                          )}
                          {n.metrics?.powerKw && (
                            <span className="rounded-md bg-owner-soft text-owner-deep px-1.5 py-0.5 font-mono text-[10px] font-bold">
                              {n.metrics.powerKw} kW
                            </span>
                          )}
                          {n.metrics?.temperature && (
                            <span className="rounded-md bg-bad-soft text-bad-deep px-1.5 py-0.5 font-mono text-[10px] font-bold">
                              🔥 {n.metrics.temperature}
                            </span>
                          )}
                          {n.metrics?.amount && (
                            <span className="rounded-md bg-owner-soft text-owner-deep px-1.5 py-0.5 font-mono text-[10px] font-black">
                              {n.metrics.amount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Dynamic Progress Bar (Charging progress) */}
                      {n.metrics?.progressPct !== undefined && (
                        <div className="mt-0.5 pl-[34px] space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-muted">
                            <span>Tiến độ nạp điện</span>
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

                      {/* Primary Action Button (Novu pattern: inline actionable card) */}
                      {(n.actionLabel || n.primaryAction) && (
                        <div className="mt-1 flex items-center justify-end pl-[34px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(n.id);
                              setOpen(false);
                              if (n.onAction) n.onAction();
                              else if (n.onSelect) n.onSelect();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-line-2 hover:border-brand/40 px-2.5 py-1 text-[11px] font-bold text-ink hover:text-brand hover:bg-brand-soft/30 transition-all shadow-2xs group/btn"
                          >
                            <span>{n.primaryAction?.label || n.actionLabel}</span>
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-chip group-hover/btn:bg-brand group-hover/btn:text-white transition-colors">
                              <IconArrowRight size={9} strokeWidth={2.5} />
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

          {/* Footer Bar */}
          <div className="flex items-center justify-between border-t border-line-2 bg-surface-2/70 px-4 py-2.5 text-[11.5px]">
            <span className="font-medium text-faint">
              {unreadCount === 0 ? 'Tất cả đã đọc' : `${unreadCount} chưa đọc trong tổng số ${items.length}`}
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
                <span>Trung tâm thông báo</span>
                <IconArrowRight size={13} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
