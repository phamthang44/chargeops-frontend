import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addTopicHandler } from '@/utils/stompTopicRegistry';

export interface NotificationHint {
  v: number;
  eventId: string;
  type: 'NOTIFICATION_CREATED' | 'NOTIFICATION_READ' | 'NOTIFICATION_DISMISSED' | 'NOTIFICATION_READ_ALL' | string;
  ref?: string;
}

/**
 * Subscribes to the authenticated user's private notification queue
 * (`/user/queue/notifications`) via STOMP WebSocket.
 *
 * When an event occurs (e.g. ticket assigned, ticket resolved, booking alert),
 * the server emits a lightweight hint. Consumers can trigger background refetches
 * or update badge counts immediately.
 */
export function useNotificationSocket(
  onNotificationHint: (hint: NotificationHint) => void,
  onWireReady?: () => void,
) {
  const { session } = useAuth();
  const sessionUserId = session?.user.id ?? null;

  const onHintRef = useRef(onNotificationHint);
  useEffect(() => {
    onHintRef.current = onNotificationHint;
  }, [onNotificationHint]);

  const onWireReadyRef = useRef(onWireReady);
  useEffect(() => {
    onWireReadyRef.current = onWireReady;
  }, [onWireReady]);

  useEffect(() => {
    if (!sessionUserId) return;

    const topic = '/user/queue/notifications';
    const removeHandler = addTopicHandler<NotificationHint>(
      topic,
      (hint) => {
        if (hint) {
          onHintRef.current(hint);
        }
      },
      () => {
        onWireReadyRef.current?.();
      },
    );

    return () => {
      removeHandler();
    };
  }, [sessionUserId]);
}
