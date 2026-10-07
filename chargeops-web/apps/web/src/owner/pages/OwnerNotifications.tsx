import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  NotificationCenter,
  IconBolt,
  IconUsers,
  IconShieldAlert,
  type NotificationItem,
  type CategoryFilter,
} from '@chargeops/ui';
import {
  useInfiniteNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDismissNotification,
} from '../../shared/notifications/useNotifications';
import { resolveNotificationI18n } from '@chargeops/api';

export function OwnerNotifications({ base = '/owner' }: { base?: string }) {
  const { t } = useTranslation('owner');
  const navigate = useNavigate();

  const [context, setContext] = useState<'owner' | 'personal'>('owner');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [unread, setUnread] = useState(false);

  // Owner inbox is all-scope (not filtered by header station dropdown)
  const params = useMemo(
    () => ({
      context,
      category: category === 'all' ? undefined : category,
      unread,
      size: 20,
    }),
    [context, category, unread],
  );

  const { items: serverItems = [], hasMore, loadMore, isLoadingMore, isPending, isError, isFetchNextPageError, refetch } = useInfiniteNotifications(params);
  const { data: unreadCount, isError: countError } = useUnreadCount({ context });

  const mutationScope = useMemo(() => ({ context }), [context]);
  const markAsRead = useMarkAsRead(mutationScope);
  const markAllAsRead = useMarkAllAsRead(mutationScope);
  const dismiss = useDismissNotification(mutationScope);

  const displayItems = useMemo<NotificationItem[]>(() => {
    return serverItems.map((n) => {
      let displayTime = n.time;
      if (!displayTime && n.createdAt) {
        try {
          const diffMs = Date.now() - new Date(n.createdAt).getTime();
          const diffMins = Math.floor(diffMs / 60_000);
          if (diffMins < 1) displayTime = 'Vừa xong';
          else if (diffMins < 60) displayTime = `${diffMins} phút trước`;
          else {
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) displayTime = `${diffHours} giờ trước`;
            else displayTime = `${Math.floor(diffHours / 24)} ngày trước`;
          }
        } catch {
          displayTime = undefined;
        }
      }

      const navigateToTarget = () => {
        if (n.primaryAction?.actionUrl) {
          navigate(`${base}${n.primaryAction.actionUrl}`);
        } else if (n.target?.type === 'OPEN_BOOKING' && n.target.bookingId) {
          navigate(`${base}/bookings?bookingId=${n.target.bookingId}`);
        } else if (n.target?.type === 'OPEN_TICKET' && n.target.ticketId) {
          navigate(`${base}/tickets/${n.target.ticketId}`);
        } else if (n.target?.type === 'OPEN_REFUND') {
          navigate(`${base}/revenue`);
        } else if (n.category === 'booking') {
          navigate(`${base}/bookings`);
        } else if (n.category === 'ticket') {
          navigate(`${base}/tickets`);
        }
      };

      return {
        id: n.id,
        source: 'persisted',
        title: resolveNotificationI18n(n.title, t),
        subtitle: resolveNotificationI18n(n.subtitle, t),
        body: resolveNotificationI18n(n.body, t),
        time: displayTime,
        tone: n.tone ?? n.severity,
        read: n.read,
        category: n.category,
        stationName: n.stationName,
        chargerId: n.chargerId,
        badge: n.badge,
        actionLabel: n.actionLabel || n.primaryAction?.label,
        onSelect: navigateToTarget,
        onAction: navigateToTarget,
      };
    });
  }, [serverItems, base, navigate, t]);

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllRead = (category?: CategoryFilter) => {
    markAllAsRead.mutate(category && category !== 'all' ? category : undefined);
  };

  const handleDismiss = (id: string) => {
    dismiss.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Scope Mode Switcher: Vận hành trạm vs Cá nhân */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-surface border border-line shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-heading flex items-center gap-2">
            {context === 'owner' ? (
              <>
                <IconBolt size={16} className="text-owner-deep" />
                Vận hành trạm
              </>
            ) : (
              <>
                <IconUsers size={16} className="text-brand" />
                Cá nhân & Khiếu nại
              </>
            )}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {context === 'owner'
              ? 'Thông báo nghiệp vụ trạm: gán vé hỗ trợ, hoàn tiền và sự cố trụ sạc của trạm bạn sở hữu.'
              : 'Thông báo cá nhân: phản hồi các ticket bạn đã gửi khiếu nại và thông báo tài khoản.'}
          </p>
        </div>

        <div className="inline-flex p-1 bg-chip rounded-xl border border-line/60 self-start sm:self-auto shrink-0" role="tablist" aria-label="Phạm vi thông báo">
          <button
            type="button"
            role="tab"
            aria-selected={context === 'owner'}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              context === 'owner'
                ? 'bg-card text-heading shadow-xs font-semibold'
                : 'text-muted hover:text-body'
            }`}
            onClick={() => {
              setContext('owner');
              setCategory('all');
              setUnread(false);
              markAsRead.reset();
              markAllAsRead.reset();
              dismiss.reset();
            }}
          >
            <IconBolt size={14} className={context === 'owner' ? 'text-owner-deep' : 'text-muted'} />
            Vận hành trạm
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={context === 'personal'}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              context === 'personal'
                ? 'bg-card text-heading shadow-xs font-semibold'
                : 'text-muted hover:text-body'
            }`}
            onClick={() => {
              setContext('personal');
              setCategory('all');
              setUnread(false);
              markAsRead.reset();
              markAllAsRead.reset();
              dismiss.reset();
            }}
          >
            <IconUsers size={14} className={context === 'personal' ? 'text-brand' : 'text-muted'} />
            Cá nhân
          </button>
        </div>
      </div>

      {(markAsRead.isError || markAllAsRead.isError || dismiss.isError) && (
        <div className="rounded-xl border border-bad/30 bg-bad-soft/30 px-4 py-2.5 text-xs text-bad-deep flex items-center gap-2" role="alert">
          <IconShieldAlert size={15} />
          <span>Không thể cập nhật thông báo. Vui lòng thử lại.</span>
        </div>
      )}
      {isFetchNextPageError && (
        <div className="rounded-xl border border-warn/30 bg-warn-soft/30 px-4 py-2.5 text-xs text-warn-deep flex items-center justify-between gap-2" role="alert">
          <span>Không tải được trang tiếp theo. Bấm tải thêm để thử lại.</span>
          <button type="button" onClick={() => void loadMore()} className="underline font-semibold hover:opacity-80">
            Thử lại
          </button>
        </div>
      )}
      <NotificationCenter
        key={context}
        serverFilters
        onFilterChange={(nextCategory, nextUnread) => { setCategory(nextCategory); setUnread(nextUnread); }}
        categories={context === 'owner' ? ['all', 'ticket', 'finance'] : ['all', 'ticket', 'account']}
        description={context === 'owner' ? 'Thông báo vận hành các trạm của bạn. Kết quả ticket do bạn báo nằm trong mục Cá nhân.' : 'Thông báo về ticket do bạn báo và tài khoản của bạn.'}
        loading={isPending}
        error={isError && !isFetchNextPageError ? 'Không tải được thông báo. Vui lòng thử lại.' : undefined}
        onRetry={() => { void refetch(); }}
        countUnavailable={unreadCount === undefined || countError}
        items={displayItems}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDismiss={handleDismiss}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
}
