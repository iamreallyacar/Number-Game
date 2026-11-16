import { describe, expect, it, vi } from 'vitest';
import { ManualScheduler } from '../test-support.js';
import { MAX_CATCH_UP_STEPS, startStepLoop } from './step-loop.js';

const STEP_RATE = 10;
const STEP_MILLISECONDS = 100;

function startLoop(runStep: () => void) {
  const scheduler = new ManualScheduler();
  const loop = startStepLoop({ scheduler, stepRate: STEP_RATE, runStep });
  return { scheduler, loop };
}

describe('startStepLoop', () => {
  it('steps once per step length and not before', () => {
    const runStep = vi.fn();
    const { scheduler } = startLoop(runStep);
    scheduler.advance(STEP_MILLISECONDS - 1);
    expect(runStep).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(runStep).toHaveBeenCalledTimes(1);
    scheduler.advance(STEP_MILLISECONDS * 9);
    expect(runStep).toHaveBeenCalledTimes(10);
  });

  it('does not drift when a timer fires late', () => {
    const runStep = vi.fn();
    const { scheduler } = startLoop(runStep);
    // The manual scheduler fires on time, so a late tick is made by one big advance.
    scheduler.advance(STEP_MILLISECONDS * 3 + 50);
    expect(runStep).toHaveBeenCalledTimes(3);
    scheduler.advance(50);
    expect(runStep).toHaveBeenCalledTimes(4);
  });

  it('stops for good when stopped', () => {
    const runStep = vi.fn();
    const { scheduler, loop } = startLoop(runStep);
    scheduler.advance(STEP_MILLISECONDS);
    loop.stop();
    scheduler.advance(STEP_MILLISECONDS * 10);
    expect(runStep).toHaveBeenCalledTimes(1);
    expect(scheduler.pendingTimerCount).toBe(0);
  });

  it('can be stopped by its own step', () => {
    const scheduler = new ManualScheduler();
    let stepCount = 0;
    const loop = startStepLoop({
      scheduler,
      stepRate: STEP_RATE,
      runStep: () => {
        stepCount += 1;
        if (stepCount === 2) {
          loop.stop();
        }
      },
    });
    scheduler.advance(STEP_MILLISECONDS * 10);
    expect(stepCount).toBe(2);
    expect(scheduler.pendingTimerCount).toBe(0);
  });

  it('does a few steps to catch up after a long delay and drops the rest of the backlog', () => {
    const times = [0, 100 * 50];
    let clockCall = 0;
    const pending: (() => void)[] = [];
    const runStep = vi.fn();
    startStepLoop({
      scheduler: {
        now: () => times[Math.min(clockCall++, times.length - 1)] ?? 0,
        schedule: (callback) => {
          pending.push(callback);
          return () => undefined;
        },
      },
      stepRate: STEP_RATE,
      runStep,
    });
    pending[0]?.();
    expect(runStep).toHaveBeenCalledTimes(MAX_CATCH_UP_STEPS);
    pending[1]?.();
    expect(runStep).toHaveBeenCalledTimes(MAX_CATCH_UP_STEPS);
  });
});
