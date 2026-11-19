import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Poller, type PollResult } from './poller.js';

describe('Poller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads at once and then after every interval', async () => {
    const results: PollResult<number>[] = [];
    let counter = 0;
    const poller = new Poller(
      () => Promise.resolve(++counter),
      (result) => results.push(result),
      1000,
    );
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([{ kind: 'loaded', value: 1 }]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(results.map((result) => result.kind)).toEqual(['loaded', 'loaded', 'loaded']);
    poller.stop();
  });

  it('reports a failure and keeps polling', async () => {
    const results: PollResult<number>[] = [];
    const load = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(7);
    const poller = new Poller(load, (result) => results.push(result), 500);
    poller.start();
    await vi.advanceTimersByTimeAsync(500);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ kind: 'failed' });
    expect(results[1]).toEqual({ kind: 'loaded', value: 7 });
    poller.stop();
  });

  it('stops polling, and drops an answer that arrives after stopping', async () => {
    const results: PollResult<number>[] = [];
    let finishLoad: (value: number) => void = () => undefined;
    const poller = new Poller(
      () =>
        new Promise<number>((resolve) => {
          finishLoad = resolve;
        }),
      (result) => results.push(result),
      100,
    );
    poller.start();
    poller.stop();
    finishLoad(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(results).toEqual([]);
  });

  it('drops an answer whose load began before discardLoadsInFlight was called', async () => {
    const results: PollResult<string>[] = [];
    let finishLoad: (value: string) => void = () => undefined;
    const poller = new Poller(
      () =>
        new Promise<string>((resolve) => {
          finishLoad = resolve;
        }),
      (result) => results.push(result),
      100,
    );
    poller.start();
    poller.discardLoadsInFlight();
    finishLoad('old room');
    await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([]);
    // Polling carries on, and the next load is applied.
    await vi.advanceTimersByTimeAsync(100);
    finishLoad('newer room');
    await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([{ kind: 'loaded', value: 'newer room' }]);
    poller.stop();
  });
});
