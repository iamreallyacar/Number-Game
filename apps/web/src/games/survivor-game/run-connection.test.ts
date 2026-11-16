import { buildRunStateReport, createRun, type RunStateReport } from '@local/survivor-game';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConnectionStatus, WebSocketLike } from '../../rooms/reconnecting-socket.js';
import { RunConnection } from './run-connection.js';

class FakeSocket implements WebSocketLike {
  onopen: (() => void) | null = null;
  onmessage: ((event: { readonly data: unknown }) => void) | null = null;
  onclose: ((event: { readonly code: number }) => void) | null = null;
  readonly sent: unknown[] = [];

  send(text: string): void {
    this.sent.push(JSON.parse(text));
  }

  close(): void {
    // Nothing to release in a fake.
  }

  deliver(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

function openConnection() {
  const socket = new FakeSocket();
  const states: RunStateReport[] = [];
  const endings: unknown[] = [];
  const refusals: unknown[] = [];
  const statuses: ConnectionStatus[] = [];
  const connection = new RunConnection({
    url: 'ws://example/socket',
    createSocket: () => socket,
    ownPlayerId: 'Sam',
    onState: (state) => states.push(state),
    onRunEnded: (message) => endings.push(message),
    onRefused: (message) => refusals.push(message),
    onStatus: (status) => statuses.push(status),
  });
  connection.start();
  socket.onopen?.();
  return { connection, socket, states, endings, refusals, statuses };
}

describe('RunConnection', () => {
  const state = buildRunStateReport(createRun({ playerIds: ['Sam', 'Alex'], seed: 1 }));

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes on the states the server sends', () => {
    const { socket, states } = openConnection();
    socket.deliver({ type: 'state', state });
    expect(states).toEqual([state]);
  });

  it('sends the direction and the upgrade choice as messages', () => {
    const { connection, socket } = openConnection();
    expect(connection.sendDirection({ x: 1, y: 0 })).toBe(true);
    expect(connection.sendDirection(null)).toBe(true);
    expect(connection.chooseUpgrade('damage')).toBe(true);
    expect(socket.sent).toEqual([
      { type: 'set-direction', direction: { x: 1, y: 0 } },
      { type: 'set-direction', direction: null },
      { type: 'choose-upgrade', upgradeId: 'damage' },
    ]);
  });

  it('passes on a refusal', () => {
    const { socket, refusals } = openConnection();
    socket.deliver({ type: 'message-refused', reason: 'not-in-offer', message: 'No such card' });
    expect(refusals).toEqual([
      { type: 'message-refused', reason: 'not-in-offer', message: 'No such card' },
    ]);
  });

  it('reports the end of the run once and closes the connection', () => {
    const { socket, endings, statuses } = openConnection();
    const summary = { score: 0, category: '2', details: { secondsSurvived: 0, levelReached: 1 } };
    socket.deliver({ type: 'run-ended', reason: 'defeat', state, summary });
    expect(endings).toHaveLength(1);
    expect(statuses.at(-1)).toEqual({ kind: 'finished' });
  });

  it('stops and says so when a message cannot be read', () => {
    const { socket, statuses, states } = openConnection();
    socket.deliver({ type: 'state', state: { nonsense: true } });
    expect(states).toEqual([]);
    expect(statuses.at(-1)).toMatchObject({ kind: 'stopped' });
  });

  it('stops when the state has no character for this page', () => {
    const { socket, statuses, states } = openConnection();
    const strangers = buildRunStateReport(createRun({ playerIds: ['Kim'], seed: 1 }));
    socket.deliver({ type: 'state', state: strangers });
    expect(states).toEqual([]);
    expect(statuses.at(-1)).toMatchObject({
      kind: 'stopped',
      reason: "Player 'Sam' is not a character in this run.",
    });
  });

  it('says so when the server closes normally without a result', () => {
    const { socket, statuses } = openConnection();
    socket.onclose?.({ code: 1000 });
    expect(statuses.at(-1)).toMatchObject({ kind: 'stopped' });
  });

  it('finishes quietly when the page closes it', () => {
    const { connection, statuses } = openConnection();
    connection.close();
    expect(statuses.at(-1)).toEqual({ kind: 'finished' });
  });
});
