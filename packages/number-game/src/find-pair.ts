import type { Cell } from './cell.js';
import { BOARD_WIDTH, type CellIndex, type GameState } from './game-state.js';
import { findForwardVisibleCells } from './line-of-sight.js';
import { isPair } from './pair.js';

export interface CellPair {
  readonly firstIndex: CellIndex;
  readonly secondIndex: CellIndex;
}

function* iterateValidPairs(cells: readonly Cell[], width: number): Generator<CellPair> {
  for (const [firstIndex, firstCell] of cells.entries()) {
    if (firstCell === null) {
      continue;
    }
    for (const secondIndex of findForwardVisibleCells(cells, width, firstIndex)) {
      const secondCell = cells[secondIndex];
      if (secondCell !== null && secondCell !== undefined && isPair(firstCell, secondCell)) {
        yield { firstIndex, secondIndex };
      }
    }
  }
}

/** Finds the first pair with line of sight in reading order, or null when no move is left. */
export function findValidPair(cells: readonly Cell[], width: number): CellPair | null {
  const firstPair = iterateValidPairs(cells, width).next();
  return firstPair.done === true ? null : firstPair.value;
}

/** Every pair with line of sight, ordered by its earlier cell in reading order. */
export function findAllValidPairs(cells: readonly Cell[], width: number): CellPair[] {
  return Array.from(iterateValidPairs(cells, width));
}

/** No pair is left, but Add Numbers can still help (NG-25). */
export function isStuck(state: GameState): boolean {
  return state.addNumbersLeft > 0 && findValidPair(state.cells, BOARD_WIDTH) === null;
}

/** No pair is left and Add Numbers is used up (NG-26). */
export function isGameOver(state: GameState): boolean {
  return state.addNumbersLeft <= 0 && findValidPair(state.cells, BOARD_WIDTH) === null;
}
