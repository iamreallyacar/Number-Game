import type { Cell } from './cell.js';
import type { CellIndex, GameState } from './game-state.js';
import { findForwardVisibleCells } from './line-of-sight.js';
import { isPair } from './pair.js';

export interface CellPair {
  readonly firstIndex: CellIndex;
  readonly secondIndex: CellIndex;
}

/** Finds the first pair with line of sight in reading order, or null when no move is left. */
export function findValidPair(cells: readonly Cell[], width: number): CellPair | null {
  for (const [firstIndex, firstCell] of cells.entries()) {
    if (firstCell === null) {
      continue;
    }
    for (const secondIndex of findForwardVisibleCells(cells, width, firstIndex)) {
      const secondCell = cells[secondIndex];
      if (secondCell !== null && secondCell !== undefined && isPair(firstCell, secondCell)) {
        return { firstIndex, secondIndex };
      }
    }
  }
  return null;
}

/** No pair is left, but Add Numbers can still help (NG-25). */
export function isStuck(state: GameState): boolean {
  return state.addNumbersLeft > 0 && findValidPair(state.cells, state.width) === null;
}

/** No pair is left and Add Numbers is used up (NG-26). */
export function isGameOver(state: GameState): boolean {
  return state.addNumbersLeft <= 0 && findValidPair(state.cells, state.width) === null;
}
