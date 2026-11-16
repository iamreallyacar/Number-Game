import type { RunState } from './run-state.js';

export function isRunOver(state: RunState): boolean {
  return state.endReason !== null;
}

export class RunAlreadyEndedError extends Error {
  override readonly name = 'RunAlreadyEndedError';
}

/** Ends the run when the team has no health left (SG-48). */
export function endRunIfDefeated(state: RunState): RunState {
  return state.teamHealth <= 0 ? { ...state, endReason: 'defeat' } : state;
}

/**
 * Ends the run because no player was connected for the empty run time (SG-47). The rules do not
 * know about connections, so the server counts that time and calls this when it is over.
 */
export function endRunAsAbandoned(state: RunState): RunState {
  if (isRunOver(state)) {
    throw new RunAlreadyEndedError('The run has already ended');
  }
  return { ...state, endReason: 'abandoned' };
}
