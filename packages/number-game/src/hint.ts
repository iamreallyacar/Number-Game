import { findValidPair, type CellPair } from './find-pair.js';
import type { GameState } from './game-state.js';

export type HintRefusal = 'no-hints-left' | 'no-pair-available';

export type HintResult =
  | { readonly accepted: true; readonly state: GameState; readonly pair: CellPair }
  | { readonly accepted: false; readonly reason: HintRefusal };

/** Uses one hint to reveal a valid pair (DF-03). A hint is not used up when no pair exists. */
export function applyHint(state: GameState): HintResult {
  if (state.hintsLeft !== 'unlimited' && state.hintsLeft <= 0) {
    return { accepted: false, reason: 'no-hints-left' };
  }
  const pair = findValidPair(state.cells, state.width);
  if (pair === null) {
    return { accepted: false, reason: 'no-pair-available' };
  }
  const hintsLeft = state.hintsLeft === 'unlimited' ? 'unlimited' : state.hintsLeft - 1;
  return { accepted: true, state: { ...state, hintsLeft }, pair };
}
