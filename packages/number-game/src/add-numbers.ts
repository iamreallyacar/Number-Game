import { buildAddedNumbersCandidate } from './added-numbers-candidate.js';
import { countNumbers, padToFullRows } from './board.js';
import type { Cell, Digit } from './cell.js';
import { findFewestNumbersLeft } from './clear-search.js';
import { BOARD_WIDTH, type GameState } from './game-state.js';
import { pairGroupsWithOddCount } from './pair.js';
import type { RandomDraw, RandomState } from '@local/seeded-random';

/** Chance that each added number is aimed at a number it will see, the same on every preset (NG-36, DF-05). */
const ADD_NUMBERS_AIM_CHANCE = 0.5;

/** Add Numbers never adds fewer numbers than this, so the new numbers reach under every column (NG-17). */
const MIN_NUMBERS_TO_ADD = BOARD_WIDTH;

/** A board with at most this many numbers gets a set of new numbers that is checked by search (NG-36, DF-05). */
const SMALL_BOARD_NUMBER_LIMIT = 20;

/** How many sets of new numbers are tried on a small board before the best one is kept (NG-36, DF-05). */
const SMALL_BOARD_CANDIDATE_COUNT = 8;

/** How many different boards the search may look at for each set of new numbers on a small board. */
const SMALL_BOARD_SEARCH_BUDGET = 2000;

export type AddNumbersRefusal = 'no-uses-left';

export type AddNumbersResult =
  | { readonly accepted: true; readonly state: GameState; readonly addedCount: number }
  | { readonly accepted: false; readonly reason: AddNumbersRefusal };

/**
 * Half of the numbers on the board, rounded up, and never fewer than one row of numbers (NG-17).
 * One more is added when needed so the new numbers can leave every pair group even (NG-34).
 */
export function countNumbersToAdd(cells: readonly Cell[]): number {
  const halfCount = Math.ceil(countNumbers(cells) / 2);
  const oddGroupCount = pairGroupsWithOddCount(cells).length;
  // There are 5 pair groups, so one row of numbers always covers every odd group.
  const count = Math.max(halfCount, MIN_NUMBERS_TO_ADD);
  // After one number for each odd group, the rest are added in pairs, so they must be even.
  return count + ((count - oddGroupCount) % 2);
}

/**
 * Builds one set of new numbers for a board above the small board limit. On a small board it
 * builds sets until the search finds one that lets the whole board be cleared, and otherwise keeps
 * the set that leaves the fewest numbers. The earliest set wins a tie (NG-36).
 */
function chooseAddedNumbers(state: GameState): RandomDraw<Digit[]> {
  const count = countNumbersToAdd(state.cells);
  const lastNumberIndex = state.cells.findLastIndex((cell) => cell !== null);
  const cellsUpToLastNumber = state.cells.slice(0, lastNumberIndex + 1);
  const buildCandidate = (randomState: RandomState): RandomDraw<Digit[]> =>
    buildAddedNumbersCandidate(
      randomState,
      state.cells,
      BOARD_WIDTH,
      count,
      ADD_NUMBERS_AIM_CHANCE,
    );

  if (countNumbers(state.cells) > SMALL_BOARD_NUMBER_LIMIT) {
    return buildCandidate(state.randomState);
  }
  let bestDigits: Digit[] | null = null;
  let fewestNumbersLeft = Infinity;
  let currentState = state.randomState;
  for (let attempt = 0; attempt < SMALL_BOARD_CANDIDATE_COUNT && fewestNumbersLeft > 0; attempt++) {
    const candidate = buildCandidate(currentState);
    currentState = candidate.randomState;
    const numbersLeft = findFewestNumbersLeft(
      [...cellsUpToLastNumber, ...candidate.value],
      BOARD_WIDTH,
      SMALL_BOARD_SEARCH_BUDGET,
    );
    if (numbersLeft < fewestNumbersLeft) {
      fewestNumbersLeft = numbersLeft;
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
  const draw = chooseAddedNumbers(state);
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
