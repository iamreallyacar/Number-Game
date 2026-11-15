import type { Cell } from './cell.js';
import type { DifficultyPreset } from './difficulty.js';
import { findAllValidPairs } from './find-pair.js';
import { assignPlannedPairDigits } from './planned-pair-digits.js';
import { planSolution, type SolutionPlan } from './solution-plan.js';
import type { RandomDraw, RandomState } from '@local/seeded-random';

const MAX_BOARD_ATTEMPTS = 8;

export interface PlannedStageBoard {
  readonly cells: Cell[];
  readonly plan: SolutionPlan;
}

function distanceFromRange(
  value: number,
  range: DifficultyPreset['startingOpenPairsRange'],
): number {
  return Math.max(range.min - value, value - range.max, 0);
}

/**
 * Builds a stage board together with the solution it was built from (NG-35). Boards are built up
 * to a fixed number of times, and the first one with a count of pairs with line of sight inside the
 * difficulty range is kept, otherwise the one closest to it (DF-04).
 */
export function generateStageBoardWithPlan(
  width: number,
  preset: DifficultyPreset,
  randomState: RandomState,
): RandomDraw<PlannedStageBoard> {
  let currentState = randomState;
  let closest: { board: PlannedStageBoard; distance: number } | null = null;
  for (let attempt = 0; attempt < MAX_BOARD_ATTEMPTS; attempt++) {
    const planDraw = planSolution(width, preset.startingBoardChainChance, currentState);
    const digitsDraw = assignPlannedPairDigits(width, planDraw.value, planDraw.randomState);
    currentState = digitsDraw.randomState;
    const distance = distanceFromRange(
      findAllValidPairs(digitsDraw.value, width).length,
      preset.startingOpenPairsRange,
    );
    if (closest === null || distance < closest.distance) {
      closest = { board: { cells: digitsDraw.value, plan: planDraw.value }, distance };
    }
    if (distance === 0) {
      break;
    }
  }
  if (closest === null) {
    throw new Error('No starting board was built');
  }
  return { value: closest.board, randomState: currentState };
}

/**
 * Fills a new stage board of width x width cells (NG-02), built so it can always be cleared
 * (NG-34, NG-35) and opens with the count of pairs the difficulty asks for.
 */
export function generateStageBoard(
  width: number,
  preset: DifficultyPreset,
  randomState: RandomState,
): RandomDraw<Cell[]> {
  const draw = generateStageBoardWithPlan(width, preset, randomState);
  return { value: draw.value.cells, randomState: draw.randomState };
}
