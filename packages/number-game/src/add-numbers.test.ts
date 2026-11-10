import { describe, expect, it } from 'vitest';
import { applyAddNumbers, countNumbersToAdd } from './add-numbers.js';
import { cellsFromRows, makeTestState } from './test-support.js';

describe('countNumbersToAdd', () => {
  it('adds half of the numbers on the board, rounded up', () => {
    expect(countNumbersToAdd(cellsFromRows(['1234.'.padEnd(10, '.')]))).toBe(2);
    expect(countNumbersToAdd(cellsFromRows(['12345'.padEnd(10, '.')]))).toBe(3);
  });

  it('adds at least one number', () => {
    expect(countNumbersToAdd([])).toBe(1);
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
});
