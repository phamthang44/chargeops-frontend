import { Client, type IMessage } from '@stomp/stompjs';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { resolveWsUrl } from '@/utils/networkHost';
import { attachWire, detachWire } from '@/utils/stompTopicRegistry';

export type StompStatus = 'disabled' | 'inactive' | 'connecting' | 'connected';

interface StompContextValue {
  status: StompStatus;
}

const StompContext = createContext<StompContextValue>({ status: 'disabled' });

/** Live STOMP connection status (diagnostics / future UI consumers). */
export function useStompStatus(): StompStatus {
  return useContext(StompContext).status;
}

/**
 * App-level singleton STOMP client for the hardware-change path
 * (`/topic/stations/{id}/hardware`).
 *
 * - One `Client` for the whole app; screens register topics through the pure
 *   `stompTopicRegistry`, which holds a single wire subscription per topic.
 * - The CONNECT frame carries `Authorization: Bearer <jwt>`; the token is
 *   fetched (and refreshed single-flight) in `beforeConnect` on every attempt.
 * - Connection only runs while authenticated (non-mock), the app is active and
 *   a valid broker URL exists; everything else is a clean deactivate.
 * - Debug logging is fully disabled: CONNECT frames contain the raw JWT.
 */
export function StompProvider({ children }: { children: ReactNode }) {
  const { session, initializing, ensureFreshAccessToken } = useAuth();
  const sessionUserId = session?.user.id ?? null;
  const isAuthenticated =
    !initializing && session !== null && !session.tokens.accessToken.startsWith('mock-');

  const [appActive, setAppActive] = useState(AppState.currentState !== 'background');
  const [connected, setConnected] = useState(false);

  const brokerURL = useMemo(() => {
    try {
      return resolveWsUrl();
    } catch {
      console.warn('[ws] Invalid EXPO_PUBLIC_WS_URL — live hardware updates are disabled.');
      return null;
    }
  }, []);

  const client = useMemo(() => {
    const instance = new Client({
      ...(brokerURL ? { brokerURL } : {}),
      reconnectDelay: 5_000,
      connectionTimeout: 20_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      // Server heartbeats are phased from broker start; tolerate up to 30 s
      // before treating the link as dead (backend test measured <= 28 s).
      heartbeatToleranceMultiplier: 3,
      // Never log frames: CONNECT carries the raw access token.
      debug: () => {},
      beforeConnect: async (pending) => {
        const token = await ensureFreshAccessToken();
        if (!token) {
          // No usable session. Deactivating before a socket exists flips the
          // client to INACTIVE synchronously, so the pending _connect bails
          // out cleanly instead of opening an anonymous socket or throwing.
          void pending.deactivate();
          return;
        }
        pending.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      onConnect: () => {
        console.log('[StompProvider] STOMP connected to broker:', brokerURL);
        setConnected(true);
        attachWire((topic, onRawBody) => {
          console.log('[StompProvider] Subscribing to topic on wire:', topic);
          const subscription = instance.subscribe(topic, (message: IMessage) => {
            onRawBody(message.body);
          });
          return () => {
            try {
              subscription.unsubscribe();
            } catch {
              // The socket may already be closed with the subscription.
            }
          };
        });
      },
      onDisconnect: () => {
        console.log('[StompProvider] STOMP disconnected');
        setConnected(false);
        detachWire();
      },
      onWebSocketClose: (evt) => {
        console.log('[StompProvider] WebSocket closed, code:', evt?.code, 'reason:', evt?.reason);
        setConnected(false);
        detachWire();
      },
      onStompError: (frame) => {
        console.warn(
          '[StompProvider] STOMP broker error:',
          frame?.headers?.message,
          frame?.body ? `| details: ${frame.body}` : ''
        );
        // Broker ERROR (e.g. rejected authorization). Spring closes the socket
        // right after; onWebSocketClose detaches and stompjs schedules a
        // reconnect with a freshly ensured token.
      },
    });
    return instance;
  }, [brokerURL, ensureFreshAccessToken]);

  const wantConnection = isAuthenticated && appActive && brokerURL !== null;

  // Mirrored so async continuations (user-switch reconnect) never act on stale state.
  const wantConnectionRef = useRef(wantConnection);
  useEffect(() => {
    wantConnectionRef.current = wantConnection;
  }, [wantConnection]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppActive(state !== 'background');
    });
    return () => subscription.remove();
  }, []);

  const previousUserIdRef = useRef(sessionUserId);
  useEffect(() => {
    if (previousUserIdRef.current === sessionUserId) return;
    const switchedUsers =
      previousUserIdRef.current !== null && sessionUserId !== null;
    previousUserIdRef.current = sessionUserId;
    if (!switchedUsers || !wantConnectionRef.current) return;
    // Account switch on the same device: tear the old session's CONNECT frame
    // down and come back with the new user's token.
    void client.deactivate().then(() => {
      if (wantConnectionRef.current) client.activate();
    });
  }, [sessionUserId, client]);

  useEffect(() => {
    if (!wantConnection) {
      setConnected(false);
      detachWire();
      void client.deactivate();
      return;
    }
    client.activate();
  }, [wantConnection, client]);

  useEffect(
    () => () => {
      setConnected(false);
      detachWire();
      void client.deactivate();
    },
    [client],
  );

  const status: StompStatus = !isAuthenticated
    ? 'disabled'
    : !wantConnection
      ? 'inactive'
      : connected
        ? 'connected'
        : 'connecting';

  const value = useMemo<StompContextValue>(() => ({ status }), [status]);
  return <StompContext.Provider value={value}>{children}</StompContext.Provider>;
}
