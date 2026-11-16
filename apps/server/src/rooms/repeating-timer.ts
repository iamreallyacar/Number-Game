import type { StepScheduler } from './step-loop.js';

/**
 * Calls `callback` every `intervalMilliseconds` on the scheduler, so tests move it by hand.
 * Returns the function that stops it. The callback must not throw, since a timer has nobody to
 * catch the error.
 */
export function startRepeatingTimer(
  scheduler: StepScheduler,
  intervalMilliseconds: number,
  callback: () => void,
): () => void {
  let stopped = false;
  let cancelPending: () => void = () => undefined;

  function scheduleNext(): void {
    cancelPending = scheduler.schedule(() => {
      callback();
      if (!stopped) {
        scheduleNext();
      }
    }, intervalMilliseconds);
  }

  scheduleNext();
  return () => {
    stopped = true;
    cancelPending();
  };
}
