import { countNumbers, digitsOnBoard, padToFullRows } from './board.js';
import type { Cell, Digit } from './cell.js';
import type { GameState } from './game-state.js';
import { pairGroupsWithOddCount, pairPartners } from './pair.js';
import { drawRandomItem, drawShuffled, type RandomDraw, type RandomState } from './random.js';

export type AddNumbersRefusal = 'no-uses-left';

export type AddNumbersResult =
  | { readonly accepted: true; readonly state: GameState; readonly addedCount: number }
  | { readonly accepted: false; readonly reason: AddNumbersRefusal };

/**
 * Half of the numbers on the board, rounded up, and never fewer than 1 (NG-17). One more is added
 * when needed so the new numbers can leave every pair group even (NG-34).
 */
export function countNumbersToAdd(cells: readonly Cell[]): number {
  const halfCount = Math.max(1, Math.ceil(countNumbers(cells) / 2));
  const oddGroupCount = pairGroupsWithOddCount(cells).length;
  const count = Math.max(halfCount, oddGroupCount);
  // After one number for each odd group, the rest are added in pairs, so they must be even.
  return count + ((count - oddGroupCount) % 2);
}

/**
 * Draws numbers that leave every pair group on the board even (NG-34): one for each odd group,
 * then the rest in pairs from the same group, all in a random order. Only numbers still on the
 * board are drawn (NG-33). An odd group always has a number on the board, so it can always be evened.
 */
function drawNumbersThatEvenOutPairGroups(
  randomState: RandomState,
  cells: readonly Cell[],
): RandomDraw<Digit[]> {
  const allowedDigits = digitsOnBoard(cells);
  const isAllowed = (digit: Digit): boolean => allowedDigits.includes(digit);
  const count = countNumbersToAdd(cells);
  const digits: Digit[] = [];
  let currentState = randomState;
  for (const oddGroup of pairGroupsWithOddCount(cells)) {
    const draw = drawRandomItem(currentState, oddGroup.filter(isAllowed));
    digits.push(draw.value);
    currentState = draw.randomState;
  }
  while (digits.length < count) {
    const firstDraw = drawRandomItem(currentState, allowedDigits);
    const partnerDraw = drawRandomItem(
      firstDraw.randomState,
      pairPartners(firstDraw.value).filter(isAllowed),
    );
    digits.push(firstDraw.value, partnerDraw.value);
    currentState = partnerDraw.randomState;
  }
  return drawShuffled(currentState, digits);
}

/**
 * Places new random numbers in reading order right after the last number on the board (NG-18).
 * Only numbers still on the board are added, so a number cleared off the board in this stage
 * stays gone until the next stage (NG-33). The new numbers leave every pair group even (NG-34).
 */
export function applyAddNumbers(state: GameState): AddNumbersResult {
  if (state.addNumbersLeft <= 0) {
    return { accepted: false, reason: 'no-uses-left' };
  }
  if (countNumbers(state.cells) === 0) {
    // Clearing the last number always moves on to the next stage, so an empty board here is a
    // mistake in the calling code.
    throw new Error('Add Numbers needs at least one number on the board');
  }
  const draw = drawNumbersThatEvenOutPairGroups(state.randomState, state.cells);
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
    addedCount: draw.value.length,
  };
}
