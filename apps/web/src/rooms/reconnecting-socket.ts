/** The part of a browser WebSocket the reconnecting socket uses, so tests can stand in for it. */
export interface WebSocketLike {
  onopen: (() => void) | null;
  onmessage: ((event: { readonly data: unknown }) => void) | null;
  onclose: ((event: { readonly code: number }) => void) | null;
  send(text: string): void;
  close(): void;
}

export type ConnectionStatus =
  | { readonly kind: 'connecting' }
  | { readonly kind: 'open' }
  /** The connection was lost and the next try is `retryInMs` away (SG-57). */
  | { readonly kind: 'reconnecting'; readonly attempt: number; readonly retryInMs: number }
  /** The connection was closed for good and the text says why. */
  | { readonly kind: 'stopped'; readonly reason: string }
  /** The server ended the run normally, or this page closed the socket itself. */
  | { readonly kind: 'finished' };

const FIRST_RETRY_WAIT_MS = 500;
const LONGEST_RETRY_WAIT_MS = 10_000;
/** How often a refusal that may clear up on its own is tried again before giving up. */
const MAX_REFUSED_CLOSES = 5;

const CLOSE_RUN_ENDED = 1000;
const CLOSE_TOO_MANY_MESSAGES = 1008;
const CLOSE_ROOM_NOT_STARTED = 4400;
const CLOSE_NO_SUCH_ROOM_OR_PLAYER = 4404;
const CLOSE_ALREADY_CONNECTED = 4409;

/** The wait before try number `attempt` (counting from 1). It doubles each time up to a limit. */
export function retryWaitMs(attempt: number): number {
  return Math.min(FIRST_RETRY_WAIT_MS * 2 ** (attempt - 1), LONGEST_RETRY_WAIT_MS);
}

type CloseDecision =
  | { readonly kind: 'finish' }
  | { readonly kind: 'stop'; readonly reason: string }
  | { readonly kind: 'retry' };

/**
 * What to do after the socket closed with this code. `refusedCloses` counts the closes in a row
 * that came from a refusal, which a refusal that may clear up on its own is allowed a few of.
 */
export function decideAfterClose(code: number, refusedCloses: number): CloseDecision {
  switch (code) {
    case CLOSE_RUN_ENDED:
      return { kind: 'finish' };
    case CLOSE_TOO_MANY_MESSAGES:
      return {
        kind: 'stop',
        reason: 'The server closed the connection because this page sent too many messages.',
      };
    case CLOSE_NO_SUCH_ROOM_OR_PLAYER:
      return { kind: 'stop', reason: 'This run no longer exists. It may have ended.' };
    case CLOSE_ALREADY_CONNECTED:
      return refusedCloses >= MAX_REFUSED_CLOSES
        ? {
            kind: 'stop',
            reason: 'This player is already connected from another page or device.',
          }
        : { kind: 'retry' };
    case CLOSE_ROOM_NOT_STARTED:
      return refusedCloses >= MAX_REFUSED_CLOSES
        ? { kind: 'stop', reason: 'The run has not started yet.' }
        : { kind: 'retry' };
    default:
      // A lost network, a sleeping phone, or a server that is restarting can all come back.
      return { kind: 'retry' };
  }
}

export interface ReconnectingSocketOptions {
  readonly url: string;
  readonly createSocket: (url: string) => WebSocketLike;
  readonly onText: (text: string) => void;
  readonly onStatus: (status: ConnectionStatus) => void;
}

/**
 * One WebSocket that opens again after it drops, with growing waits (SG-57), and stops on a close
 * that cannot recover. It carries text only, so it is the same for every room game.
 */
export class ReconnectingSocket {
  private socket: WebSocketLike | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private refusedCloses = 0;
  private isOpen = false;
  private isDone = false;

  constructor(private readonly options: ReconnectingSocketOptions) {}

  start(): void {
    this.options.onStatus({ kind: 'connecting' });
    this.connect();
  }

  /** Sends the text if the socket is open and answers whether it did. */
  send(text: string): boolean {
    if (!this.isOpen || this.socket === null) {
      return false;
    }
    this.socket.send(text);
    return true;
  }

  /** Closes the socket for good, and nothing is retried. */
  close(): void {
    if (this.isDone) {
      return;
    }
    this.isDone = true;
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.isOpen = false;
    if (this.socket !== null) {
      this.socket.onclose = null;
      this.socket.onmessage = null;
      this.socket.onopen = null;
      this.socket.close();
      this.socket = null;
    }
    this.options.onStatus({ kind: 'finished' });
  }

  private connect(): void {
    const socket = this.options.createSocket(this.options.url);
    this.socket = socket;
    socket.onopen = () => {
      this.isOpen = true;
      this.attempt = 0;
      this.refusedCloses = 0;
      this.options.onStatus({ kind: 'open' });
    };
    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        throw new Error('The server sent a socket message that is not text');
      }
      this.options.onText(event.data);
    };
    socket.onclose = (event) => {
      this.handleClose(event.code);
    };
  }

  private handleClose(code: number): void {
    this.isOpen = false;
    this.socket = null;
    if (code === CLOSE_ALREADY_CONNECTED || code === CLOSE_ROOM_NOT_STARTED) {
      this.refusedCloses += 1;
    }
    const decision = decideAfterClose(code, this.refusedCloses);
    if (decision.kind !== 'retry') {
      this.isDone = true;
      this.options.onStatus(
        decision.kind === 'finish'
          ? { kind: 'finished' }
          : { kind: 'stopped', reason: decision.reason },
      );
      return;
    }
    this.attempt += 1;
    const retryInMs = retryWaitMs(this.attempt);
    this.options.onStatus({ kind: 'reconnecting', attempt: this.attempt, retryInMs });
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.options.onStatus({ kind: 'connecting' });
      this.connect();
    }, retryInMs);
  }
}

/** Opens a real browser WebSocket, in the small shape the reconnecting socket uses. */
export function openBrowserWebSocket(url: string): WebSocketLike {
  const socket = new WebSocket(url);
  const adapter: WebSocketLike = {
    onopen: null,
    onmessage: null,
    onclose: null,
    send: (text) => {
      socket.send(text);
    },
    close: () => {
      socket.close();
    },
  };
  socket.onopen = () => {
    adapter.onopen?.();
  };
  socket.onmessage = (event: MessageEvent<unknown>) => {
    adapter.onmessage?.({ data: event.data });
  };
  socket.onclose = (event) => {
    adapter.onclose?.({ code: event.code });
  };
  return adapter;
}
