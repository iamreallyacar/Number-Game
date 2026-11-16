import { clearPair, columnOf, rowOf } from './board.js';
import type { Cell, Digit } from './cell.js';
import type { CellPair } from './find-pair.js';
import type { CellIndex } from './game-state.js';
import { findForwardVisibleCells, hasLineOfSight } from './line-of-sight.js';
import {
  drawRandomFraction,
  drawRandomItem,
  type RandomDraw,
  type RandomState,
} from '@local/seeded-random';

// Locked matches between cells this close on the starting board are preferred. Cells that are far
// apart have different neighbours, which leaves too few pair groups to keep every neighbour apart.
const LOCKED_PAIR_REACH = 2;

/** The planned matches in the order they are played. Indexes are positions on the starting board. */
export type SolutionPlan = readonly CellPair[];

// Digits do not exist while a solution is planned, so every cell that will hold a number holds this.
const PLACEHOLDER_DIGIT: Digit = 1;

/** The starting board with a placeholder in every cell. Numbers are cleared in pairs, so the count of cells must be even. */
export function createPlaceholderBoard(width: number): Cell[] {
  const cellCount = width * width;
  if (cellCount % 2 !== 0) {
    throw new Error(`A ${String(width)} wide board has an odd count of cells and cannot be paired`);
  }
  return Array<Cell>(cellCount).fill(PLACEHOLDER_DIGIT);
}

/** How many planned matches can already see each other on the starting board, before any match is made. */
export function countPlannedPairsOpenAtStart(width: number, plan: SolutionPlan): number {
  const startingBoard = createPlaceholderBoard(width);
  return plan.filter((pair) =>
    hasLineOfSight(startingBoard, width, pair.firstIndex, pair.secondIndex),
  ).length;
}

function pairKey(firstIndex: CellIndex, secondIndex: CellIndex, cellCount: number): number {
  return firstIndex * cellCount + secondIndex;
}

function findVisiblePairs(cells: readonly Cell[], width: number): CellPair[] {
  return cells.flatMap((cell, firstIndex) =>
    cell === null
      ? []
      : findForwardVisibleCells(cells, width, firstIndex).map((secondIndex) => ({
          firstIndex,
          secondIndex,
        })),
  );
}

function isNearOnStartingBoard(
  firstIndex: CellIndex,
  secondIndex: CellIndex,
  width: number,
): boolean {
  return (
    Math.abs(rowOf(firstIndex, width) - rowOf(secondIndex, width)) <= LOCKED_PAIR_REACH &&
    Math.abs(columnOf(firstIndex, width) - columnOf(secondIndex, width)) <= LOCKED_PAIR_REACH
  );
}

function indexOfOriginal(originalIndexes: readonly CellIndex[], index: CellIndex): CellIndex {
  const originalIndex = originalIndexes[index];
  if (originalIndex === undefined) {
    throw new RangeError(`Cell ${String(index)} is not on the board being planned`);
  }
  return originalIndex;
}

/**
 * Plans an order of matches that clears the whole starting board by playing forward on placeholders.
 * Each step picks a match between two numbers that see each other on the board as it is by then.
 * A match is locked when its two cells cannot see each other on the starting board, so it only
 * opens up after earlier matches. The chain chance is the chance that a locked match is preferred
 * over an open one at each step.
 */
export function planSolution(
  width: number,
  startingBoardChainChance: number,
  randomState: RandomState,
): RandomDraw<SolutionPlan> {
  const startingBoard = createPlaceholderBoard(width);
  const cellCount = startingBoard.length;
  const openAtStart = new Set(
    findVisiblePairs(startingBoard, width).map((pair) =>
      pairKey(pair.firstIndex, pair.secondIndex, cellCount),
    ),
  );

  let cells = startingBoard;
  // Rows are the only thing that ever gets removed, so one start index per cell and one count per row suffice.
  let originalIndexes = startingBoard.map((_, index) => index);
  let numbersPerRow = Array.from({ length: cellCount / width }, (_, row) =>
    startingBoard
      .slice(row * width, (row + 1) * width)
      .reduce((count, cell) => count + (cell === null ? 0 : 1), 0),
  );
  let numbersLeft = startingBoard.filter((cell) => cell !== null).length;
  let currentState = randomState;
  const plan: CellPair[] = [];

  while (numbersLeft > 0) {
    const lockedPairs: CellPair[] = [];
    const nearLockedPairs: CellPair[] = [];
    const openPairs: CellPair[] = [];
    for (const pair of findVisiblePairs(cells, width)) {
      const key = pairKey(
        indexOfOriginal(originalIndexes, pair.firstIndex),
        indexOfOriginal(originalIndexes, pair.secondIndex),
        cellCount,
      );
      if (openAtStart.has(key)) {
        openPairs.push(pair);
      } else {
        lockedPairs.push(pair);
        if (
          isNearOnStartingBoard(
            indexOfOriginal(originalIndexes, pair.firstIndex),
            indexOfOriginal(originalIndexes, pair.secondIndex),
            width,
          )
        ) {
          nearLockedPairs.push(pair);
        }
      }
    }

    const preferenceDraw = drawRandomFraction(currentState);
    const preferLocked = preferenceDraw.value < startingBoardChainChance;
    const preferred = preferLocked
      ? nearLockedPairs.length > 0
        ? nearLockedPairs
        : lockedPairs
      : openPairs;
    const fallback = preferLocked ? openPairs : lockedPairs;
    const pool = preferred.length > 0 ? preferred : fallback;
    if (pool.length === 0) {
      throw new Error('Solution planning got stuck, which the reading order rule makes impossible');
    }
    const pairDraw = drawRandomItem(preferenceDraw.randomState, pool);
    currentState = pairDraw.randomState;
    const { firstIndex, secondIndex } = pairDraw.value;

    plan.push({
      firstIndex: indexOfOriginal(originalIndexes, firstIndex),
      secondIndex: indexOfOriginal(originalIndexes, secondIndex),
    });

    const cleared = clearPair(cells, width, firstIndex, secondIndex);
    const countsAfterClear = [...numbersPerRow];
    for (const clearedIndex of [firstIndex, secondIndex]) {
      const row = rowOf(clearedIndex, width);
      countsAfterClear[row] = (countsAfterClear[row] ?? 0) - 1;
    }
    const keptRows = countsAfterClear.flatMap((count, row) => (count === 0 ? [] : [row]));
    const removedRowCount = countsAfterClear.length - keptRows.length;
    if (removedRowCount !== cleared.removedRowCount) {
      throw new Error('Tracked row removal does not match the board row removal');
    }
    originalIndexes = originalIndexes.filter(
      (_, index) => countsAfterClear[rowOf(index, width)] !== 0,
    );
    numbersPerRow = keptRows.map((row) => countsAfterClear[row] ?? 0);
    cells = cleared.cells;
    numbersLeft -= 2;
  }
  return { value: plan, randomState: currentState };
}
