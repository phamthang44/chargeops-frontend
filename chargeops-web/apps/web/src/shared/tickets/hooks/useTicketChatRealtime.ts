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
}

export function useTicketChatRealtime({
  ticketId,
  roleOption,
  onMessageReceived,
}: UseTicketChatRealtimeOptions) {
  const { authenticated, getToken } = useAuth();
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!authenticated || !ticketId) {
      if (clientRef.current) {
        void clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    const brokerURL = resolveWsUrl();
    const destination = `/topic/tickets/${ticketId}/messages`;

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
        client.subscribe(destination, (msg: IMessage) => {
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

            onMessageReceived?.(incoming);
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
  }, [authenticated, getToken, ticketId, roleOption, queryClient, onMessageReceived]);
}
