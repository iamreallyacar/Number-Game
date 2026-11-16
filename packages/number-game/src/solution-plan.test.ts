import { describe, expect, it } from 'vitest';
import { clearPair, removeEmptyRows } from './board.js';
import type { Cell } from './cell.js';
import { hasLineOfSight } from './line-of-sight.js';
import {
  countPlannedPairsOpenAtStart,
  createPlaceholderBoard,
  planSolution,
  type SolutionPlan,
} from './solution-plan.js';

/** Plays the plan on placeholders, following each cell by its starting index through removed rows. */
function replayPlan(width: number, plan: SolutionPlan): void {
  let cells = createPlaceholderBoard(width);
  let startingRowOfCurrentRow = Array.from({ length: cells.length / width }, (_, row) => row);
  for (const { firstIndex, secondIndex } of plan) {
    const currentIndexOf = (startingIndex: number): number => {
      const currentRow = startingRowOfCurrentRow.indexOf(Math.floor(startingIndex / width));
      expect(currentRow).toBeGreaterThanOrEqual(0);
      return currentRow * width + (startingIndex % width);
    };
    const currentFirst = currentIndexOf(firstIndex);
    const currentSecond = currentIndexOf(secondIndex);
    expect(cells[currentFirst]).not.toBeNull();
    expect(cells[currentSecond]).not.toBeNull();
    expect(hasLineOfSight(cells, width, currentFirst, currentSecond)).toBe(true);
    const clearedCells: Cell[] = cells.map((cell, index) =>
      index === currentFirst || index === currentSecond ? null : cell,
    );
    startingRowOfCurrentRow = startingRowOfCurrentRow.filter((_, row) =>
      clearedCells.slice(row * width, (row + 1) * width).some((cell) => cell !== null),
    );
    cells = clearPair(cells, width, currentFirst, currentSecond).cells;
    expect(cells).toEqual(removeEmptyRows(clearedCells, width).cells);
  }
  expect(cells).toEqual([]);
}

describe('planSolution', () => {
  it.each([2, 4, 6, 10])(
    'plans matches that clear a %i wide board, including across removed rows',
    (width) => {
      for (const chainChance of [0, 0.5, 1]) {
        for (let seed = 0; seed < 20; seed++) {
          replayPlan(width, planSolution(width, chainChance, seed).value);
        }
      }
    },
  );

  it('plans every cell of the board exactly once', () => {
    const plan = planSolution(10, 0.5, 4).value;
    const plannedIndexes = plan.flatMap((pair) => [pair.firstIndex, pair.secondIndex]);
    expect(plan).toHaveLength(50);
    expect(new Set(plannedIndexes).size).toBe(100);
  });

  it('refuses a board with an odd count of cells, which cannot be paired', () => {
    expect(() => planSolution(11, 0.5, 4)).toThrow('odd count');
  });

  it('plans fewer matches that see each other on the starting board when the chain chance is higher', () => {
    for (let seed = 0; seed < 10; seed++) {
      expect(countPlannedPairsOpenAtStart(10, planSolution(10, 1, seed).value)).toBeLessThan(
        countPlannedPairsOpenAtStart(10, planSolution(10, 0, seed).value) / 4,
      );
    }
  });

  it('always opens with at least the first planned match', () => {
    for (let seed = 0; seed < 20; seed++) {
      expect(
        countPlannedPairsOpenAtStart(10, planSolution(10, 1, seed).value),
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('counts the planned matches that see each other on the starting board', () => {
    const plan = [
      { firstIndex: 0, secondIndex: 1 },
      { firstIndex: 2, secondIndex: 13 },
      { firstIndex: 3, secondIndex: 23 },
    ];
    expect(countPlannedPairsOpenAtStart(10, plan)).toBe(2);
  });

  it('plans the same matches from the same random state and leaves a new state', () => {
    expect(planSolution(10, 0.5, 9)).toEqual(planSolution(10, 0.5, 9));
    expect(planSolution(10, 0.5, 9).randomState).not.toBe(9);
    expect(planSolution(10, 0.5, 9).value).not.toEqual(planSolution(10, 0.5, 10).value);
  });
});
