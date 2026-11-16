import { describe, expect, it } from 'vitest';
import { FrameRateLimit } from './frame-rate-limit.js';

function limitWithClock() {
  const clock = { now: 0 };
  const limit = new FrameRateLimit({
    now: () => clock.now,
    maxFramesPerWindow: 3,
    windowMilliseconds: 1000,
  });
  return { clock, limit };
}

describe('FrameRateLimit', () => {
  it('allows frames up to the limit in a window, and refuses the next', () => {
    const { limit } = limitWithClock();
    expect([1, 2, 3, 4].map(() => limit.allowFrame())).toEqual([true, true, true, false]);
  });

  it('allows frames again in the next window', () => {
    const { clock, limit } = limitWithClock();
    for (let frame = 0; frame < 3; frame += 1) {
      limit.allowFrame();
    }
    clock.now = 999;
    expect(limit.allowFrame()).toBe(false);
    clock.now = 1000;
    expect(limit.allowFrame()).toBe(true);
  });
});
