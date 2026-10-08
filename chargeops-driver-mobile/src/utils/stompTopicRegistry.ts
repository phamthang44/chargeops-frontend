/**
 * Pure topic subscription registry for the hardware-change STOMP path.
 *
 * Exactly one wire-level SUBSCRIBE exists per topic; any number of consumers
 * share it. The wire subscription itself is only possible while a STOMP client
 * is connected, so the provider attaches/detaches a `subscribe` function as
 * connections come and go — entries survive a reconnect and are re-subscribed
 * (their catch-up callback fires, covering events missed while offline).
 */

export interface HardwareChangedMessage {
  v: number;
  type: 'HARDWARE_CHANGED';
}

export type TopicHandler = (message: HardwareChangedMessage) => void;
export type WireUnsubscribe = () => void;
/** Creates a wire-level subscription; only called while connected. */
export type WireSubscribe = (topic: string, onRawBody: (rawBody: string) => void) => WireUnsubscribe;
/** Invoked every time the wire attaches (connect/reconnect) to cover missed events. */
export type OnWireReady = () => void;

interface TopicEntry {
  handlers: Set<TopicHandler>;
  onWireReady?: OnWireReady;
  wireUnsubscribe?: WireUnsubscribe;
}

const entries = new Map<string, TopicEntry>();
let wire: WireSubscribe | null = null;

const HARDWARE_CHANGED_TYPE = 'HARDWARE_CHANGED';
const PROTOCOL_VERSION = 1;

function parseHardwareMessage(rawBody: string): HardwareChangedMessage | null {
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as { v?: unknown }).v === PROTOCOL_VERSION &&
      (parsed as { type?: unknown }).type === HARDWARE_CHANGED_TYPE
    ) {
      return { v: PROTOCOL_VERSION, type: HARDWARE_CHANGED_TYPE };
    }
    return null;
  } catch {
    return null;
  }
}

function subscribeOnWire(topic: string, entry: TopicEntry): void {
  if (!wire || entry.wireUnsubscribe) return;
  try {
    entry.wireUnsubscribe = wire(topic, (rawBody) => {
      const message = parseHardwareMessage(rawBody);
      if (!message) return;
      for (const handler of Array.from(entry.handlers)) {
        try {
          handler(message);
        } catch {
          // One broken consumer must not break the shared subscription.
        }
      }
    });
  } catch {
    // Subscribe failed (e.g. socket closed mid-flight); retried on next attach.
    entry.wireUnsubscribe = undefined;
  }
}

/**
 * Registers a handler for a topic. Returns an idempotent cleanup function.
 * `onWireReady` is NOT called here — the caller (screen focus) performs its
 * own initial fetch; it is invoked only when the wire connects/reconnects so
 * events missed during an outage trigger a catch-up refetch.
 */
export function addTopicHandler(
  topic: string,
  handler: TopicHandler,
  onWireReady?: OnWireReady,
): () => void {
  let entry = entries.get(topic);
  if (!entry) {
    entry = { handlers: new Set(), onWireReady };
    entries.set(topic, entry);
  } else if (onWireReady && !entry.onWireReady) {
    entry.onWireReady = onWireReady;
  }
  entry.handlers.add(handler);
  subscribeOnWire(topic, entry);

  let removed = false;
  return () => {
    if (removed) return;
    removed = true;
    const current = entries.get(topic);
    if (!current) return;
    current.handlers.delete(handler);
    if (current.handlers.size === 0) {
      if (current.wireUnsubscribe) {
        try {
          current.wireUnsubscribe();
        } catch {
          // The socket may already be gone with the subscription.
        }
      }
      entries.delete(topic);
    }
  };
}

/** Attaches the active wire connection and (re)subscribes every known topic. */
export function attachWire(subscribe: WireSubscribe): void {
  wire = subscribe;
  for (const [topic, entry] of entries) {
    subscribeOnWire(topic, entry);
    try {
      entry.onWireReady?.();
    } catch {
      // Catch-up refetch failures are already handled by the coordinator.
    }
  }
}

/** Detaches the wire connection; entries are kept for the next attach. */
export function detachWire(): void {
  wire = null;
  for (const entry of entries.values()) {
    if (entry.wireUnsubscribe) {
      try {
        entry.wireUnsubscribe();
      } catch {
        // Socket is already closed.
      }
      entry.wireUnsubscribe = undefined;
    }
  }
}

/** Drops every entry and the wire. Intended for tests/session resets. */
export function clearRegistry(): void {
  detachWire();
  entries.clear();
}
