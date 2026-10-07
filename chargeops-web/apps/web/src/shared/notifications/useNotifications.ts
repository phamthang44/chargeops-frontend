import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  type AppNotification,
  type NotificationListParams,
  type NotificationUnreadCountParams,
  type NotificationMutationParams,
  type NotificationPageMeta,
} from '@chargeops/api';
import { useAuth } from '@chargeops/auth';

export const NOTIFICATIONS_BASE_KEY = 'notifications' as const;

export type NotificationFeedData = AppNotification[] & { meta?: NotificationPageMeta };

/**
 * Returns a stable query prefix scoped to identity and portal context.
 */
export function getNotificationQueryPrefix(identityId?: string, context?: string) {
  return [NOTIFICATIONS_BASE_KEY, identityId ?? 'anonymous', context ?? 'personal'] as const;
}

/**
 * Returns a deterministic query key scoped by identity, portal context, station, and normalized filters.
 */
export function getNotificationsQueryKey(identityId?: string, params?: NotificationListParams) {
  return [
    NOTIFICATIONS_BASE_KEY,
    identityId ?? 'anonymous',
    params?.context ?? 'personal',
    params?.stationId ?? 'all',
    {
      category: params?.category ?? 'all',
      unread: Boolean(params?.unread || params?.unreadOnly),
      page: params?.page ?? 1,
      size: params?.size ?? 20,
    },
  ] as const;
}

/**
 * Returns query key for unread notifications count badge.
 */
export function getUnreadCountQueryKey(identityId?: string, params?: NotificationUnreadCountParams) {
  return [
    NOTIFICATIONS_BASE_KEY,
    identityId ?? 'anonymous',
    params?.context ?? 'personal',
    params?.stationId ?? 'all',
    'unread-count',
    params?.category ?? 'all',
  ] as const;
}

/**
 * Lifecycle hook: automatically clears stale TanStack cache when identity changes or on logout.
 */
export function useNotificationsLifecycle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lastUserRef = useRef<string | undefined>(user?.id);

  useEffect(() => {
    if (lastUserRef.current && lastUserRef.current !== user?.id) {
      void qc.cancelQueries({ queryKey: [NOTIFICATIONS_BASE_KEY, lastUserRef.current] });
      qc.removeQueries({ queryKey: [NOTIFICATIONS_BASE_KEY, lastUserRef.current] });
    }
    lastUserRef.current = user?.id;
  }, [user?.id, qc]);
}

/**
 * Hook to fetch notifications feed scoped by identity and context.
 * Returns an array of AppNotification with .meta attached for pagination.
 */
export function useNotifications(params?: NotificationListParams) {
  const api = useApi();
  const { user, authenticated } = useAuth();
  const identityId = user?.id;
  useNotificationsLifecycle();

  const query = useQuery({
    queryKey: getNotificationsQueryKey(identityId, params),
    queryFn: async (): Promise<NotificationFeedData> => {
      const res = await api.notifications.list(params);
      const items = Array.isArray(res) ? res : res.data ?? [];
      const meta = Array.isArray(res) ? undefined : res.meta;
      return Object.assign([...items], { meta });
    },
    enabled: authenticated && Boolean(identityId),
    staleTime: 30_000,
    refetchInterval: authenticated ? 30_000 : false,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    items: query.data ?? [],
    meta: query.data?.meta,
  };
}

/**
 * Hook to fetch unread notifications count for the Bell Badge.
 */
export function useUnreadCount(params?: NotificationUnreadCountParams) {
  const api = useApi();
  const { user, authenticated } = useAuth();
  const identityId = user?.id;

  return useQuery({
    queryKey: getUnreadCountQueryKey(identityId, params),
    queryFn: () => api.notifications.unreadCount(params),
    enabled: authenticated && Boolean(identityId),
    staleTime: 15_000,
    refetchInterval: authenticated ? 30_000 : false,
    refetchOnWindowFocus: true,
  });
}

/**
 * Optimistic mutation: mark single notification as read.
 * Scoped strictly to the active identity and context prefix.
 */
export function useMarkAsRead(scope?: NotificationMutationParams) {
  const api = useApi();
  const { user } = useAuth();
  const qc = useQueryClient();
  const identityId = user?.id;

  return useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id, scope),
    onMutate: async (id: string) => {
      const prefix = getNotificationQueryPrefix(identityId, scope?.context);
      const countPrefix = [
        NOTIFICATIONS_BASE_KEY,
        identityId ?? 'anonymous',
        scope?.context ?? 'personal',
        scope?.stationId ?? 'all',
        'unread-count',
      ] as const;

      await qc.cancelQueries({ queryKey: prefix });
      await qc.cancelQueries({ queryKey: countPrefix });

      const prevNotifications = qc.getQueriesData<NotificationFeedData>({ queryKey: prefix });
      const prevCounts = qc.getQueriesData<number>({ queryKey: countPrefix });

      // Optimistically mark as read across all matching queries under this identity and context
      qc.setQueriesData({ queryKey: prefix }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return Object.assign(
          old.map((n: AppNotification) => (n.id === id ? { ...n, read: true } : n)),
          { meta: (old as any).meta },
        );
      });

      // Optimistically decrement count
      qc.setQueriesData({ queryKey: countPrefix }, (oldCount: any) => {
        if (typeof oldCount === 'number' && oldCount > 0) return oldCount - 1;
        return oldCount;
      });

      return { prevNotifications, prevCounts, prefix, countPrefix };
    },
    onError: (_err, _id, context) => {
      if (context?.prevNotifications) {
        context.prevNotifications.forEach(([key, val]) => qc.setQueryData(key, val));
      }
      if (context?.prevCounts) {
        context.prevCounts.forEach(([key, val]) => qc.setQueryData(key, val));
      }
    },
    onSettled: (_data, _err, _id, context) => {
      if (context?.prefix) {
        qc.invalidateQueries({ queryKey: context.prefix });
      }
      if (context?.countPrefix) {
        qc.invalidateQueries({ queryKey: context.countPrefix });
      }
    },
  });
}

