import { describe, expect, it } from 'vitest';
import { findFewestNumbersLeft } from './clear-search.js';
import { cellsFromRows } from './test-support.js';

describe('findFewestNumbersLeft', () => {
  it('returns 0 for a board that can be cleared completely', () => {
    expect(findFewestNumbersLeft(cellsFromRows(['1991......']), 10, 100)).toBe(0);
  });

  it('follows what opens up after a match, including a removed row', () => {
    const cells = cellsFromRows(['1.', '.9', '3.', '.7']);
    expect(findFewestNumbersLeft(cells, 2, 100)).toBe(0);
  });

  it('finds the order of matches that clears the board when another order gets stuck', () => {
    // Matching the two 1s in the top row first leaves 2, 1, 2, 1 in a line that cannot be cleared.
    const cells = cellsFromRows(['.1...1....', '2121......']);
    expect(findFewestNumbersLeft(cells, 10, 1000)).toBe(0);
  });

  it('returns the numbers left when no order clears the board', () => {
    expect(findFewestNumbersLeft(cellsFromRows(['1923......']), 10, 100)).toBe(2);
    expect(findFewestNumbersLeft(cellsFromRows(['12', '34']), 2, 100)).toBe(4);
  });

  it('stops at the board budget', () => {
    expect(findFewestNumbersLeft(cellsFromRows(['1991......']), 10, 1)).toBe(4);
  });
});
