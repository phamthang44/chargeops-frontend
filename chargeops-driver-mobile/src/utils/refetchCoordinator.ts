/**
 * Pure refetch coordinator: funnels every refresh trigger (socket hint, focus,
 * pull-to-refresh, 10-minute safety-net poll) through a single throttled
 * pipeline so the app never issues more than one refetch per throttle window,
 * while `requestAndWait()` still guarantees a refetch that STARTED after the
 * call — a refetch already in flight may have read data older than the event
 * that triggered this call.
 */

export interface RefetchCoordinatorOptions {
  /** Minimum gap between two refetch starts. Default 300 ms. */
  throttleMs?: number;
  /** Injectable clock for tests. */
  now?: () => number;
  /** Injectable timers for tests. */
  setTimer?: (callback: () => void, delayMs: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export interface RefetchCoordinator {
  /** Fire-and-forget request; throttled and coalesced. */
  request(): void;
  /** Resolves once a refetch started after this call has completed. */
  requestAndWait(): Promise<void>;
  /** Busy = a run is in flight or scheduled. */
  isBusy(): boolean;
  subscribeBusy(listener: (busy: boolean) => void): () => void;
  dispose(): void;
}

interface Waiter {
  threshold: number;
  resolve: () => void;
}

export function createRefetchCoordinator(
  run: () => void | Promise<void>,
  options: RefetchCoordinatorOptions = {},
): RefetchCoordinator {
  const throttleMs = options.throttleMs ?? 300;
  const now = options.now ?? Date.now;
  const setTimer =
    options.setTimer ??
    ((callback: () => void, delayMs: number): unknown => setTimeout(callback, delayMs));
  const clearTimer =
    options.clearTimer ??
    ((handle: unknown): void => clearTimeout(handle as ReturnType<typeof setTimeout>));

  let disposed = false;
  let running = false;
  let dirty = false;
  let timerHandle: unknown = null;
  let lastStartedAt = Number.NEGATIVE_INFINITY;
  let startedCount = 0;
  let completedCount = 0;
  let waiters: Waiter[] = [];
  let busyListeners = new Set<(busy: boolean) => void>();
  let lastNotifiedBusy = false;

  function isBusy(): boolean {
    return running || timerHandle !== null;
  }

  function notifyBusy(): void {
    const busy = isBusy();
    if (busy === lastNotifiedBusy) return;
    lastNotifiedBusy = busy;
    for (const listener of Array.from(busyListeners)) {
      try {
        listener(busy);
      } catch {
        // Listener errors must not break the pipeline.
      }
    }
  }

  function resolveWaiters(): void {
    if (waiters.length === 0) return;
    const still: Waiter[] = [];
    for (const waiter of waiters) {
      if (completedCount > waiter.threshold) waiter.resolve();
      else still.push(waiter);
    }
    waiters = still;
  }

  function clearScheduled(): void {
    if (timerHandle !== null) {
      clearTimer(timerHandle);
      timerHandle = null;
    }
  }

  function start(): void {
    if (disposed) return;
    if (running) {
      dirty = true;
      return;
    }
    running = true;
    startedCount += 1;
    lastStartedAt = now();
    notifyBusy();

    const done = (): void => {
      completedCount += 1;
      running = false;
      resolveWaiters();
      if (dirty && !disposed) {
        dirty = false;
        scheduleThrottled();
      }
      notifyBusy();
    };

    try {
      const result = run();
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).then(done, done);
      } else {
        done();
      }
    } catch {
      done();
    }
  }

  function scheduleThrottled(): void {
    if (disposed || timerHandle !== null || running) return;
    const waitMs = Math.max(0, lastStartedAt + throttleMs - now());
    if (waitMs <= 0) {
      start();
      return;
    }
    timerHandle = setTimer(() => {
      timerHandle = null;
      start();
    }, waitMs);
    notifyBusy();
  }

  function request(): void {
    if (disposed) return;
    if (running) {
      dirty = true;
      return;
    }
    scheduleThrottled();
  }

  function requestAndWait(): Promise<void> {
    if (disposed) return Promise.resolve();
    const threshold = startedCount;
    request();
    if (completedCount > threshold) return Promise.resolve();
    return new Promise<void>((resolve) => {
      waiters.push({ threshold, resolve });
    });
  }

  function subscribeBusy(listener: (busy: boolean) => void): () => void {
    busyListeners.add(listener);
    return () => {
      busyListeners.delete(listener);
    };
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    clearScheduled();
    dirty = false;
    const pending = waiters;
    waiters = [];
    for (const waiter of pending) waiter.resolve();
    busyListeners = new Set();
  }

  return { request, requestAndWait, isBusy, subscribeBusy, dispose };
}
