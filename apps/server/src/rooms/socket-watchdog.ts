import { startRepeatingTimer } from './repeating-timer.js';
import type { StepScheduler } from './step-loop.js';

/** What the watchdog needs from a connection. */
export interface WatchedSocket {
  ping(): void;
  /** Drops the connection at once. The socket's own close handling then runs as for any drop. */
  terminate(): void;
  /** Bytes accepted by `send` that the network has not taken yet. */
  readonly bufferedBytes: number;
}

export interface SocketWatchdogOptions {
  readonly scheduler: StepScheduler;
  readonly pingIntervalMilliseconds: number;
  readonly maxBufferedBytes: number;
}

/** Tells the watchdog a connection is alive, or that it is gone. */
export interface WatchHandle {
  pongReceived(): void;
  unwatch(): void;
}

/**
 * Finds connections that stalled without closing, such as a phone that lost Wi-Fi. On every
 * interval it terminates a socket that did not answer the last ping or whose send buffer passed
 * the limit, and pings the others.
 */
export class SocketWatchdog {
  private readonly awaitingPong = new Map<WatchedSocket, boolean>();
  private stopTimer: (() => void) | null = null;

  constructor(private readonly options: SocketWatchdogOptions) {}

  start(): void {
    if (this.stopTimer !== null) {
      return;
    }
    this.stopTimer = startRepeatingTimer(
      this.options.scheduler,
      this.options.pingIntervalMilliseconds,
      () => {
        this.check();
      },
    );
  }

  stop(): void {
    this.stopTimer?.();
    this.stopTimer = null;
    this.awaitingPong.clear();
  }

  watch(socket: WatchedSocket): WatchHandle {
    this.awaitingPong.set(socket, false);
    return {
      pongReceived: () => {
        if (this.awaitingPong.has(socket)) {
          this.awaitingPong.set(socket, false);
        }
      },
      unwatch: () => {
        this.awaitingPong.delete(socket);
      },
    };
  }

  private check(): void {
    for (const [socket, isAwaitingPong] of [...this.awaitingPong]) {
      if (isAwaitingPong || socket.bufferedBytes > this.options.maxBufferedBytes) {
        this.awaitingPong.delete(socket);
        socket.terminate();
      } else {
        this.awaitingPong.set(socket, true);
        socket.ping();
      }
    }
  }
}
