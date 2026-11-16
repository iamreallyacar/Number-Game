import { describe, expect, it } from 'vitest';
import { applyAddNumbers, countNumbersToAdd } from './add-numbers.js';
import { countNumbers, padToFullRows } from './board.js';
import type { Cell } from './cell.js';
import { findValidPair } from './find-pair.js';
import { BOARD_WIDTH, type GameState } from './game-state.js';
import { pairGroupsWithOddCount } from './pair.js';
import { cellsFromRows, makeTestState } from './test-support.js';

describe('countNumbersToAdd', () => {
  it('adds half of the numbers on the board, rounded up', () => {
    expect(countNumbersToAdd(cellsFromRows(['1919......']))).toBe(2);
    expect(countNumbersToAdd(cellsFromRows(['19191.....']))).toBe(3);
  });

  it('adds at least one number', () => {
    expect(countNumbersToAdd(cellsFromRows(['1.........']))).toBe(1);
  });

  it('adds one more when half would leave a number with nothing to pair with', () => {
    // Every pair group is even, so 3 new numbers would always leave one of them alone.
    expect(countNumbersToAdd(cellsFromRows(['191919....']))).toBe(4);
    // 1 new number evens out the 1 and 9 group, and the second needs a partner.
    expect(countNumbersToAdd(cellsFromRows(['199.......']))).toBe(3);
  });

  it('adds at least one number for each odd pair group', () => {
    expect(countNumbersToAdd(cellsFromRows(['1234......']))).toBe(4);
  });
});

describe('applyAddNumbers', () => {
  it('places new numbers right after the last number, filling its row then new rows', () => {
    const state = makeTestState({ cells: cellsFromRows(['1.11111111', '11111111..']) });
    const result = applyAddNumbers(state);
    if (!result.accepted) {
      throw new Error(`Expected Add Numbers to be accepted, got ${result.reason}`);
    }
    expect(result.addedCount).toBe(9);
    const { cells } = result.state;
    expect(cells).toHaveLength(30);
    expect(cells.slice(0, 18)).toEqual(state.cells.slice(0, 18));
    expect(cells.slice(18, 27).every((cell) => cell !== null)).toBe(true);
    expect(cells.slice(27)).toEqual([null, null, null]);
  });

  it('fills empty cells left after the last number instead of skipping them', () => {
    const state = makeTestState({ cells: cellsFromRows(['11......11', '1.........']) });
    const result = applyAddNumbers(state);
    expect(result.accepted && result.state.cells.slice(10, 14).every((cell) => cell !== null)).toBe(
      true,
    );
    expect(result.accepted && result.state.cells.slice(14)).toEqual(Array(6).fill(null));
  });

  it('uses one Add Numbers and moves the random state on', () => {
    const state = makeTestState({ cells: cellsFromRows(['1111111111']), addNumbersLeft: 2 });
    const result = applyAddNumbers(state);
    expect(result.accepted && result.state.addNumbersLeft).toBe(1);
    expect(result.accepted && result.state.randomState).not.toBe(state.randomState);
  });

  it('gives the same numbers for the same state', () => {
    const state = makeTestState({ cells: cellsFromRows(['1111111111']) });
    expect(applyAddNumbers(state)).toEqual(applyAddNumbers(state));
  });

  it('refuses when no uses are left', () => {
    const state = makeTestState({ cells: cellsFromRows(['1111111111']), addNumbersLeft: 0 });
    expect(applyAddNumbers(state)).toEqual({ accepted: false, reason: 'no-uses-left' });
  });

  it('adds only numbers that are still on the board', () => {
    const state = makeTestState({ cells: cellsFromRows(['37.37.3773', '7337......']) });
    const result = applyAddNumbers(state);
    if (!result.accepted) {
      throw new Error(`Expected Add Numbers to be accepted, got ${result.reason}`);
    }
    const addedDigits = result.state.cells.slice(14).filter((cell) => cell !== null);
    expect(addedDigits).toHaveLength(result.addedCount);
    expect(new Set(addedDigits)).toEqual(new Set([3, 7]));
  });

  it.each([
    ['7866......'],
    ['37.37.3773', '7337......'],
    ['1234567899', '2.........'],
    ['5.........'],
    ['12........'],
  ])('leaves every pair group even after adding to %s', (...rows: string[]) => {
    for (let seed = 0; seed < 50; seed++) {
      const result = applyAddNumbers(
        makeTestState({ cells: cellsFromRows(rows), randomState: seed }),
      );
      if (!result.accepted) {
        throw new Error(`Expected Add Numbers to be accepted, got ${result.reason}`);
      }
      expect(pairGroupsWithOddCount(result.state.cells)).toEqual([]);
    }
  });

  it.each([
    [['3.........'], 1],
    [['34........'], 2],
    [['555.......'], 3],
    [['.........4'], 1],
  ])('adds the right count to a small board %j', (rows: string[], expectedCount: number) => {
    for (let seed = 0; seed < 30; seed++) {
      const state = makeTestState({ cells: cellsFromRows(rows), randomState: seed });
      const result = applyAddNumbers(state);
      expect(result.accepted && result.addedCount).toBe(expectedCount);
      expect(result.accepted && pairGroupsWithOddCount(result.state.cells)).toEqual([]);
    }
  });

  it('adds half of a very large board without stalling', () => {
    const rows = Array<string>(100).fill('1234567891');
    const state = makeTestState({ cells: cellsFromRows(rows), difficulty: 'easy' });
    const result = applyAddNumbers(state);
    expect(result.accepted && result.addedCount).toBe(500);
  });

  it('throws on a board with no numbers, since clearing the last one starts a new stage', () => {
    const state = makeTestState({ cells: cellsFromRows(['..........']) });
    expect(() => applyAddNumbers(state)).toThrow('at least one number');
  });
});

