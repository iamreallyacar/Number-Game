import type { GameState } from './game-state.js';
import { applyPlacement, type PlacementRefusal } from './place-shape.js';

/** Every move a player can make. The server receives these and applies them with `applyMove`. */
export interface BlockGameMove {
  readonly type: 'place-shape';
  /** Which slot to take the shape from, from 0 to 2. */
  readonly slotIndex: number;
  /** Board row of the top of the shape's bounding box, counted from 0. */
  readonly topRow: number;
  /** Board column of the left of the shape's bounding box, counted from 0. */
  readonly leftColumn: number;
}

export type MoveRefusal = PlacementRefusal;

export type MoveResult =
  | { readonly accepted: true; readonly state: GameState }
  | { readonly accepted: false; readonly reason: MoveRefusal };

/** Applies any move with the rule it belongs to. Placing a shape is the only move so far. */
export function applyMove(state: GameState, move: BlockGameMove): MoveResult {
  return applyPlacement(state, move.slotIndex, move.topRow, move.leftColumn);
}
