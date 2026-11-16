import { STEP_RATE } from './balance.js';

/** A rule that takes a time in seconds counts it in whole steps, and never in fewer than one. */
export function secondsToSteps(seconds: number): number {
  return Math.max(1, Math.round(seconds * STEP_RATE));
}

export const SECONDS_PER_STEP = 1 / STEP_RATE;

/** How many whole intervals of the given length have passed after the given number of steps. */
export function completedIntervals(stepCount: number, intervalSeconds: number): number {
  return Math.floor(stepCount / secondsToSteps(intervalSeconds));
}