/**
 * Optimistic mutation: mark all notifications as read.
 * Scoped strictly to the active identity and context prefix.
 */
export function useMarkAllAsRead(scope?: NotificationMutationParams) {
  const api = useApi();
  const { user } = useAuth();
  const qc = useQueryClient();
  const identityId = user?.id;

  return useMutation({
    mutationFn: () => api.notifications.markAllAsRead(scope),
    onMutate: async () => {
      const prefix = getNotificationQueryPrefix(identityId, scope?.context);
      const countPrefix = [
        NOTIFICATIONS_BASE_KEY,
        identityId ?? 'anonymous',
        scope?.context ?? 'personal',
        scope?.stationId ?? 'all',
        'unread-count',
      ] as const;

      await qc.cancelQueries({ queryKey: prefix });
      await qc.cancelQueries({ queryKey: countPrefix });

      const prevNotifications = qc.getQueriesData<NotificationFeedData>({ queryKey: prefix });
      const prevCounts = qc.getQueriesData<number>({ queryKey: countPrefix });

      qc.setQueriesData({ queryKey: prefix }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return Object.assign(
          old.map((n: AppNotification) => ({ ...n, read: true })),
          { meta: (old as any).meta },
        );
      });

      qc.setQueriesData({ queryKey: countPrefix }, () => 0);

      return { prevNotifications, prevCounts, prefix, countPrefix };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevNotifications) {
        context.prevNotifications.forEach(([key, val]) => qc.setQueryData(key, val));
      }
      if (context?.prevCounts) {
        context.prevCounts.forEach(([key, val]) => qc.setQueryData(key, val));
      }
    },
    onSettled: (_data, _err, _vars, context) => {
      if (context?.prefix) {
        qc.invalidateQueries({ queryKey: context.prefix });
      }
      if (context?.countPrefix) {
        qc.invalidateQueries({ queryKey: context.countPrefix });
      }
    },
  });
}

/**
 * Optimistic mutation: dismiss single notification.
 * Calls backend PATCH /notifications/{id}/dismiss and removes from feed.
 */
export function useDismissNotification(scope?: NotificationMutationParams) {
  const api = useApi();
  const { user } = useAuth();
  const qc = useQueryClient();
  const identityId = user?.id;

  return useMutation({
    mutationFn: (id: string) => api.notifications.dismiss(id, scope),
    onMutate: async (id: string) => {
      const prefix = getNotificationQueryPrefix(identityId, scope?.context);
      const countPrefix = [
        NOTIFICATIONS_BASE_KEY,
        identityId ?? 'anonymous',
        scope?.context ?? 'personal',
        scope?.stationId ?? 'all',
        'unread-count',
      ] as const;

      await qc.cancelQueries({ queryKey: prefix });
      await qc.cancelQueries({ queryKey: countPrefix });

      const prevNotifications = qc.getQueriesData<NotificationFeedData>({ queryKey: prefix });
      const prevCounts = qc.getQueriesData<number>({ queryKey: countPrefix });

      let wasUnread = false;
      qc.setQueriesData({ queryKey: prefix }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        const target = old.find((n: AppNotification) => n.id === id);
        if (target && !target.read) wasUnread = true;
        return Object.assign(
          old.filter((n: AppNotification) => n.id !== id),
          { meta: (old as any).meta },
        );
      });

      if (wasUnread) {
        qc.setQueriesData({ queryKey: countPrefix }, (oldCount: any) => {
          if (typeof oldCount === 'number' && oldCount > 0) return oldCount - 1;
          return oldCount;
        });
      }

      return { prevNotifications, prevCounts, prefix, countPrefix };
    },
    onError: (_err, _id, context) => {
      if (context?.prevNotifications) {
        context.prevNotifications.forEach(([key, val]) => qc.setQueryData(key, val));
      }
      if (context?.prevCounts) {
        context.prevCounts.forEach(([key, val]) => qc.setQueryData(key, val));
      }
    },
    onSettled: (_data, _err, _id, context) => {
      if (context?.prefix) {
        qc.invalidateQueries({ queryKey: context.prefix });
      }
      if (context?.countPrefix) {
        qc.invalidateQueries({ queryKey: context.countPrefix });
      }
    },
  });
}

/**
 * Backward-compatible alias for useDismissNotification.
 */
export const useDeleteNotification = useDismissNotification;
