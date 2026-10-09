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
  const clientRef = useRef<Client | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    if (!authenticated) {
      if (clientRef.current) {
        void clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    const brokerURL = resolveWsUrl();

    const client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      beforeConnect: async () => {
        const token = await getToken?.();
        if (token) {
          client.connectHeaders = { Authorization: `Bearer ${token}` };
        }
      },
      onConnect: () => {
        client.subscribe('/user/queue/notifications', async (message: IMessage) => {
          try {
            const data = JSON.parse(message.body);
            // 1. Invalidate caches
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['tickets'] });
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });

            // 2. If a new notification was created, fetch it to show a toast popup
            if (data.type === 'NOTIFICATION_CREATED') {
              try {
                const res = await api.notifications.list({ context, size: 1 });
                const latest = Array.isArray(res) ? res[0] : res.data?.[0];
                if (latest) {
                  const toastItem: NotificationItem = {
                    id: String(latest.id),
                    title: resolveNotificationI18n(latest.title, t),
                    subtitle: resolveNotificationI18n(latest.subtitle, t),
                    body: resolveNotificationI18n(latest.body, t),
                    tone: latest.tone ?? latest.severity ?? 'warn',
                    read: false,
                    onSelect: () => {
                      if (latest.target?.type === 'OPEN_TICKET' && latest.target.ticketId) {
                        onNavigate?.(`/tickets/${latest.target.ticketId}`);
                      } else if (latest.target?.type === 'OPEN_CASE' && latest.target.escalationId) {
                        onNavigate?.(`/tickets?escalationId=${latest.target.escalationId}`);
                      } else {
                        onNavigate?.('/tickets');
                      }
                      dismissToast(String(latest.id));
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
    });

    client.activate();
    clientRef.current = client;

    return () => {
      void client.deactivate();
      clientRef.current = null;
    };
  }, [authenticated, getToken, queryClient, context, api, t, onNavigate, dismissToast]);

  return {
    toasts,
    dismissToast,
  };
}
