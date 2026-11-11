import { findShortestPath } from './fewest-moves.js';
import { isGameOver } from './game-over.js';
import type { GameState, PegMove } from './game-state.js';

/** A hint takes this much from moves left (DK-13). */
export const HINT_COST = 2;

export type HintRefusal = 'game-over' | 'would-end-game';

export type HintResult =
  | { readonly accepted: true; readonly state: GameState; readonly hintMove: PegMove }
  | { readonly accepted: false; readonly reason: HintRefusal };

/** Why the hint is turned off right now, or null when it can be used (DK-14). */
export function findHintProblem(state: GameState): HintRefusal | null {
  if (isGameOver(state)) {
    return 'game-over';
  }
  const { fewestMoves } = findShortestPath(state.pegs);
  return state.movesLeft - HINT_COST < fewestMoves ? 'would-end-game' : null;
}

/** Pays for a hint and gives the next move of a shortest path to a sorted layout (DK-13). */
export function applyHint(state: GameState): HintResult {
  const problem = findHintProblem(state);
  if (problem !== null) {
    return { accepted: false, reason: problem };
  }
  const hintMove = findShortestPath(state.pegs).nextMove;
  if (hintMove === null) {
    throw new Error('A game state never holds a sorted layout, so a hint always has a move');
  }
  return {
    accepted: true,
    state: { ...state, movesLeft: state.movesLeft - HINT_COST, stageAssisted: true },
    hintMove,
  };
}
