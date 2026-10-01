import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type AppNotification, type NotificationListParams } from '@chargeops/api';

export const NOTIFICATIONS_KEY = ['notifications'] as const;
export const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;

/**
 * Hook to fetch notifications feed with optional category / unread filter.
 * Uses intelligent polling (every 30s) + auto refetch on window focus.
 */
export function useNotifications(params?: NotificationListParams) {
  const api = useApi();
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params ?? {}],
    queryFn: async () => {
      const res = await api.notifications.list(params);
      return Array.isArray(res) ? res : ((res as any)?.items ?? []);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch unread notifications count for the Bell Badge.
 */
export function useUnreadCount() {
  const api = useApi();
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: () => api.notifications.unreadCount(),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Optimistic mutation: mark single notification as read.
 * Instantly flips `read = true` in query cache and decrements unread counter.
 */
export function useMarkAsRead() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      await qc.cancelQueries({ queryKey: UNREAD_COUNT_KEY });

      const prevNotifications = qc.getQueriesData<AppNotification[]>({ queryKey: NOTIFICATIONS_KEY });
      const prevCount = qc.getQueryData<number>(UNREAD_COUNT_KEY);

      // Optimistically mark as read across all notification queries
      qc.setQueriesData({ queryKey: NOTIFICATIONS_KEY }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((n: AppNotification) => (n.id === id ? { ...n, read: true } : n));
        }
        if (Array.isArray(old?.items)) {
          return {
            ...old,
            items: old.items.map((n: AppNotification) => (n.id === id ? { ...n, read: true } : n)),
          };
        }
        return old;
      });

      // Optimistically decrement count
      if (prevCount !== undefined && prevCount > 0) {
        qc.setQueryData(UNREAD_COUNT_KEY, prevCount - 1);
      }

      return { prevNotifications, prevCount };
    },
    onError: (_err, _id, context) => {
      if (context?.prevNotifications) {
        context.prevNotifications.forEach(([key, val]) => qc.setQueryData(key, val));
      }
      if (context?.prevCount !== undefined) {
        qc.setQueryData(UNREAD_COUNT_KEY, context.prevCount);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      qc.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

/**
 * Optimistic mutation: mark all notifications as read.
 * Instantly turns all notifications to read and resets unread count to 0.
 */
export function useMarkAllAsRead() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      await qc.cancelQueries({ queryKey: UNREAD_COUNT_KEY });

      const prevNotifications = qc.getQueriesData<AppNotification[]>({ queryKey: NOTIFICATIONS_KEY });
      const prevCount = qc.getQueryData<number>(UNREAD_COUNT_KEY);

      qc.setQueriesData({ queryKey: NOTIFICATIONS_KEY }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((n: AppNotification) => ({ ...n, read: true }));
        }
        if (Array.isArray(old?.items)) {
          return {
            ...old,
            items: old.items.map((n: AppNotification) => ({ ...n, read: true })),
          };
        }
        return old;
      });
      qc.setQueryData(UNREAD_COUNT_KEY, 0);

      return { prevNotifications, prevCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevNotifications) {
        context.prevNotifications.forEach(([key, val]) => qc.setQueryData(key, val));
      }
      if (context?.prevCount !== undefined) {
        qc.setQueryData(UNREAD_COUNT_KEY, context.prevCount);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      qc.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

/**
 * Optimistic mutation: delete single notification.
 */
export function useDeleteNotification() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.notifications.delete(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      await qc.cancelQueries({ queryKey: UNREAD_COUNT_KEY });

      const prevNotifications = qc.getQueriesData<AppNotification[]>({ queryKey: NOTIFICATIONS_KEY });
      const prevCount = qc.getQueryData<number>(UNREAD_COUNT_KEY);

      let wasUnread = false;
      qc.setQueriesData({ queryKey: NOTIFICATIONS_KEY }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          const target = old.find((n: AppNotification) => n.id === id);
          if (target && !target.read) wasUnread = true;
          return old.filter((n: AppNotification) => n.id !== id);
        }
        if (Array.isArray(old?.items)) {
          const target = old.items.find((n: AppNotification) => n.id === id);
          if (target && !target.read) wasUnread = true;
          return {
            ...old,
            items: old.items.filter((n: AppNotification) => n.id !== id),
          };
        }
        return old;
      });

      if (wasUnread && prevCount !== undefined && prevCount > 0) {
        qc.setQueryData(UNREAD_COUNT_KEY, prevCount - 1);
      }

      return { prevNotifications, prevCount };
    },
    onError: (_err, _id, context) => {
      if (context?.prevNotifications) {
        context.prevNotifications.forEach(([key, val]) => qc.setQueryData(key, val));
      }
      if (context?.prevCount !== undefined) {
        qc.setQueryData(UNREAD_COUNT_KEY, context.prevCount);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      qc.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}
