import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addTopicHandler } from '@/utils/stompTopicRegistry';
import type { TicketMessage } from '@/types';

/**
 * Binds a ticket screen or chat thread to the STOMP messages topic
 * (`/topic/tickets/{ticketId}/messages`).
 *
 * When a new message is broadcasted from backend after commit,
 * `onMessage` is invoked with the parsed TicketMessage.
 */
export function useTicketChatSocket(
  ticketId: string | undefined,
  onMessage: (message: TicketMessage) => void,
  onWireReady?: () => void,
) {
  const { session } = useAuth();
  const sessionUserId = session?.user.id ?? null;

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const onWireReadyRef = useRef(onWireReady);
  useEffect(() => {
    onWireReadyRef.current = onWireReady;
  }, [onWireReady]);

  useEffect(() => {
    if (!ticketId || !sessionUserId) return;

    const topic = `/topic/tickets/${ticketId}/messages`;
    console.log('[useTicketChatSocket] Registering listener for topic:', topic);
    const removeHandler = addTopicHandler<TicketMessage>(
      topic,
      (msg) => {
        console.log('[useTicketChatSocket] Incoming message on topic:', topic, msg);
        if (!msg) return;
        const msgId = msg.messageId || (msg as any).id;
        if (msgId) {
          const normalized: TicketMessage = {
            ...msg,
            messageId: String(msgId),
          };
          onMessageRef.current(normalized);
        }
      },
      () => {
        console.log('[useTicketChatSocket] Wire connection ready for topic:', topic);
        onWireReadyRef.current?.();
      },
    );

    return () => {
      removeHandler();
    };
  }, [ticketId, sessionUserId]);
}
