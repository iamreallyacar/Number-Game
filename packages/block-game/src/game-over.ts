import type { GameState } from './game-state.js';
import { shapeFitsAnywhere } from './shape-fit.js';

/** Whether at least one shape still waiting in a slot fits somewhere. Empty slots are skipped. */
export function anySlotShapeFits(state: Pick<GameState, 'cells' | 'slots'>): boolean {
  return state.slots.some((shapeId) => shapeId !== null && shapeFitsAnywhere(state, shapeId));
}

/** The game is over when none of the shapes left in the hand fits anywhere on the board (BG-19). */
export function isGameOver(state: Pick<GameState, 'cells' | 'slots'>): boolean {
  return !anySlotShapeFits(state);
}
