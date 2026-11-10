import { describe, expect, it } from 'vitest';
import { applyAddNumbers, countNumbersToAdd } from './add-numbers.js';
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

  it('throws on a board with no numbers, since clearing the last one starts a new stage', () => {
    const state = makeTestState({ cells: cellsFromRows(['..........']) });
    expect(() => applyAddNumbers(state)).toThrow('at least one number');
  });
});
