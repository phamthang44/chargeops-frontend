import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NotificationCenter, type NotificationItem } from '@chargeops/ui';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../../shared/notifications/useNotifications';
import { useOwnerStation } from '../context/OwnerStationContext';
import { resolveNotificationI18n, type AppNotification } from '@chargeops/api';

export function OwnerNotifications({ base = '/owner' }: { base?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedStationId } = useOwnerStation();
  const [page, setPage] = useState(1);
  const [accumulatedItems, setAccumulatedItems] = useState<AppNotification[]>([]);

  // Reset page and accumulated list when station changes
  useEffect(() => {
    setPage(1);
    setAccumulatedItems([]);
  }, [selectedStationId]);

  const params = useMemo(
    () => ({
      context: 'owner',
      stationId: selectedStationId ?? undefined,
      page,
      size: 20,
    }),
    [selectedStationId, page],
  );

  const query = useNotifications(params);
  const { items: currentItems = [], meta, isLoading, isFetching } = query;

  // Append items for pagination
  useEffect(() => {
    if (currentItems.length > 0) {
      setAccumulatedItems((prev) => {
        if (page === 1) return currentItems;
        const existingIds = new Set(prev.map((i) => i.id));
        const nextItems = currentItems.filter((i) => !existingIds.has(i.id));
        return [...prev, ...nextItems];
      });
    } else if (page === 1) {
      setAccumulatedItems([]);
    }
  }, [currentItems, page]);

  const mutationScope = useMemo(
    () => ({ context: 'owner', stationId: selectedStationId ?? undefined }),
    [selectedStationId],
  );

  const markAsRead = useMarkAsRead(mutationScope);
  const markAllAsRead = useMarkAllAsRead(mutationScope);
  const dismiss = useDeleteNotification(mutationScope);

  const displayItems = useMemo<NotificationItem[]>(() => {
    const list = page === 1 ? currentItems : accumulatedItems;
    return list.map((n) => {
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
        } else if (n.category === 'alert' || n.category === 'session') {
          navigate(`${base}/chargers`);
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
        metrics: n.metrics,
        badge: n.badge,
        actionLabel: n.actionLabel || n.primaryAction?.label,
        onSelect: navigateToTarget,
        onAction: navigateToTarget,
      };
    });
  }, [page, currentItems, accumulatedItems, base, navigate, t]);

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
    setAccumulatedItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
    setAccumulatedItems((prev) => prev.map((i) => ({ ...i, read: true })));
  };

  const handleDismiss = (id: string) => {
    dismiss.mutate(id);
    setAccumulatedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const hasMore = Boolean(meta?.hasNextPage);

  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <NotificationCenter
        items={displayItems}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDismiss={handleDismiss}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isLoadingMore={isFetching && page > 1}
      />
    </div>
  );
}
