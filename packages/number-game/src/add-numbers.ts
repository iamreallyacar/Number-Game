import { buildAddedNumbersCandidate } from './added-numbers-candidate.js';
import { countNumbers, padToFullRows } from './board.js';
import type { Cell, Digit } from './cell.js';
import { BOARD_WIDTH, type GameState } from './game-state.js';
import { pairGroupsWithOddCount } from './pair.js';
import { countNumbersClearedByPlayAhead } from './play-ahead.js';
import type { RandomDraw } from '@local/seeded-random';

/** Chance that each added number is aimed at a number it will see, the same on every preset (NG-36, DF-05). */
const ADD_NUMBERS_AIM_CHANCE = 0.5;

/** How many sets of added numbers are built and played ahead before one is kept, the same on every preset (NG-36, DF-05). */
const ADD_NUMBERS_CANDIDATE_COUNT = 1;

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
 * Builds several sets of new numbers, plays each one ahead on the board with the set added, and
 * keeps the set that clears the most numbers. The earliest set wins a tie (NG-36).
 */
function chooseBestAddedNumbers(state: GameState): RandomDraw<Digit[]> {
  const count = countNumbersToAdd(state.cells);
  const lastNumberIndex = state.cells.findLastIndex((cell) => cell !== null);
  const cellsUpToLastNumber = state.cells.slice(0, lastNumberIndex + 1);
  let bestDigits: Digit[] | null = null;
  let bestScore = -1;
  let currentState = state.randomState;
  for (let attempt = 0; attempt < ADD_NUMBERS_CANDIDATE_COUNT; attempt++) {
    const candidate = buildAddedNumbersCandidate(
      currentState,
      state.cells,
      BOARD_WIDTH,
      count,
      ADD_NUMBERS_AIM_CHANCE,
    );
    currentState = candidate.randomState;
    const score = countNumbersClearedByPlayAhead(
      [...cellsUpToLastNumber, ...candidate.value],
      BOARD_WIDTH,
    );
    if (score > bestScore) {
      bestScore = score;
      bestDigits = candidate.value;
    }
  }
  if (bestDigits === null) {
    throw new Error('Add Numbers must try at least one set of added numbers');
  }
  return { value: bestDigits, randomState: currentState };
}

/**
 * Places new numbers in reading order right after the last number on the board (NG-18). Only
 * numbers still on the board are added (NG-33), every pair group is left even (NG-34), and the
 * numbers are aimed to be matchable (NG-36).
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
  const draw = chooseBestAddedNumbers(state);
  const lastNumberIndex = state.cells.findLastIndex((cell) => cell !== null);
  const cellsUpToLastNumber = state.cells.slice(0, lastNumberIndex + 1);
  return {
    accepted: true,
    state: {
      ...state,
      cells: padToFullRows([...cellsUpToLastNumber, ...draw.value], BOARD_WIDTH),
      addNumbersLeft: state.addNumbersLeft - 1,
      randomState: draw.randomState,
    },
    addedCount: draw.value.length,
  };
}
