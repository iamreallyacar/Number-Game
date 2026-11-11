import { fewestMovesOf } from './fewest-moves.js';
import { isGameOver } from './game-over.js';
import type { GameState, PegMove, Pegs } from './game-state.js';
import { moveTopDisk } from './pegs.js';

/** An undo takes this much from moves left (DK-12). */
export const UNDO_COST = 1;

export type UndoRefusal = 'game-over' | 'nothing-to-undo' | 'would-end-game';

export type UndoResult =
  | { readonly accepted: true; readonly state: GameState; readonly undoneMove: PegMove }
  | { readonly accepted: false; readonly reason: UndoRefusal };

interface UndoPlan {
  readonly undoneMove: PegMove;
  readonly pegsAfterUndo: Pegs;
}

function planUndo(state: GameState): UndoPlan | UndoRefusal {
  if (isGameOver(state)) {
    return 'game-over';
  }
  const undoneMove = state.stageMoves.at(-1);
  if (undoneMove === undefined) {
    return 'nothing-to-undo';
  }
  const pegsAfterUndo = moveTopDisk(state.pegs, {
    fromPeg: undoneMove.toPeg,
    toPeg: undoneMove.fromPeg,
  });
  if (state.movesLeft - UNDO_COST < fewestMovesOf(pegsAfterUndo)) {
    return 'would-end-game';
  }
  return { undoneMove, pegsAfterUndo };
}

/** Why undo is turned off right now, or null when it can be used (DK-12, DK-14). */
export function findUndoProblem(state: GameState): UndoRefusal | null {
  const plan = planUndo(state);
  return typeof plan === 'string' ? plan : null;
}

/** Takes back the last move of the stage that has not been undone yet (DK-12). */
export function applyUndo(state: GameState): UndoResult {
  const plan = planUndo(state);
  if (typeof plan === 'string') {
    return { accepted: false, reason: plan };
  }
  return {
    accepted: true,
    state: {
      ...state,
      pegs: plan.pegsAfterUndo,
      movesLeft: state.movesLeft - UNDO_COST,
      stageMovesUsed: state.stageMovesUsed + 1,
      stageMoves: state.stageMoves.slice(0, -1),
      stageAssisted: true,
    },
    undoneMove: plan.undoneMove,
  };
}
