import type { GameState } from './game-state.js';
import { applyHint, type HintRefusal } from './hint.js';
import { applyDiskMove, type DiskMoveRefusal } from './move-disk.js';
import { applyUndo, type UndoRefusal } from './undo.js';

/** Every move a player can make. The server receives these and applies them with `applyMove`. */
export type DiskGameMove =
  | {
      readonly type: 'move-disk';
      /** Pegs are counted from 0 at the left. */
      readonly fromPeg: number;
      readonly toPeg: number;
    }
  | { readonly type: 'undo' }
  | { readonly type: 'hint' };

export type MoveRefusal = DiskMoveRefusal | UndoRefusal | HintRefusal;

export type MoveResult =
  | { readonly accepted: true; readonly state: GameState }
  | { readonly accepted: false; readonly reason: MoveRefusal };

/** Applies any move with the rule it belongs to. */
export function applyMove(state: GameState, move: DiskGameMove): MoveResult {
  switch (move.type) {
    case 'move-disk':
      return applyDiskMove(state, move);
    case 'undo':
      return applyUndo(state);
    case 'hint':
      return applyHint(state);
  }
}
