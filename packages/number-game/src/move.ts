import { applyAddNumbers, type AddNumbersRefusal } from './add-numbers.js';
import type { CellIndex, GameState } from './game-state.js';
import { applyHint, type HintRefusal } from './hint.js';
import { applyMatch, type MatchRefusal } from './match.js';

/** Every move a player can make. The server receives these and applies them with `applyMove`. */
export type NumberGameMove =
  | { readonly type: 'match'; readonly firstIndex: CellIndex; readonly secondIndex: CellIndex }
  | { readonly type: 'add-numbers' }
  | { readonly type: 'hint' };

export type MoveRefusal = MatchRefusal | AddNumbersRefusal | HintRefusal;

export type MoveResult =
  | { readonly accepted: true; readonly state: GameState }
  | { readonly accepted: false; readonly reason: MoveRefusal };

/** Applies any move with the rule it belongs to. */
export function applyMove(state: GameState, move: NumberGameMove): MoveResult {
  switch (move.type) {
    case 'match':
      return applyMatch(state, move.firstIndex, move.secondIndex);
    case 'add-numbers':
      return applyAddNumbers(state);
    case 'hint':
      return applyHint(state);
  }
}
