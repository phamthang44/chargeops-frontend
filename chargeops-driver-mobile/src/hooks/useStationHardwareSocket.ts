import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { createRefetchCoordinator, type RefetchCoordinator } from '@/utils/refetchCoordinator';
import { addTopicHandler } from '@/utils/stompTopicRegistry';

const HARDWARE_TOPIC_PREFIX = '/topic/stations/';
/** Safety net: slow polling only while this screen is focused and the app is active. */
const SAFETY_NET_POLL_MS = 10 * 60 * 1000;

export interface StationHardwareSocketApi {
  /** Fire-and-forget refetch (socket hint / wire catch-up / safety-net poll). Throttled. */
  requestRefetch: () => void;
  /** Resolves when a refetch started after this call has completed (pull-to-refresh). */
  requestManualRefetch: () => Promise<void>;
}

/**
 * Binds a station screen to the hardware-change STOMP path.
 *
 * While the screen is focused it subscribes to
 * `/topic/stations/{stationId}/hardware` and funnels every trigger — socket
 * hint, wire (re)connect catch-up, safety-net poll — through one throttled
 * refetch coordinator, so simultaneous triggers collapse into a single REST
 * refetch. `refetch` is read through a ref so callers may pass an inline
 * callback without resubscribing.
 */
export function useStationHardwareSocket(
  stationId: string,
  refetch: () => void | Promise<void>,
): StationHardwareSocketApi {
  const { session } = useAuth();
  const sessionUserId = session?.user.id ?? null;

  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const coordinatorRef = useRef<RefetchCoordinator | null>(null);
  const getCoordinator = useCallback((): RefetchCoordinator => {
    if (!coordinatorRef.current) {
      coordinatorRef.current = createRefetchCoordinator(() => refetchRef.current());
    }
    return coordinatorRef.current;
  }, []);

  useEffect(
    () => () => {
      coordinatorRef.current?.dispose();
      coordinatorRef.current = null;
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (!stationId || !sessionUserId) return;

      const topic = `${HARDWARE_TOPIC_PREFIX}${stationId}/hardware`;
      const removeTopic = addTopicHandler(
        topic,
        () => getCoordinator().request(),
        () => getCoordinator().request(),
      );

      let disposed = false;
      let pollTimer: ReturnType<typeof setTimeout> | null = null;
      let appIsActive = AppState.currentState !== 'background';

      const armPoll = () => {
        if (pollTimer) clearTimeout(pollTimer);
        pollTimer = setTimeout(() => {
          pollTimer = null;
          if (disposed) return;
          if (appIsActive) getCoordinator().request();
          armPoll();
        }, SAFETY_NET_POLL_MS);
      };
      armPoll();

      const appStateSubscription = AppState.addEventListener('change', (state) => {
        const nowActive = state !== 'background';
        if (nowActive === appIsActive) return;
        appIsActive = nowActive;
        if (!nowActive) {
          // Backgrounded: stop the safety-net timer entirely, no fetches.
          if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
          }
        } else if (!disposed) {
          // Foreground: catch up through the same throttled pipeline.
          getCoordinator().request();
          armPoll();
        }
      });

      return () => {
        disposed = true;
        if (pollTimer) clearTimeout(pollTimer);
        appStateSubscription.remove();
        removeTopic();
      };
    }, [stationId, sessionUserId, getCoordinator]),
  );

  const requestRefetch = useCallback(() => {
    getCoordinator().request();
  }, [getCoordinator]);

  const requestManualRefetch = useCallback(
    () => getCoordinator().requestAndWait(),
    [getCoordinator],
  );

  return { requestRefetch, requestManualRefetch };
}
