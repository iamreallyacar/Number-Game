import type { GameState } from './game-state.js';
import { shapeFitsAnywhere } from './shape-fit.js';

/** Whether at least one of the slot shapes fits somewhere on the board. */
export function anySlotShapeFits(state: Pick<GameState, 'size' | 'cells' | 'slots'>): boolean {
  return state.slots.some((shapeId) => shapeFitsAnywhere(state, shapeId));
}

/** The game is over when none of the slot shapes fits anywhere on the board (BG-19). */
export function isGameOver(state: Pick<GameState, 'size' | 'cells' | 'slots'>): boolean {
  return !anySlotShapeFits(state);
}
