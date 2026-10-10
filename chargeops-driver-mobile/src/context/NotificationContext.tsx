import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import { useNotificationSocket, type NotificationHint } from '@/hooks/useNotificationSocket';
import {
  clearAllNotifications,
  deleteNotification as apiDeleteNotification,
  getNotifications as apiGetNotifications,
  getUnreadCount as apiGetUnreadCount,
  markAllNotificationsAsRead as apiMarkAllNotificationsAsRead,
  markNotificationAsRead as apiMarkNotificationAsRead,
  type AppNotification,
} from '@/services/notificationService';
import {
  loadCachedNotifications,
  loadCachedUnreadCount,
} from '@/services/notificationStorage';

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  bannerNotification: AppNotification | null;
  dismissBannerNotification: () => void;
  refreshNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<number>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session, initializing } = useAuth();
  const userId = session?.user.id ?? null;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [bannerNotification, setBannerNotification] = useState<AppNotification | null>(null);

  // 1. Instant hydration from persistent local storage on boot
  useEffect(() => {
    let active = true;

    async function hydrateCache() {
      const [cachedCount, cachedList] = await Promise.all([
        loadCachedUnreadCount(userId),
        loadCachedNotifications(userId),
      ]);

      if (!active) return;
      setUnreadCount(cachedCount);
      if (cachedList.length > 0) {
        setNotifications(cachedList);
      }
    }

    void hydrateCache();

    return () => {
      active = false;
    };
  }, [userId]);

  // 2. Refresh from backend when session is ready
  useEffect(() => {
    if (initializing) return;

    if (!session) {
      // Unauthenticated state
      setNotifications([]);
      setUnreadCount(0);
      setBannerNotification(null);
      return;
    }

    let active = true;

    async function syncWithBackend() {
      setLoading(true);
      try {
        const [count, list] = await Promise.all([
          apiGetUnreadCount(userId),
          apiGetNotifications(userId),
        ]);
        if (!active) return;
        setUnreadCount(count);
        setNotifications(list);
      } catch (err) {
        console.warn('[NotificationProvider] Sync with backend error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void syncWithBackend();

    return () => {
      active = false;
    };
  }, [initializing, session?.user.id, session?.tokens.accessToken]);

  // 3. Global WebSocket subscription on /user/queue/notifications
  const handleNotificationHint = useCallback(
    async (hint: NotificationHint) => {
      console.log('[NotificationProvider] Received STOMP hint:', hint);

      if (hint.type === 'NOTIFICATION_CREATED') {
        // Optimistic unread count increment
        setUnreadCount((prev) => prev + 1);

        // Fetch fresh list to retrieve complete notification payload
        try {
          const list = await apiGetNotifications(userId);
          setNotifications(list);
          const exactUnread = list.filter((n) => !n.read).length;
          setUnreadCount(exactUnread);

          if (list.length > 0 && !list[0].read) {
            setBannerNotification(list[0]);
          }
        } catch (err) {
          console.warn('[NotificationProvider] Failed to fetch notifications on created hint:', err);
        }
      } else if (
        hint.type === 'NOTIFICATION_READ' ||
        hint.type === 'NOTIFICATION_READ_ALL' ||
        hint.type === 'NOTIFICATION_DISMISSED'
      ) {
        try {
          const [count, list] = await Promise.all([
            apiGetUnreadCount(userId),
            apiGetNotifications(userId),
          ]);
          setUnreadCount(count);
          setNotifications(list);
        } catch (err) {
          console.warn('[NotificationProvider] Failed to sync on hint:', err);
        }
      }
    },
    [userId],
  );

  const handleWireReady = useCallback(() => {
    if (!session || initializing) return;
    console.log('[NotificationProvider] STOMP wire ready/reconnected, running catch-up fetch');
    void apiGetUnreadCount(userId).then(setUnreadCount).catch(() => {});
    void apiGetNotifications(userId).then(setNotifications).catch(() => {});
  }, [session, initializing, userId]);

  useNotificationSocket(handleNotificationHint, handleWireReady);

  const dismissBannerNotification = useCallback(() => {
    setBannerNotification(null);
  }, []);

  const refreshUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const count = await apiGetUnreadCount(userId);
      setUnreadCount(count);
      return count;
    } catch {
      return unreadCount;
    }
  }, [userId, unreadCount]);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const list = await apiGetNotifications(userId);
      setNotifications(list);
      const unread = list.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('[NotificationProvider] refreshNotifications failed:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(
    async (id: string): Promise<void> => {
      // Optimistic update
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        setUnreadCount(next.filter((n) => !n.read).length);
        return next;
      });

      // Also dismiss banner if it's the same notification
      setBannerNotification((current) => (current?.id === id ? null : current));

      try {
        const updated = await apiMarkNotificationAsRead(id, userId);
        setNotifications(updated);
        setUnreadCount(updated.filter((n) => !n.read).length);
      } catch (err) {
        console.warn('[NotificationProvider] markAsRead error:', err);
      }
    },
    [userId],
  );

  const markAllAsRead = useCallback(async (): Promise<void> => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setBannerNotification(null);

    try {
      const updated = await apiMarkAllNotificationsAsRead(userId);
      setNotifications(updated);
      setUnreadCount(0);
    } catch (err) {
      console.warn('[NotificationProvider] markAllAsRead error:', err);
    }
  }, [userId]);

  const deleteNotification = useCallback(
    async (id: string): Promise<void> => {
      setNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        setUnreadCount(next.filter((n) => !n.read).length);
        return next;
      });

      setBannerNotification((current) => (current?.id === id ? null : current));

      try {
        const updated = await apiDeleteNotification(id, userId);
        setNotifications(updated);
        setUnreadCount(updated.filter((n) => !n.read).length);
      } catch (err) {
        console.warn('[NotificationProvider] deleteNotification error:', err);
      }
    },
    [userId],
  );

  const clearAll = useCallback(async (): Promise<void> => {
    setNotifications([]);
    setUnreadCount(0);
    setBannerNotification(null);

    try {
      await clearAllNotifications(userId);
    } catch (err) {
      console.warn('[NotificationProvider] clearAll error:', err);
    }
  }, [userId]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      bannerNotification,
      dismissBannerNotification,
      refreshNotifications,
      refreshUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
    }),
    [
      notifications,
      unreadCount,
      loading,
      bannerNotification,
      dismissBannerNotification,
      refreshNotifications,
      refreshUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
