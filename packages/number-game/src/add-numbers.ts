import { countNumbers, padToFullRows } from './board.js';
import type { Cell } from './cell.js';
import type { GameState } from './game-state.js';
import { drawRandomDigits } from './random.js';

export type AddNumbersRefusal = 'no-uses-left';

export type AddNumbersResult =
  | { readonly accepted: true; readonly state: GameState; readonly addedCount: number }
  | { readonly accepted: false; readonly reason: AddNumbersRefusal };

/** Half of the numbers on the board, rounded up, and never fewer than 1 (NG-17). */
export function countNumbersToAdd(cells: readonly Cell[]): number {
  return Math.max(1, Math.ceil(countNumbers(cells) / 2));
}

/** Places new random numbers in reading order right after the last number on the board (NG-18). */
export function applyAddNumbers(state: GameState): AddNumbersResult {
  if (state.addNumbersLeft <= 0) {
    return { accepted: false, reason: 'no-uses-left' };
  }
  const addedCount = countNumbersToAdd(state.cells);
  const draw = drawRandomDigits(state.randomState, addedCount);
  const lastNumberIndex = state.cells.findLastIndex((cell) => cell !== null);
  const cellsUpToLastNumber = state.cells.slice(0, lastNumberIndex + 1);
  return {
    accepted: true,
    state: {
      ...state,
      cells: padToFullRows([...cellsUpToLastNumber, ...draw.value], state.width),
      addNumbersLeft: state.addNumbersLeft - 1,
      randomState: draw.randomState,
    },
    addedCount,
  };
}
