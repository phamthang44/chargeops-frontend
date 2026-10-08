import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  NotificationItem,
  CategoryFilter,
  StatusFilter,
} from './NotificationBell';
import {
  IconBell,
  IconCalendar,
  IconCard,
  IconLifebuoy,
  IconShield,
  IconSearch,
  IconCheck,
  IconX,
  IconArrowRight,
  IconClock,
  IconRefreshCw,
} from './icons';

export interface NotificationCenterProps {
  items: NotificationItem[];
  serverFilters?: boolean;
  onFilterChange?: (category: CategoryFilter, unread: boolean) => void;
  categories?: CategoryFilter[];
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  countUnavailable?: boolean;
  unreadCount?: number;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: (category?: CategoryFilter) => void;
  onDismiss?: (id: string) => void;
  onClearRead?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void | Promise<any>;
  isLoadingMore?: boolean;
}

export function NotificationCenter({
  items,
  unreadCount: externalUnread,
  title,
  description,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  hasMore,
  onLoadMore,
  isLoadingMore,
  serverFilters,
  onFilterChange,
  categories,
  loading,
  error,
  onRetry,
  countUnavailable,
}: NotificationCenterProps) {
  const { t } = useTranslation('ui');
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const categoryTabs = useMemo<{ id: CategoryFilter; label: string }[]>(
    () => [
      { id: 'all', label: t('notificationCenter.categories.all', 'Tất cả') },
      { id: 'booking', label: t('notificationCenter.categories.booking', 'Đặt chỗ') },
      { id: 'ticket', label: t('notificationCenter.categories.ticket', 'Vé hỗ trợ') },
      { id: 'finance', label: t('notificationCenter.categories.finance', 'Tài chính & Hoàn tiền') },
      { id: 'account', label: t('notificationCenter.categories.account', 'Hệ thống & tài khoản') },
    ],
    [t],
  );

  // Total unread: external count from API or fallback to item list
  const unreadCount =
    externalUnread !== undefined
      ? externalUnread
      : safeItems.filter((i) => !i.read).length;

  // Filter items based on Category, Status, and Search query
  const filteredItems = useMemo(() => {
    if (serverFilters) return safeItems;
    return safeItems.filter((item) => {
      // 1. Status Filter
      if (statusTab === 'unread' && item.read) return false;

      // 2. Category Filter (normalize support->ticket, system->account)
      if (activeTab !== 'all') {
        const cat = item.category === 'support' ? 'ticket' : item.category === 'system' ? 'account' : item.category;
        if (cat !== activeTab) return false;
      }

      // 3. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSub = item.subtitle?.toLowerCase().includes(q) ?? false;
        const matchBody = item.body?.toLowerCase().includes(q) ?? false;
        const matchStation = item.stationName?.toLowerCase().includes(q) ?? false;
        const matchBadge = item.badge?.toLowerCase().includes(q) ?? false;
        return matchTitle || matchSub || matchBody || matchStation || matchBadge;
      }

      return true;
    });
  }, [safeItems, activeTab, statusTab, searchQuery, serverFilters]);

  const getCategoryConfig = (item: NotificationItem) => {
    const cat = item.category === 'support' ? 'ticket' : item.category === 'system' ? 'account' : item.category;
    switch (cat) {
      case 'booking':
        return {
          icon: <IconCalendar size={17} className="text-brand" />,
          bg: 'bg-brand/10',
          border: 'border-brand/20',
          label: t('notificationCenter.categoryBadge.booking', 'Đặt chỗ'),
        };
      case 'ticket':
        return {
          icon: <IconLifebuoy size={17} className="text-warn-deep" />,
          bg: 'bg-warn/15',
          border: 'border-warn/25',
          label: t('notificationCenter.categoryBadge.ticket', 'Vé hỗ trợ'),
        };
      case 'finance':
        return {
          icon: <IconCard size={17} className="text-owner-deep" />,
          bg: 'bg-owner/15',
          border: 'border-owner/25',
          label: t('notificationCenter.categoryBadge.finance', 'Tài chính'),
        };
      case 'account':
      default:
        return {
          icon: <IconShield size={17} className="text-muted" />,
          bg: 'bg-line-2',
          border: 'border-line',
          label: t('notificationCenter.categoryBadge.account', 'Hệ thống'),
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ===== HEADER BANNER (Clean & Modern) ===== */}
      <div className="rounded-2xl border border-line-2 bg-surface p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-2xs">
              <IconBell size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold tracking-tight text-ink">
                  {title ?? t('notificationCenter.title', 'Trung tâm Thông báo')}
                </h1>
                {loading || countUnavailable ? (
                  <span className="text-xs text-muted">
                    {t('notificationCenter.updatingCount', 'Đang cập nhật số chưa đọc')}
                  </span>
                ) : unreadCount > 0 ? (
                  <span className="rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-brand">
                    {t('notificationCenter.unreadCount', { count: unreadCount, defaultValue: `${unreadCount} chưa đọc` })}
                  </span>
                ) : (
                  <span className="rounded-full bg-owner/10 border border-owner/20 px-2.5 py-0.5 text-[11px] font-semibold text-owner-deep">
                    {t('notificationCenter.allRead', 'Đã đọc hết')}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] font-medium text-muted">
                {description ?? t('notificationCenter.defaultDescription', 'Hòm thư sự kiện nghiệp vụ, cập nhật lịch đặt chỗ, vé hỗ trợ và tài chính.')}
              </p>
            </div>
          </div>

          {onMarkAllRead && unreadCount > 0 && (
            <button
              type="button"
              onClick={() => onMarkAllRead(activeTab !== 'all' ? activeTab : undefined)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-2 bg-surface hover:bg-chip px-3.5 py-2 text-[12px] font-bold text-ink shadow-2xs transition-colors self-start sm:self-auto"
            >
              <IconCheck size={14} strokeWidth={2.5} className="text-brand" />
              <span>
                {activeTab !== 'all'
                  ? t('notificationCenter.markCategoryRead', 'Đọc tất cả trong mục này')
                  : t('notificationCenter.markAllRead', 'Đánh dấu tất cả đã đọc')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ===== FILTER TOOLBAR ===== */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Status & Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Tabs */}
          <div className="flex items-center rounded-xl border border-line-2 bg-surface p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => { setStatusTab('all'); onFilterChange?.(activeTab, false); }}
              className={[
                'rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all',
                statusTab === 'all'
                  ? 'bg-ink text-surface shadow-xs'
                  : 'text-body hover:text-ink hover:bg-chip',
              ].join(' ')}
            >
              {t('notificationCenter.statusAll', 'Tất cả')}
            </button>
            <button
              type="button"
              onClick={() => { setStatusTab('unread'); onFilterChange?.(activeTab, true); }}
              className={[
                'rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all',
                statusTab === 'unread'
                  ? 'bg-ink text-surface shadow-xs'
                  : 'text-body hover:text-ink hover:bg-chip',
              ].join(' ')}
            >
              {t('notificationCenter.statusUnread', 'Chưa đọc')}
            </button>
          </div>

          <div className="h-4 w-px bg-line-2 mx-1 hidden sm:block" />

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categoryTabs.filter((tab) => !categories || categories.includes(tab.id)).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); onFilterChange?.(tab.id, statusTab === 'unread'); }}
                  className={[
                    'rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all border',
                    active
                      ? 'bg-brand/10 text-brand border-brand/30 shadow-2xs'
                      : 'border-line-2 bg-surface text-body hover:text-ink hover:bg-chip',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Search Input */}
        {!serverFilters && (
          <div className="relative min-w-[240px]">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="text"
              placeholder={t('notificationCenter.searchPlaceholder', 'Tìm kiếm nội dung thông báo...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface py-1.5 pl-9 pr-7 text-[12px] font-medium text-ink placeholder:text-ghost focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
              >
                <IconX size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== NOTIFICATIONS LIST (Clean Flat Cards) ===== */}
      {loading ? (
        <p role="status">{t('notificationCenter.loading', 'Đang tải thông báo...')}</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            {t('notificationCenter.retry', 'Thử lại')}
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-line-2 bg-surface p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chip text-faint">
            <IconBell size={26} strokeWidth={1.6} />
          </div>
          <h3 className="mt-4 text-base font-bold text-ink">
            {statusTab === 'unread'
              ? t('notificationCenter.emptyUnreadTitle', 'Không có thông báo chưa đọc trong bộ lọc này')
              : t('notificationCenter.emptyTitle', 'Không tìm thấy thông báo nào')}
          </h3>
          <p className="mt-1 text-[13px] text-muted">
            {statusTab === 'unread'
              ? t('notificationCenter.emptyUnreadDesc', 'Không còn thông báo chưa đọc nào trong danh mục này.')
              : t('notificationCenter.emptyDesc', 'Không có thông báo phù hợp với bộ lọc hoặc từ khóa tìm kiếm.')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const cfg = getCategoryConfig(item);
            const actionLabel = item.actionLabel || item.primaryAction?.label;

            return (
              <div
                key={item.id}
                className={[
                  'group relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-2xs p-4 sm:p-5',
                  item.read
                    ? 'border-line-2/70 bg-surface/70 hover:bg-surface hover:border-line-3 opacity-80 hover:opacity-100'
                    : 'border-brand/25 bg-surface hover:border-brand/40 shadow-xs',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Icon + Main Text */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Category Icon Badge */}
                    <div
                      className={[
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs',
                        cfg.bg,
                        cfg.border,
                      ].join(' ')}
                    >
                      {cfg.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header Row: Title + Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {!item.read && (
                          <span
                            className="h-2 w-2 rounded-full bg-brand shrink-0 animate-pulse"
                            title={t('notificationCenter.unreadDot', 'Chưa đọc')}
                          />
                        )}
                        <h4
                          className={[
                            'text-[13.5px] font-bold tracking-tight break-words',
                            item.read ? 'text-body font-semibold' : 'text-ink font-bold',
                          ].join(' ')}
                        >
                          {item.title}
                        </h4>

                        {item.badge && (
                          <span className="rounded-md bg-chip px-2 py-0.5 font-mono text-[10px] font-bold text-muted border border-line-2">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Subtitle / Body text */}
                      {(item.subtitle || item.body) && (
                        <p className="mt-1 text-[12.5px] font-medium text-muted leading-relaxed break-words">
                          {item.subtitle || item.body}
                        </p>
                      )}

                      {/* Station reference (if present) */}
                      {item.stationName && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-chip px-2 py-0.5 text-[11px] font-medium text-muted border border-line-2">
                            📍 {item.stationName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Timestamp & Actions */}
                  <div className="flex flex-col items-end gap-2.5 shrink-0">
                    {item.time && (
                      <span className="flex items-center gap-1 font-mono text-[11px] font-medium text-ghost">
                        <IconClock size={11} />
                        {item.time}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {/* Mark as read button */}
                      {onMarkRead && !item.read && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(item.id)}
                          title={t('notificationCenter.markAsRead', 'Đánh dấu đã đọc')}
                          aria-label={t('notificationCenter.markAsRead', 'Đánh dấu đã đọc')}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line-2 bg-surface text-faint hover:text-owner-deep hover:bg-owner-soft transition-colors"
                        >
                          <IconCheck size={13} strokeWidth={2.5} />
                        </button>
                      )}

                      {/* Dismiss button */}
                      {onDismiss && (
                        <button
                          type="button"
                          onClick={() => onDismiss(item.id)}
                          title={t('notificationCenter.dismiss', 'Ẩn thông báo')}
                          aria-label={t('notificationCenter.dismiss', 'Ẩn thông báo')}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line-2 bg-surface text-faint hover:text-bad-deep hover:bg-bad-soft transition-colors"
                        >
                          <IconX size={13} strokeWidth={2.2} />
                        </button>
                      )}
                    </div>

                    {/* Quick CTA Navigate Button */}
                    {(actionLabel || item.onAction || item.onSelect) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onMarkRead && !item.read) onMarkRead(item.id);
                          if (item.onAction) item.onAction();
                          else if (item.onSelect) item.onSelect();
                        }}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-surface hover:bg-chip px-2.5 py-1 text-[11.5px] font-bold text-ink hover:text-brand transition-all shadow-2xs group/btn active:scale-95"
                      >
                        <span>{actionLabel || t('notificationCenter.viewDetail', 'Xem chi tiết')}</span>
                        <IconArrowRight size={11} strokeWidth={2.5} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && !error && (
        <div>
          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-line-2 bg-surface px-5 py-2 text-[13px] font-bold text-ink shadow-2xs hover:bg-chip disabled:opacity-50 transition-colors"
              >
                {isLoadingMore ? (
                  <>
                    <IconRefreshCw size={13} className="animate-spin" />
                    <span>{t('notificationCenter.loadingMore', 'Đang tải thêm...')}</span>
                  </>
                ) : (
                  <span>{t('notificationCenter.loadMore', 'Tải thêm thông báo')}</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

