import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Client, type IMessage } from '@stomp/stompjs';
import { useAuth } from '@chargeops/auth';
import { useApi, resolveNotificationI18n } from '@chargeops/api';
import { type NotificationItem } from '@chargeops/ui';
import { useTranslation } from 'react-i18next';

export function resolveWsUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL?.trim();
  if (explicit) return explicit;
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  if (apiUrl && apiUrl.startsWith('http')) {
    const url = new URL(apiUrl);
    const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${url.host}/ws`;
  }
  const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${window.location.host}/ws`;
}

interface NotificationRealtimeOptions {
  context?: 'admin' | 'owner' | 'staff' | 'personal';
  onNavigate?: (path: string) => void;
}

export function useNotificationRealtime({ context = 'admin', onNavigate }: NotificationRealtimeOptions = {}) {
  const { authenticated, getToken } = useAuth();
  const queryClient = useQueryClient();
  const api = useApi();
  const { t } = useTranslation(context);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'offline' | 'connecting' | 'connected' | 'reconnecting'>('offline');
  const clientRef = useRef<Client | null>(null);

  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  const apiRef = useRef(api);
  apiRef.current = api;

  const tRef = useRef(t);
  tRef.current = t;

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissToastRef = useRef(dismissToast);
  dismissToastRef.current = dismissToast;

  useEffect(() => {
    let isMounted = true;
    const isMock = import.meta.env.VITE_USE_MOCKS !== 'false' && !import.meta.env.VITE_WS_URL;

    if (!authenticated || isMock) {
      if (isMounted) setConnectionStatus('offline');
      if (clientRef.current) {
        const client = clientRef.current;
        clientRef.current = null;
        void client.deactivate();
      }
      return;
    }

    const brokerURL = resolveWsUrl();
    if (isMounted) setConnectionStatus('connecting');

    const client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      beforeConnect: async () => {
        const token = await getTokenRef.current?.();
        if (!token) {
          if (clientRef.current) {
            const current = clientRef.current;
            clientRef.current = null;
            void current.deactivate();
          }
          if (isMounted) setConnectionStatus('offline');
          return;
        }
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      onConnect: () => {
        if (!isMounted) return;
        setConnectionStatus('connected');
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        void queryClient.invalidateQueries({ queryKey: ['tickets'] });
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        client.subscribe('/user/queue/notifications', async (message: IMessage) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(message.body);
            // 1. Invalidate caches
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['tickets'] });
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            void queryClient.invalidateQueries({ queryKey: ['stations'] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'stations'] });
            void queryClient.invalidateQueries({ queryKey: ['approvals'] });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'queue', 'pendingStations'] });

            // 2. If a new notification was created, fetch it to show a toast popup
            if (data.type === 'NOTIFICATION_CREATED') {
              try {
                const res = await apiRef.current.notifications.list({ context, size: 1 });
                const latest = Array.isArray(res) ? res[0] : res.data?.[0];
                if (latest && isMounted) {
                  const toastItem: NotificationItem = {
                    id: String(latest.id),
                    title: resolveNotificationI18n(latest.title, tRef.current),
                    subtitle: resolveNotificationI18n(latest.subtitle, tRef.current),
                    body: resolveNotificationI18n(latest.body, tRef.current),
                    tone: latest.tone ?? latest.severity ?? 'warn',
                    read: false,
                    onSelect: () => {
                      if (latest.target?.type === 'OPEN_TICKET' && latest.target.ticketId) {
                        onNavigateRef.current?.(`/tickets/${latest.target.ticketId}`);
                      } else if (latest.target?.type === 'OPEN_CASE' && latest.target.escalationId) {
                        onNavigateRef.current?.(`/tickets?escalationId=${latest.target.escalationId}`);
                      } else if (latest.target?.type === 'OPEN_STATION' && latest.target.stationId) {
                        const base = context === 'admin' ? '/admin' : context === 'owner' ? '/owner' : '';
                        onNavigateRef.current?.(`${base}/stations/${latest.target.stationId}`);
                      } else {
                        onNavigateRef.current?.('/tickets');
                      }
                      dismissToastRef.current(String(latest.id));
                    },
                  };

                  setToasts((prev) => [
                    toastItem,
                    ...prev.filter((item) => item.id !== toastItem.id).slice(0, 2),
                  ]);
                }
              } catch {
                // Ignore transient list error
              }
            }
          } catch {
            // Ignore parse errors
          }
        });
      },
      onWebSocketClose: () => {
        if (!isMounted) return;
        setConnectionStatus('reconnecting');
      },
      onWebSocketError: () => {
        if (!isMounted) return;
        setConnectionStatus('reconnecting');
      },
      onStompError: () => {
        if (!isMounted) return;
        setConnectionStatus('reconnecting');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      isMounted = false;
      if (clientRef.current) {
        const current = clientRef.current;
        clientRef.current = null;
        void current.deactivate();
      }
    };
  }, [authenticated, context, queryClient]);

  return {
    toasts,
    connectionStatus,
    dismissToast,
  };
}
