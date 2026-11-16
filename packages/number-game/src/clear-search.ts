import { clearPair, countNumbers } from './board.js';
import type { Cell } from './cell.js';
import { findAllValidPairs } from './find-pair.js';

/**
 * Tries orders of matches and returns the fewest numbers any of them leaves on the board, where 0
 * means the board can be cleared completely. The search stops after looking at the given count of
 * different boards, so on a large board the result can be higher than the true fewest.
 */
export function findFewestNumbersLeft(
  cells: readonly Cell[],
  width: number,
  boardBudget: number,
): number {
  const seenBoards = new Set<string>();
  let fewestNumbersLeft = countNumbers(cells);

  const searchFrom = (currentCells: readonly Cell[]): void => {
    if (fewestNumbersLeft === 0 || seenBoards.size >= boardBudget) {
      return;
    }
    const boardKey = currentCells.map((cell) => cell ?? '.').join('');
    if (seenBoards.has(boardKey)) {
      return;
    }
    seenBoards.add(boardKey);
    fewestNumbersLeft = Math.min(fewestNumbersLeft, countNumbers(currentCells));
    for (const pair of findAllValidPairs(currentCells, width)) {
      searchFrom(clearPair(currentCells, width, pair.firstIndex, pair.secondIndex).cells);
    }
  };

  searchFrom(cells);
  return fewestNumbersLeft;
}
