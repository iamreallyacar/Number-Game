import { describe, expect, it } from 'vitest';
import { clearPair } from './board.js';
import type { Cell } from './cell.js';
import { DIFFICULTY_IDS, DIFFICULTY_PRESETS, type DifficultyId } from './difficulty.js';
import { findAllValidPairs } from './find-pair.js';
import { BOARD_WIDTH } from './game-state.js';
import { hasLineOfSight } from './line-of-sight.js';
import { isPair, pairGroupsWithOddCount } from './pair.js';
import { generateStageBoard, generateStageBoardWithPlan } from './stage-board.js';

const SEED_COUNT = 25;
const SLOW_TEST_TIMEOUT_MS = 60_000;

function seedsOf(count: number): number[] {
  return Array.from({ length: count }, (_, seed) => seed * 7919 + 1);
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
}

function countOpeningPairs(width: number, difficulty: DifficultyId, seed: number): number {
  const preset = DIFFICULTY_PRESETS[difficulty];
  return findAllValidPairs(generateStageBoard(width, preset, seed).value, width).length;
}

/** Plays the planned matches with the real rules, following cells by their starting row through removed rows. */
function clearBoardWithPlan(
  cells: readonly Cell[],
  width: number,
  plan: readonly { firstIndex: number; secondIndex: number }[],
): Cell[] {
  let currentCells = [...cells];
  let startingRowOfCurrentRow = Array.from(
    { length: currentCells.length / width },
    (_, row) => row,
  );
  for (const { firstIndex, secondIndex } of plan) {
    const currentIndexOf = (startingIndex: number): number =>
      startingRowOfCurrentRow.indexOf(Math.floor(startingIndex / width)) * width +
      (startingIndex % width);
    const currentFirst = currentIndexOf(firstIndex);
    const currentSecond = currentIndexOf(secondIndex);
    const first = currentCells[currentFirst];
    const second = currentCells[currentSecond];
    expect(first !== null && first !== undefined && second !== null && second !== undefined).toBe(
      true,
    );
    expect(
      first !== null && first !== undefined && second !== null && second !== undefined
        ? isPair(first, second)
        : false,
    ).toBe(true);
    expect(hasLineOfSight(currentCells, width, currentFirst, currentSecond)).toBe(true);
    const cleared = currentCells.map((cell, index) =>
      index === currentFirst || index === currentSecond ? null : cell,
    );
    startingRowOfCurrentRow = startingRowOfCurrentRow.filter((_, row) =>
      cleared.slice(row * width, (row + 1) * width).some((cell) => cell !== null),
    );
    currentCells = clearPair(currentCells, width, currentFirst, currentSecond).cells;
  }
  return currentCells;
}

describe('generateStageBoard', () => {
  it.each(DIFFICULTY_IDS)(
    'builds %s boards that the planned solution clears completely with the real rules',
    (difficulty) => {
      for (const seed of seedsOf(SEED_COUNT)) {
        const { value } = generateStageBoardWithPlan(
          BOARD_WIDTH,
          DIFFICULTY_PRESETS[difficulty],
          seed,
        );
        expect(clearBoardWithPlan(value.cells, BOARD_WIDTH, value.plan)).toEqual([]);
      }
    },
    SLOW_TEST_TIMEOUT_MS,
  );

  it('fills the board with numbers in every cell', () => {
    for (const difficulty of DIFFICULTY_IDS) {
      for (const seed of seedsOf(5)) {
        const cells = generateStageBoard(BOARD_WIDTH, DIFFICULTY_PRESETS[difficulty], seed).value;
        expect(cells).toHaveLength(BOARD_WIDTH * BOARD_WIDTH);
        expect(cells.every((cell) => cell !== null)).toBe(true);
        expect(pairGroupsWithOddCount(cells)).toEqual([]);
      }
    }
  });

  it('refuses a board with an odd count of cells, which cannot be paired', () => {
    expect(() => generateStageBoard(11, DIFFICULTY_PRESETS.normal, 5)).toThrow('odd count');
  });

  it('builds the same board and random state from the same state, and other boards from other seeds', () => {
    const preset = DIFFICULTY_PRESETS.normal;
    expect(generateStageBoard(BOARD_WIDTH, preset, 5)).toEqual(
      generateStageBoard(BOARD_WIDTH, preset, 5),
    );
    expect(generateStageBoard(BOARD_WIDTH, preset, 5).randomState).not.toBe(5);
    expect(generateStageBoard(BOARD_WIDTH, preset, 5).value).not.toEqual(
      generateStageBoard(BOARD_WIDTH, preset, 6).value,
    );
  });

  it(
    'opens with more pairs on easier difficulties',
    () => {
      const medians = DIFFICULTY_IDS.map((difficulty) =>
        median(seedsOf(SEED_COUNT).map((seed) => countOpeningPairs(BOARD_WIDTH, difficulty, seed))),
      );
      const [easyMedian, normalMedian, hardMedian] = medians;
      expect(easyMedian).toBeGreaterThan(normalMedian ?? Number.NaN);
      expect(normalMedian).toBeGreaterThan(hardMedian ?? Number.NaN);
    },
    SLOW_TEST_TIMEOUT_MS,
  );

  it.each(DIFFICULTY_IDS)(
    'opens most %s boards inside the count of pairs the preset asks for',
    (difficulty) => {
      const { min, max } = DIFFICULTY_PRESETS[difficulty].startingOpenPairsRange;
      const counts = seedsOf(SEED_COUNT).map((seed) =>
        countOpeningPairs(BOARD_WIDTH, difficulty, seed),
      );
      const insideCount = counts.filter((count) => count >= min && count <= max).length;
      expect(insideCount / counts.length).toBeGreaterThanOrEqual(0.8);
    },
    SLOW_TEST_TIMEOUT_MS,
  );
});
