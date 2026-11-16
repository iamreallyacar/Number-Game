import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  decideAfterClose,
  ReconnectingSocket,
  retryWaitMs,
  type ConnectionStatus,
  type WebSocketLike,
} from './reconnecting-socket.js';

class FakeSocket implements WebSocketLike {
  onopen: (() => void) | null = null;
  onmessage: ((event: { readonly data: unknown }) => void) | null = null;
  onclose: ((event: { readonly code: number }) => void) | null = null;
  readonly sent: string[] = [];
  closedByPage = false;

  send(text: string): void {
    this.sent.push(text);
  }

  close(): void {
    this.closedByPage = true;
  }

  open(): void {
    this.onopen?.();
  }

  receive(data: unknown): void {
    this.onmessage?.({ data });
  }

  dropWith(code: number): void {
    this.onclose?.({ code });
  }
}

function startSocket() {
  const sockets: FakeSocket[] = [];
  const statuses: ConnectionStatus[] = [];
  const texts: string[] = [];
  const socket = new ReconnectingSocket({
    url: 'ws://example/socket',
    createSocket: () => {
      const created = new FakeSocket();
      sockets.push(created);
      return created;
    },
    onText: (text) => texts.push(text),
    onStatus: (status) => statuses.push(status),
  });
  socket.start();
  return { socket, sockets, statuses, texts };
}

describe('retryWaitMs', () => {
  it('doubles the wait up to a limit', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(retryWaitMs)).toEqual([
      500, 1000, 2000, 4000, 8000, 10_000, 10_000, 10_000,
    ]);
  });
});

describe('decideAfterClose', () => {
  it('finishes on a normal close and stops at once when the run is gone', () => {
    expect(decideAfterClose(1000, 0)).toEqual({ kind: 'finish' });
    expect(decideAfterClose(4404, 0)).toMatchObject({ kind: 'stop' });
  });

  it('stops at once when the server closed the connection for too many messages', () => {
    expect(decideAfterClose(1008, 0)).toMatchObject({
      kind: 'stop',
      reason: expect.stringContaining('too many messages') as string,
    });
  });

  it('retries a lost connection and a server that is stopping', () => {
    expect(decideAfterClose(1006, 0)).toEqual({ kind: 'retry' });
    expect(decideAfterClose(1001, 0)).toEqual({ kind: 'retry' });
  });

  it('gives up on an already connected player after a few refusals', () => {
    expect(decideAfterClose(4409, 4)).toEqual({ kind: 'retry' });
    expect(decideAfterClose(4409, 5)).toMatchObject({ kind: 'stop' });
  });
});

describe('ReconnectingSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports open, passes on text, and sends only while open', () => {
    const { socket, sockets, statuses, texts } = startSocket();
    expect(socket.send('early')).toBe(false);
    sockets[0]?.open();
    sockets[0]?.receive('{"type":"state"}');
    expect(socket.send('hello')).toBe(true);
    expect(sockets[0]?.sent).toEqual(['hello']);
    expect(texts).toEqual(['{"type":"state"}']);
    expect(statuses).toEqual([{ kind: 'connecting' }, { kind: 'open' }]);
  });

  it('fails loudly on a message that is not text', () => {
    const { sockets } = startSocket();
    expect(() => {
      sockets[0]?.receive(new ArrayBuffer(1));
    }).toThrow('not text');
  });

  it('reconnects with growing waits and starts again from the first wait once open', () => {
    const { sockets, statuses } = startSocket();
    sockets[0]?.dropWith(1006);
    expect(statuses.at(-1)).toEqual({ kind: 'reconnecting', attempt: 1, retryInMs: 500 });
    vi.advanceTimersByTime(500);
    expect(sockets).toHaveLength(2);
    sockets[1]?.dropWith(1006);
    expect(statuses.at(-1)).toEqual({ kind: 'reconnecting', attempt: 2, retryInMs: 1000 });
    vi.advanceTimersByTime(1000);
    sockets[2]?.open();
    sockets[2]?.dropWith(1006);
    expect(statuses.at(-1)).toEqual({ kind: 'reconnecting', attempt: 1, retryInMs: 500 });
  });

  it('stops without retrying when the run no longer exists', () => {
    const { sockets, statuses } = startSocket();
    sockets[0]?.dropWith(4404);
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
    expect(statuses.at(-1)).toMatchObject({ kind: 'stopped' });
  });

  it('does not retry after a close for too many messages', () => {
    const { sockets, statuses } = startSocket();
    sockets[0]?.dropWith(1008);
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
    expect(statuses.at(-1)).toMatchObject({ kind: 'stopped' });
  });

  it('stops after a few refusals because the player is connected elsewhere', () => {
    const { sockets, statuses } = startSocket();
    for (let tries = 0; tries < 4; tries += 1) {
      sockets.at(-1)?.dropWith(4409);
      vi.advanceTimersByTime(10_000);
    }
    expect(sockets).toHaveLength(5);
    sockets.at(-1)?.dropWith(4409);
    expect(statuses.at(-1)).toMatchObject({ kind: 'stopped' });
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(5);
  });

  it('finishes when the run ended normally', () => {
    const { sockets, statuses } = startSocket();
    sockets[0]?.open();
    sockets[0]?.dropWith(1000);
    expect(statuses.at(-1)).toEqual({ kind: 'finished' });
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
  });

  it('closes for good on request and cancels a waiting retry', () => {
    const { socket, sockets, statuses } = startSocket();
    sockets[0]?.dropWith(1006);
    socket.close();
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
    expect(statuses.at(-1)).toEqual({ kind: 'finished' });
  });

  it('closes the open socket itself on request', () => {
    const { socket, sockets } = startSocket();
    sockets[0]?.open();
    socket.close();
    expect(sockets[0]?.closedByPage).toBe(true);
    expect(socket.send('late')).toBe(false);
  });
});
