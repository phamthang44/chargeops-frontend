import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  NotificationCenter,
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
import { formatRelativeTime } from '../../shared/notifications/formatRelativeTime';
import { resolveNotificationI18n } from '@chargeops/api';

export function Notifications() {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();

  const params = useMemo(
    () => ({
      context: 'admin',
      size: 20,
    }),
    [],
  );

  const { items: serverNotifs = [], hasMore, loadMore, isLoadingMore } = useInfiniteNotifications(params);
  const { data: unreadCount } = useUnreadCount({ context: 'admin' });
  const markAsRead = useMarkAsRead({ context: 'admin' });
  const markAllAsRead = useMarkAllAsRead({ context: 'admin' });
  const dismiss = useDismissNotification({ context: 'admin' });

  const displayItems = useMemo<NotificationItem[]>(() => {
    return serverNotifs.map((n) => {
      const displayTime = n.time || formatRelativeTime(n.createdAt, t);

      const navigateToTarget = () => {
        if (n.primaryAction?.actionUrl) {
          navigate(`/admin${n.primaryAction.actionUrl}`);
        } else if (n.target?.type === 'OPEN_CASE' && n.target.escalationId) {
          navigate(`/admin/tickets?escalationId=${n.target.escalationId}`);
        } else if (n.target?.type === 'OPEN_TICKET' && n.target.ticketId) {
          navigate(`/admin/tickets/${n.target.ticketId}`);
        } else if (n.target?.type === 'OPEN_BOOKING' && n.target.bookingId) {
          navigate(`/admin/stations`);
        } else if (n.target?.type === 'OPEN_REFUND') {
          navigate(`/admin/tickets`);
        } else if (n.category === 'ticket') {
          navigate('/admin/tickets');
        } else {
          navigate('/admin/dashboard');
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
  }, [serverNotifs, navigate, t]);

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllRead = (category?: CategoryFilter) => {
    markAllAsRead.mutate(category && category !== 'all' ? category : undefined);
  };

  const handleDismiss = (id: string) => {
    dismiss.mutate(id);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <NotificationCenter
        items={displayItems}
        unreadCount={unreadCount}
        title={t('notifications.title', 'Trung tâm Thông báo & Cảnh báo')}
        description={t('notifications.description', 'Cảnh báo toàn hệ thống, phê duyệt trạm, giấy phép và các ca khiếu nại chuyển cấp.')}
        categories={['all', 'ticket', 'account']}
        onMarkRead={handleMarkAsRead}
        onMarkAllRead={handleMarkAllRead}
        onDismiss={handleDismiss}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
}

