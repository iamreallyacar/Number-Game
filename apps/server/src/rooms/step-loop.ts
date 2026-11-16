/** The clock and the timer of a step loop. Tests give it one they move by hand. */
export interface StepScheduler {
  /** A monotonic time in milliseconds. */
  now(): number;
  /** Calls `callback` once after `delayMilliseconds`. Returns a function that cancels the call. */
  schedule(callback: () => void, delayMilliseconds: number): () => void;
}

export const systemScheduler: StepScheduler = {
  now: () => performance.now(),
  schedule(callback, delayMilliseconds) {
    const timer = setTimeout(callback, delayMilliseconds);
    timer.unref();
    return () => {
      clearTimeout(timer);
    };
  },
};

/** A tick that is this many steps late does these steps and then drops the rest of the backlog. */
export const MAX_CATCH_UP_STEPS = 5;

export interface StepLoopOptions {
  readonly scheduler: StepScheduler;
  readonly stepRate: number;
  /** Must not throw, since a timer has nobody to catch the error. */
  readonly runStep: () => void;
}

export interface StepLoop {
  stop(): void;
}

/**
 * Calls `runStep` `stepRate` times per second. Each step is due at a fixed time after the start,
 * so the timer's lateness does not add up. A late tick catches up with a few steps, and a longer
 * delay loses the steps it cannot catch up on, so a slow moment never becomes a growing backlog.
 */
export function startStepLoop({ scheduler, stepRate, runStep }: StepLoopOptions): StepLoop {
  const stepMilliseconds = 1000 / stepRate;
  let nextStepDueAt = scheduler.now() + stepMilliseconds;
  let stopped = false;
  let cancelTimer: () => void = () => undefined;

  function tick(): void {
    const now = scheduler.now();
    let stepsDone = 0;
    while (!stopped && nextStepDueAt <= now) {
      if (stepsDone === MAX_CATCH_UP_STEPS) {
        nextStepDueAt = now + stepMilliseconds;
        break;
      }
      nextStepDueAt += stepMilliseconds;
      runStep();
      stepsDone += 1;
    }
    scheduleNextTick();
  }

  function scheduleNextTick(): void {
    if (stopped) {
      return;
    }
    cancelTimer = scheduler.schedule(tick, Math.max(0, nextStepDueAt - scheduler.now()));
  }

  scheduleNextTick();

  return {
    stop() {
      stopped = true;
      cancelTimer();
    },
  };
}
