import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NotificationCenter, type NotificationItem, type CategoryFilter } from '@chargeops/ui';
import {
  useInfiniteNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDismissNotification,
} from '../../shared/notifications/useNotifications';
import { formatRelativeTime } from '../../shared/notifications/formatRelativeTime';
import { resolveNotificationI18n } from '@chargeops/api';
import { useStaffStation } from '../context/StaffStationContext';

export function StaffNotifications({ base = '/staff' }: { base?: string }) {
  const { t } = useTranslation('staff');
  const navigate = useNavigate();
  const { currentStation } = useStaffStation();

  const params = useMemo(
    () => ({
      context: 'staff',
      stationId: currentStation?.id,
      size: 20,
    }),
    [currentStation?.id],
  );

  const { items: serverItems = [], hasMore, loadMore, isLoadingMore } = useInfiniteNotifications(params);
  const { data: unreadCount } = useUnreadCount({ context: 'staff', stationId: currentStation?.id });

  const mutationScope = useMemo(
    () => ({ context: 'staff', stationId: currentStation?.id }),
    [currentStation?.id],
  );
  const markAsRead = useMarkAsRead(mutationScope);
  const markAllAsRead = useMarkAllAsRead(mutationScope);
  const dismiss = useDismissNotification(mutationScope);

  const displayItems = useMemo<NotificationItem[]>(() => {
    return serverItems.map((n) => {
      const displayTime = n.time || formatRelativeTime(n.createdAt, t);

      const navigateToTarget = () => {
        if (n.primaryAction?.actionUrl) {
          navigate(`${base}${n.primaryAction.actionUrl}`);
        } else if (n.target?.type === 'OPEN_BOOKING' && n.target.bookingId) {
          navigate(`${base}/bookings`);
        } else if (n.target?.type === 'OPEN_TICKET' && n.target.ticketId) {
          navigate(`${base}/tickets/${n.target.ticketId}`);
        } else if (n.category === 'booking') {
          navigate(`${base}/bookings`);
        } else if (n.category === 'ticket') {
          navigate(`${base}/tickets`);
        } else {
          navigate(`${base}/dashboard`);
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
      <NotificationCenter
        items={displayItems}
        unreadCount={unreadCount}
        title={t('notifications.title', 'Thông báo trạm')}
        description={t('notifications.description', 'Thông báo nghiệp vụ trạm: vé hỗ trợ, sự cố trụ sạc và thông tin tài khoản.')}
        categories={['all', 'ticket', 'account']}
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