const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
const SEED_COUNT = 40;

// A board with a few gaps and a stranded number, so Add Numbers has something to aim at.
function randomBoardRows(width: number, seed: number): string[] {
  const digits = Array.from({ length: width * 3 }, (_, index) => {
    const value = (Math.imul(index + 1, 2654435761) ^ Math.imul(seed + 1, 40503)) >>> 0;
    return value % 7 === 0 ? '.' : String(((value >>> 8) % 9) + 1);
  });
  return Array.from({ length: 3 }, (_, row) =>
    digits.slice(row * width, (row + 1) * width).join(''),
  );
}

function pressAddNumbers(state: GameState): {
  cells: readonly Cell[];
  addedCount: number;
  state: GameState;
} {
  const result = applyAddNumbers(state);
  if (!result.accepted) {
    throw new Error(`Expected Add Numbers to be accepted, got ${result.reason}`);
  }
  return { cells: result.state.cells, addedCount: result.addedCount, state: result.state };
}

describe('applyAddNumbers on many boards', () => {
  it.each(DIFFICULTIES)('follows the rules on %s', (difficulty) => {
    const width = BOARD_WIDTH;
    for (let seed = 0; seed < SEED_COUNT; seed++) {
      const cells = padToFullRows(cellsFromRows(randomBoardRows(width, seed)), width);
      if (countNumbers(cells) === 0) {
        continue;
      }
      const state = makeTestState({ cells, difficulty, randomState: seed });
      const result = pressAddNumbers(state);
      const lastNumberIndex = cells.findLastIndex((cell) => cell !== null);
      const added = result.cells.slice(lastNumberIndex + 1).filter((cell) => cell !== null);

      expect(result.addedCount).toBe(countNumbersToAdd(cells));
      expect(added).toHaveLength(result.addedCount);
      expect(result.cells.slice(0, lastNumberIndex + 1)).toEqual(
        cells.slice(0, lastNumberIndex + 1),
      );
      expect(result.cells.slice(lastNumberIndex + 1, lastNumberIndex + 1 + added.length)).toEqual(
        added,
      );
      expect(pairGroupsWithOddCount(result.cells)).toEqual([]);
      const digitsBefore = new Set(cells.filter((cell) => cell !== null));
      expect(added.every((digit) => digitsBefore.has(digit))).toBe(true);
      expect(pressAddNumbers(state)).toEqual(result);
      if (result.addedCount > pairGroupsWithOddCount(cells).length) {
        expect(findValidPair(result.cells, width)).not.toBeNull();
      }
    }
  });
});

describe('applyAddNumbers on every preset', () => {
  it('adds the same numbers on every preset from the same board and random state', () => {
    for (let seed = 0; seed < SEED_COUNT; seed++) {
      const cells = padToFullRows(cellsFromRows(randomBoardRows(BOARD_WIDTH, seed)), BOARD_WIDTH);
      if (countNumbers(cells) === 0) {
        continue;
      }
      const [easyCells, ...otherCells] = DIFFICULTIES.map(
        (difficulty) =>
          pressAddNumbers(makeTestState({ cells, difficulty, randomState: seed })).cells,
      );
      for (const presetCells of otherCells) {
        expect(presetCells).toEqual(easyCells);
      }
    }
  });
});
