import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Client, type IMessage } from '@stomp/stompjs';
import { useAuth } from '@chargeops/auth';
import { resolveWsUrl } from '../../notifications/useNotificationRealtime';
import type { TicketMessage } from '@chargeops/api';

export interface UseTicketChatRealtimeOptions {
  ticketId?: string;
  roleOption?: string;
  onMessageReceived?: (message: TicketMessage) => void;
  onConnectionStatusChange?: (status: 'offline' | 'connecting' | 'connected' | 'reconnecting') => void;
}

export function useTicketChatRealtime({
  ticketId,
  roleOption,
  onMessageReceived,
  onConnectionStatusChange,
}: UseTicketChatRealtimeOptions) {
  const { authenticated, getToken } = useAuth();
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);

  const onMessageReceivedRef = useRef(onMessageReceived);
  onMessageReceivedRef.current = onMessageReceived;

  const onConnectionStatusChangeRef = useRef(onConnectionStatusChange);
  onConnectionStatusChangeRef.current = onConnectionStatusChange;

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    let isMounted = true;
    const isMock = import.meta.env.VITE_USE_MOCKS !== 'false' && !import.meta.env.VITE_WS_URL;

    if (!authenticated || !ticketId || isMock) {
      if (isMounted) onConnectionStatusChangeRef.current?.('offline');
      if (clientRef.current) {
        const client = clientRef.current;
        clientRef.current = null;
        void client.deactivate();
      }
      return;
    }

    const brokerURL = resolveWsUrl();
    if (isMounted) onConnectionStatusChangeRef.current?.('connecting');
    const destination = `/topic/tickets/${ticketId}/messages`;

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
          if (isMounted) onConnectionStatusChangeRef.current?.('offline');
          return;
        }
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      onConnect: () => {
        if (!isMounted) return;
        onConnectionStatusChangeRef.current?.('connected');
        void queryClient.invalidateQueries({ queryKey: ['tickets', 'messages', ticketId] });
        client.subscribe(destination, (msg: IMessage) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(msg.body);
            const incoming: TicketMessage = {
              id: String(data.messageId || data.id),
              messageId: String(data.messageId || data.id),
              ticketId,
              authorId: data.authorId ? String(data.authorId) : undefined,
              authorDisplayName: data.authorDisplayName,
              authorKind: data.authorKind,
              body: data.body,
              createdAt: data.createdAt,
            };

            // 1. Cập nhật trực tiếp cache danh sách tin nhắn để UI phản hồi tức thì
            queryClient.setQueryData<TicketMessage[]>(
              ['tickets', 'messages', ticketId, roleOption],
              (old) => {
                if (!old) return [incoming];
                const alreadyExists = old.some(
                  (m) =>
                    (m.id && m.id === incoming.id) ||
                    (m.messageId && m.messageId === incoming.messageId)
                );
                if (alreadyExists) return old;
                return [...old, incoming];
              }
            );

            // 2. Invalidate queries để đảm bảo tính nhất quán (ticket detail, unread counts, etc.)
            void queryClient.invalidateQueries({ queryKey: ['tickets', 'messages', ticketId] });
            void queryClient.invalidateQueries({ queryKey: ['tickets', 'get', ticketId] });

            onMessageReceivedRef.current?.(incoming);
          } catch {
            // Ignore parse errors
          }
        });
      },
      onWebSocketClose: () => {
        if (!isMounted) return;
        onConnectionStatusChangeRef.current?.('reconnecting');
      },
      onWebSocketError: () => {
        if (!isMounted) return;
        onConnectionStatusChangeRef.current?.('reconnecting');
      },
      onStompError: () => {
        if (!isMounted) return;
        onConnectionStatusChangeRef.current?.('reconnecting');
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
  }, [authenticated, ticketId, roleOption, queryClient]);
}
