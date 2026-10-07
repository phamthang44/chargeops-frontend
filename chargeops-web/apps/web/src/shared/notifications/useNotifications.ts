import { useEffect, useRef, useMemo } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
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
 * Returns deterministic infinite query key scoped by identity, portal context, station, and normalized filters.
 */
export function getInfiniteNotificationsQueryKey(identityId?: string, params?: NotificationListParams) {
  return [
    NOTIFICATIONS_BASE_KEY,
    identityId ?? 'anonymous',
    params?.context ?? 'personal',
    params?.stationId ?? 'all',
    'infinite',
    {
      category: params?.category ?? 'all',
      unread: Boolean(params?.unread || params?.unreadOnly),
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
 * Hook to fetch multi-page/infinite notifications feed scoped by identity and context.
 * Native TanStack Query cache management — survives re-renders and avoids local accumulated state desync.
 */
export function useInfiniteNotifications(params?: NotificationListParams) {
  const api = useApi();
  const { user, authenticated } = useAuth();
  const identityId = user?.id;
  useNotificationsLifecycle();

  const query = useInfiniteQuery<
    NotificationFeedData,
    Error,
    InfiniteData<NotificationFeedData, number>,
    readonly unknown[],
    number
  >({
    queryKey: getInfiniteNotificationsQueryKey(identityId, params),
    queryFn: async ({ pageParam = 1 }): Promise<NotificationFeedData> => {
      const res = await api.notifications.list({ ...params, page: pageParam });
      const items = Array.isArray(res) ? res : res.data ?? [];
      const meta = Array.isArray(res) ? undefined : res.meta;
      return Object.assign([...items], { meta });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      if (meta?.hasNextPage) return (meta.page ?? 1) + 1;
      if (meta && typeof meta.page === 'number' && typeof meta.totalPages === 'number' && meta.page < meta.totalPages) {
        return meta.page + 1;
      }
      return undefined;
    },
    enabled: authenticated && Boolean(identityId),
    staleTime: 30_000,
    refetchInterval: authenticated ? 30_000 : false,
    refetchOnWindowFocus: true,
  });

  const flatItems = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) => (Array.isArray(page) ? page : []));
  }, [query.data?.pages]);

  const lastMeta = query.data?.pages?.[query.data.pages.length - 1]?.meta;

  return {
    ...query,
    items: flatItems,
    meta: lastMeta,
    hasMore: Boolean(query.hasNextPage),
    loadMore: () => {
      void query.fetchNextPage();
    },
    isLoadingMore: query.isFetchingNextPage,
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
 * Internal helper to mutate both flat query arrays and infinite query page structures.
 */
function applyToQueryCache<T extends AppNotification>(
  old: any,
  updater: (item: T) => T | null,
): any {
  if (!old) return old;
  // Handle infinite query shape ({ pages: [...], pageParams: [...] })
  if (old.pages && Array.isArray(old.pages)) {
    return {
      ...old,
      pages: old.pages.map((page: any) => {
        if (!Array.isArray(page)) return page;
        const updated = page
          .map((item: T) => updater(item))
          .filter((item: T | null): item is T => item !== null);
        return Object.assign(updated, { meta: (page as any).meta });
      }),
    };
  }
  // Handle standard flat list shape (AppNotification[] & { meta?: ... })
  if (Array.isArray(old)) {
    const updated = old
      .map((item: T) => updater(item))
      .filter((item: T | null): item is T => item !== null);
    return Object.assign(updated, { meta: (old as any).meta });
  }
  return old;
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

      // Optimistically mark as read across all matching queries (flat and infinite)
      qc.setQueriesData({ queryKey: prefix }, (old: any) =>
        applyToQueryCache(old, (n) => (n.id === id ? { ...n, read: true } : n)),
      );

      // Refetch server counts instead of guessing a decrement.

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
 * Supports optional category scoping (e.g. read all booking notices only).
 */
export function useMarkAllAsRead(scope?: NotificationMutationParams) {
  const api = useApi();
  const { user } = useAuth();
  const qc = useQueryClient();
  const identityId = user?.id;

  return useMutation({
    mutationFn: (overrideCategory?: string | void) => {
      const cat = typeof overrideCategory === 'string' ? overrideCategory : undefined;
      const finalScope = cat
        ? { ...scope, category: cat }
        : scope;
      return api.notifications.markAllAsRead(finalScope);
    },
    onMutate: async (overrideCategory?: string | void) => {
      const targetCategory = (typeof overrideCategory === 'string' ? overrideCategory : undefined) ?? scope?.category;
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

      qc.setQueriesData({ queryKey: prefix }, (old: any) =>
        applyToQueryCache(old, (n) => {
          if (!targetCategory || targetCategory === 'all' || n.category === targetCategory) {
            return { ...n, read: true };
          }
          return n;
        }),
      );

      // Concurrent notices may remain unread; refetch the authoritative count.

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

      qc.setQueriesData({ queryKey: prefix }, (old: any) =>
        applyToQueryCache(old, (n) => (n.id === id ? null : n)),
      );

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
