import {
  addTopicHandler,
  attachWire,
  clearRegistry,
  detachWire,
  type WireUnsubscribe,
} from '../src/utils/stompTopicRegistry.ts';
import { createRefetchCoordinator } from '../src/utils/refetchCoordinator.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

/** Drain pending microtasks (promise callbacks) without advancing fake time. */
async function flush(times = 4): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

class FakeClock {
  t = 0;
  private nextId = 1;
  private timers: Array<{ id: number; at: number; cb: () => void }> = [];

  now = (): number => this.t;

  setTimer = (cb: () => void, delayMs: number): unknown => {
    const id = this.nextId;
    this.nextId += 1;
    this.timers.push({ id, at: this.t + delayMs, cb });
    return id;
  };

  clearTimer = (handle: unknown): void => {
    this.timers = this.timers.filter((timer) => timer.id !== handle);
  };

  pendingCount(): number {
    return this.timers.length;
  }

  advance(ms: number): void {
    const target = this.t + ms;
    for (;;) {
      const due = this.timers
        .filter((timer) => timer.at <= target)
        .sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      this.timers = this.timers.filter((timer) => timer.id !== due.id);
      this.t = due.at;
      due.cb();
    }
    this.t = target;
  }
}

interface WireRecord {
  topic: string;
  onRaw: (body: string) => void;
  active: boolean;
}

function createFakeWire() {
  const records: WireRecord[] = [];
  const wire = (topic: string, onRaw: (body: string) => void): WireUnsubscribe => {
    const record: WireRecord = { topic, onRaw, active: true };
    records.push(record);
    return () => {
      record.active = false;
    };
  };
  const activeSubs = (topic?: string): WireRecord[] =>
    records.filter((r) => r.active && (!topic || r.topic === topic));
  const emit = (topic: string, body: string): void => {
    for (const record of activeSubs(topic)) record.onRaw(body);
  };
  return { wire, records, activeSubs, emit };
}

const VALID_HINT = '{"v":1,"type":"HARDWARE_CHANGED"}';

async function testRegistry(): Promise<void> {
  console.log('--- stompTopicRegistry ---');

  // 1. Add before the wire exists: no subscription yet; attach subscribes + catch-up fires.
  clearRegistry();
  {
    const { wire, activeSubs } = createFakeWire();
    let readyCount = 0;
    let received = 0;
    const remove = addTopicHandler('/topic/stations/s1/hardware', () => {
      received += 1;
    }, () => {
      readyCount += 1;
    });
    assert(activeSubs().length === 0, 'no wire subscription before attach');
    attachWire(wire);
    assert(activeSubs().length === 1, 'attach creates exactly one wire subscription');
    assert(readyCount === 1, 'onWireReady fires on attach (catch-up refetch)');
    remove();
    assert(activeSubs().length === 0, 'last handler cleanup unsubscribes the wire');
  }

  // 2. Two handlers share one wire subscription; both receive valid hints.
  clearRegistry();
  {
    const { wire, activeSubs, emit } = createFakeWire();
    let a = 0;
    let b = 0;
    const removeA = addTopicHandler('/topic/stations/s1/hardware', () => {
      a += 1;
    });
    const removeB = addTopicHandler('/topic/stations/s1/hardware', () => {
      b += 1;
    });
    attachWire(wire);
    emit('/topic/stations/s1/hardware', VALID_HINT);
    assert(a === 1 && b === 1, 'both handlers receive the shared hint');
    assert(activeSubs('/topic/stations/s1/hardware').length === 1, 'single wire sub for duplicate topics');
    removeA();
    emit('/topic/stations/s1/hardware', VALID_HINT);
    assert(a === 1 && b === 2, 'removed handler stops, remaining handler keeps receiving');
    removeB();
    assert(activeSubs().length === 0, 'wire unsubscribed after the last handler leaves');
  }

  // 3. Malformed / foreign payloads are ignored.
  clearRegistry();
  {
    const { wire, emit } = createFakeWire();
    let calls = 0;
    const remove = addTopicHandler('/topic/stations/s1/hardware', () => {
      calls += 1;
    });
    attachWire(wire);
    emit('/topic/stations/s1/hardware', 'not-json');
    emit('/topic/stations/s1/hardware', '{"v":2,"type":"HARDWARE_CHANGED"}');
    emit('/topic/stations/s1/hardware', '{"v":1,"type":"OTHER"}');
    emit('/topic/stations/s1/hardware', 'null');
    assert(calls === 0, 'malformed/foreign payloads are dropped');
    emit('/topic/stations/s1/hardware', VALID_HINT);
    assert(calls === 1, 'valid payload still delivered after bad ones');
    remove();
  }

  // 4. A throwing handler does not break the shared subscription.
  clearRegistry();
  {
    const { wire, emit } = createFakeWire();
    let healthy = 0;
    const removeThrowing = addTopicHandler('/topic/stations/s1/hardware', () => {
      throw new Error('boom');
    });
    const removeHealthy = addTopicHandler('/topic/stations/s1/hardware', () => {
      healthy += 1;
    });
    attachWire(wire);
    emit('/topic/stations/s1/hardware', VALID_HINT);
    assert(healthy === 1, 'healthy handler still fires after a throwing one');
    removeThrowing();
    removeHealthy();
  }

  // 5. Reconnect: detach drops the wire, re-attach re-subscribes and re-runs catch-up.
  clearRegistry();
  {
    const { wire, activeSubs } = createFakeWire();
    let readyCount = 0;
    let received = 0;
    const remove = addTopicHandler('/topic/stations/s1/hardware', () => {
      received += 1;
    }, () => {
      readyCount += 1;
    });
    attachWire(wire);
    detachWire();
    assert(activeSubs().length === 0, 'detach releases the wire subscription');
    attachWire(wire);
    assert(activeSubs().length === 1, 'entry re-subscribed on reconnect');
    assert(readyCount === 2, 'catch-up callback re-fires on every reconnect');
    remove();
  }

  // 6. Adding while connected subscribes immediately but does NOT auto-refetch
  //    (the screen performs its own initial/focus fetch).
  clearRegistry();
  {
    const { wire, activeSubs } = createFakeWire();
    let readyCount = 0;
    attachWire(wire);
    const remove = addTopicHandler('/topic/stations/s2/hardware', () => {}, () => {
      readyCount += 1;
    });
    assert(activeSubs('/topic/stations/s2/hardware').length === 1, 'add-while-connected subscribes immediately');
    assert(readyCount === 0, 'add-while-connected does not trigger a redundant catch-up refetch');
    remove();
  }

  clearRegistry();
}

