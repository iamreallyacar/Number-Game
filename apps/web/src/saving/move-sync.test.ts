import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, NetworkError } from '../api/api-request.js';
import { MoveSync, RETRY_DELAYS_MS, type SaveStatus } from './move-sync.js';

interface PendingSend {
  readonly move: unknown;
  succeed(): void;
  fail(error: unknown): void;
}

/** A fake server where the test decides when and how each send finishes. */
function createFakeSender() {
  const sends: PendingSend[] = [];
  const sendMove = (move: unknown): Promise<unknown> =>
    new Promise((resolve, reject) => {
      sends.push({
        move,
        succeed: () => {
          resolve({});
        },
        fail: reject,
      });
    });
  return { sends, sendMove };
}

function lastSend(sends: readonly PendingSend[]): PendingSend {
  const send = sends.at(-1);
  if (send === undefined) {
    throw new Error('No move was sent');
  }
  return send;
}

describe('MoveSync', () => {
  let statuses: SaveStatus[];

  beforeEach(() => {
    vi.useFakeTimers();
    statuses = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends moves one at a time and in order', async () => {
    const { sends, sendMove } = createFakeSender();
    const sync = new MoveSync(sendMove, (status) => statuses.push(status));
    sync.saveMove('first');
    sync.saveMove('second');
    expect(sends.map((send) => send.move)).toEqual(['first']);
    lastSend(sends).succeed();
    await vi.runAllTimersAsync();
    expect(sends.map((send) => send.move)).toEqual(['first', 'second']);
    expect(sync.hasUnsavedMoves).toBe(true);
    lastSend(sends).succeed();
    await vi.runAllTimersAsync();
    expect(sync.hasUnsavedMoves).toBe(false);
    expect(statuses).toEqual([{ kind: 'saving' }, { kind: 'saved' }]);
  });

  it('keeps retrying the same move after network failures and tells the player', async () => {
    const { sends, sendMove } = createFakeSender();
    const sync = new MoveSync(sendMove, (status) => statuses.push(status));
    sync.saveMove('only');
    lastSend(sends).fail(new NetworkError('offline'));
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toEqual({ kind: 'retrying', message: 'offline' });
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);
    expect(sends).toHaveLength(2);
    lastSend(sends).fail(new ApiError(500, 'internal-error', 'Server broke', null));
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[1]);
    expect(sends.map((send) => send.move)).toEqual(['only', 'only', 'only']);
    lastSend(sends).succeed();
    await vi.runAllTimersAsync();
    expect(statuses.at(-1)).toEqual({ kind: 'saved' });
  });

  it('stops saving when the game was opened on another device', async () => {
    const { sends, sendMove } = createFakeSender();
    const sync = new MoveSync(sendMove, (status) => statuses.push(status));
    sync.saveMove('first');
    sync.saveMove('second');
    lastSend(sends).fail(new ApiError(409, 'opened-elsewhere', 'Opened elsewhere', null));
    await vi.runAllTimersAsync();
    sync.saveMove('third');
    await vi.runAllTimersAsync();
    expect(sends).toHaveLength(1);
    expect(statuses.at(-1)).toEqual({ kind: 'opened-elsewhere' });
  });

  it('asks for a reload when the server refuses a move', async () => {
    const { sends, sendMove } = createFakeSender();
    const sync = new MoveSync(sendMove, (status) => statuses.push(status));
    sync.saveMove('bad');
    lastSend(sends).fail(new ApiError(422, 'move-refused', 'Move refused', 'not-a-pair'));
    await vi.runAllTimersAsync();
    expect(statuses.at(-1)).toEqual({ kind: 'out-of-sync', message: 'Move refused' });
    expect(sends).toHaveLength(1);
  });
});
