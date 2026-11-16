import { describe, expect, it } from 'vitest';
import { ManualScheduler } from '../test-support.js';
import { SocketWatchdog, type WatchedSocket } from './socket-watchdog.js';

const PING_INTERVAL_MS = 1000;
const MAX_BUFFERED_BYTES = 500;

class FakeWatchedSocket implements WatchedSocket {
  pings = 0;
  terminated = false;
  bufferedBytes = 0;

  ping(): void {
    this.pings += 1;
  }

  terminate(): void {
    this.terminated = true;
  }
}

function setUp() {
  const scheduler = new ManualScheduler();
  const watchdog = new SocketWatchdog({
    scheduler,
    pingIntervalMilliseconds: PING_INTERVAL_MS,
    maxBufferedBytes: MAX_BUFFERED_BYTES,
  });
  watchdog.start();
  return { scheduler, watchdog };
}

describe('SocketWatchdog', () => {
  it('pings a watched socket on every interval', () => {
    const { scheduler, watchdog } = setUp();
    const socket = new FakeWatchedSocket();
    const handle = watchdog.watch(socket);
    scheduler.advance(PING_INTERVAL_MS);
    handle.pongReceived();
    scheduler.advance(PING_INTERVAL_MS);
    expect(socket.pings).toBe(2);
    expect(socket.terminated).toBe(false);
  });

  it('terminates a socket that did not answer the ping before', () => {
    const { scheduler, watchdog } = setUp();
    const socket = new FakeWatchedSocket();
    watchdog.watch(socket);
    scheduler.advance(PING_INTERVAL_MS);
    expect(socket.terminated).toBe(false);
    scheduler.advance(PING_INTERVAL_MS);
    expect(socket.terminated).toBe(true);
  });

  it('terminates a socket whose send buffer passed the limit, even if it answers pings', () => {
    const { scheduler, watchdog } = setUp();
    const socket = new FakeWatchedSocket();
    const handle = watchdog.watch(socket);
    socket.bufferedBytes = MAX_BUFFERED_BYTES;
    scheduler.advance(PING_INTERVAL_MS);
    expect(socket.terminated).toBe(false);
    handle.pongReceived();
    socket.bufferedBytes = MAX_BUFFERED_BYTES + 1;
    scheduler.advance(PING_INTERVAL_MS);
    expect(socket.terminated).toBe(true);
  });

  it('only terminates the stalled socket among several', () => {
    const { scheduler, watchdog } = setUp();
    const healthy = new FakeWatchedSocket();
    const stalled = new FakeWatchedSocket();
    const healthyHandle = watchdog.watch(healthy);
    watchdog.watch(stalled);
    for (let interval = 0; interval < 3; interval += 1) {
      scheduler.advance(PING_INTERVAL_MS);
      healthyHandle.pongReceived();
    }
    expect(healthy.terminated).toBe(false);
    expect(stalled.terminated).toBe(true);
  });

  it('forgets a socket that was unwatched', () => {
    const { scheduler, watchdog } = setUp();
    const socket = new FakeWatchedSocket();
    watchdog.watch(socket).unwatch();
    scheduler.advance(PING_INTERVAL_MS * 3);
    expect(socket.pings).toBe(0);
    expect(socket.terminated).toBe(false);
  });

  it('stops its timer', () => {
    const { scheduler, watchdog } = setUp();
    expect(scheduler.pendingTimerCount).toBe(1);
    watchdog.stop();
    expect(scheduler.pendingTimerCount).toBe(0);
  });
});