async function testCoordinator(): Promise<void> {
  console.log('--- refetchCoordinator ---');

  // 1. Idle request starts immediately; burst during a run coalesces into ONE throttled trailing run.
  {
    const clock = new FakeClock();
    const resolvers: Array<() => void> = [];
    let runCount = 0;
    const coordinator = createRefetchCoordinator(
      () => {
        runCount += 1;
        return new Promise<void>((resolve) => {
          resolvers.push(resolve);
        });
      },
      { throttleMs: 300, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer },
    );

    const first = coordinator.requestAndWait();
    assert(runCount === 1, 'idle requestAndWait starts a run immediately');

    let firstDone = false;
    void first.then(() => {
      firstDone = true;
    });

    const second = coordinator.requestAndWait();
    coordinator.request();
    coordinator.request();
    assert(runCount === 1, 'requests during a run do not start parallel runs');

    let secondDone = false;
    void second.then(() => {
      secondDone = true;
    });

    resolvers.shift()!();
    await flush();
    assert(firstDone, 'first waiter resolves when its run completes');
    assert(!secondDone, 'in-flight run completion does not satisfy a waiter that arrived later');
    assert(runCount === 1, 'trailing run waits for the throttle window');
    assert(clock.pendingCount() === 1, 'one trailing run is scheduled');

    clock.advance(300);
    assert(runCount === 2, 'exactly one trailing run after the throttle window');
    await flush();
    assert(!secondDone, 'second waiter still pending until the trailing run finishes');
    resolvers.shift()!();
    await flush();
    assert(secondDone, 'second waiter resolves after the trailing run');

    coordinator.dispose();
  }

  // 2. Throttling for synchronous runs.
  {
    const clock = new FakeClock();
    let runCount = 0;
    const coordinator = createRefetchCoordinator(
      () => {
        runCount += 1;
      },
      { throttleMs: 300, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer },
    );
    coordinator.request();
    assert(runCount === 1, 'sync run starts immediately');
    coordinator.request();
    assert(runCount === 1, 'second request inside throttle window is delayed');
    clock.advance(299);
    assert(runCount === 1, 'still delayed at 299 ms');
    clock.advance(1);
    assert(runCount === 2, 'delayed request runs at exactly +300 ms');
    coordinator.dispose();
  }

  // 3. Busy notifications.
  {
    const clock = new FakeClock();
    const resolvers: Array<() => void> = [];
    const coordinator = createRefetchCoordinator(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        }),
      { throttleMs: 300, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer },
    );
    const transitions: boolean[] = [];
    const unsubscribe = coordinator.subscribeBusy((busy) => transitions.push(busy));
    coordinator.request();
    assert(coordinator.isBusy(), 'busy while running');
    resolvers.shift()!();
    await flush();
    assert(!coordinator.isBusy(), 'idle after the run completes');
    assert(
      transitions.length === 2 && transitions[0] === true && transitions[1] === false,
      'busy listener saw true -> false',
    );
    unsubscribe();
    coordinator.dispose();
  }

  // 4. Failing runs still settle waiters (no retry, no hang).
  {
    const clock = new FakeClock();
    const coordinator = createRefetchCoordinator(
      () => Promise.reject(new Error('network down')),
      { throttleMs: 300, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer },
    );
    let settled = false;
    void coordinator.requestAndWait().then(() => {
      settled = true;
    });
    await flush();
    assert(settled, 'waiter resolves even when the refetch fails');
    coordinator.dispose();
  }

  // 5. Dispose: pending waiters resolve, later requests are ignored.
  {
    const clock = new FakeClock();
    let runCount = 0;
    const coordinator = createRefetchCoordinator(
      () => {
        runCount += 1;
      },
      { throttleMs: 300, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer },
    );
    coordinator.request();
    coordinator.request();
    assert(clock.pendingCount() === 1, 'request scheduled before dispose');
    let settled = false;
    void coordinator.requestAndWait().then(() => {
      settled = true;
    });
    coordinator.dispose();
    await flush();
    assert(settled, 'dispose resolves pending waiters');
    coordinator.request();
    clock.advance(1_000);
    assert(runCount === 1, 'requests after dispose are ignored');
  }
}

async function main(): Promise<void> {
  await testRegistry();
  await testCoordinator();
  console.log('\n🎉 ALL HARDWARE SOCKET TESTS PASSED!');
}

void main();
