import { describe, expect, it } from 'vitest';
import { buildAddedNumbersCandidate } from './added-numbers-candidate.js';
import { pairGroupsWithOddCount } from './pair.js';
import { cellsFromRows } from './test-support.js';

describe('buildAddedNumbersCandidate', () => {
  it('pairs the first number with the last number of the board when there are spare numbers', () => {
    const board = cellsFromRows(['1234567891', '23........']);
    for (let seed = 0; seed < 50; seed++) {
      const { value } = buildAddedNumbersCandidate(seed, board, 10, 6, 0);
      expect([3, 7]).toContain(value[0]);
    }
  });

  it('aims every number at a number it sees when the aim chance is 1', () => {
    // The 9 is the only number the first new cell sees. Both odd groups need a number, so the
    // aimed first number is a 9 and the second one is left to be a 2.
    const board = cellsFromRows(['2.........', '.9........']);
    for (let seed = 0; seed < 50; seed++) {
      const { value } = buildAddedNumbersCandidate(seed, board, 10, 2, 1);
      const [first, second] = value;
      expect([first, second]).toEqual([9, 2]);
    }
  });

  it('draws numbers only from digits on the board and leaves every pair group even', () => {
    const board = cellsFromRows(['5.........']);
    expect(buildAddedNumbersCandidate(3, board, 10, 1, 0.5).value).toEqual([5]);
    const odd = cellsFromRows(['1234......']);
    for (let seed = 0; seed < 50; seed++) {
      const { value } = buildAddedNumbersCandidate(seed, odd, 10, 4, 0.5);
      expect(pairGroupsWithOddCount([...odd.slice(0, 4), ...value])).toEqual([]);
      expect([...value].sort()).toEqual([1, 2, 3, 4]);
    }
  });

  it('returns the same set and random state for the same inputs, and moves the state on', () => {
    const board = cellsFromRows(['1234567891']);
    const first = buildAddedNumbersCandidate(8, board, 10, 4, 0.6);
    expect(first).toEqual(buildAddedNumbersCandidate(8, board, 10, 4, 0.6));
    expect(first.randomState).not.toBe(8);
  });

  it('throws on an empty board and on a count that cannot even out the groups', () => {
    expect(() => buildAddedNumbersCandidate(1, cellsFromRows(['..........']), 10, 2, 0.5)).toThrow(
      'at least one number',
    );
    expect(() => buildAddedNumbersCandidate(1, cellsFromRows(['1234......']), 10, 2, 0.5)).toThrow(
      'Cannot even out',
    );
  });
});
