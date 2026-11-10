import { describe, expect, it } from 'vitest';
import { hasLineOfSight } from './line-of-sight.js';
import { cellsFromRows } from './test-support.js';

// Width 10 board where every cell is filled unless a test clears a path.
const FULL_ROW = '1111111111';

function indexAt(row: number, column: number): number {
  return (row - 1) * 10 + (column - 1);
}

describe('hasLineOfSight', () => {
  it('sees horizontally across empty cells', () => {
    const cells = cellsFromRows(['3...7' + '11111']);
    expect(hasLineOfSight(cells, 10, indexAt(1, 1), indexAt(1, 5))).toBe(true);
  });

  it('is blocked horizontally by a number', () => {
    const cells = cellsFromRows(['3.2.7' + '11111']);
    expect(hasLineOfSight(cells, 10, indexAt(1, 1), indexAt(1, 5))).toBe(false);
  });

  it('sees vertically across empty cells', () => {
    const cells = cellsFromRows(['3111111111', '.111111111', '7111111111']);
    expect(hasLineOfSight(cells, 10, indexAt(1, 1), indexAt(3, 1))).toBe(true);
  });

  it('is blocked vertically by a number', () => {
    const cells = cellsFromRows([FULL_ROW, FULL_ROW, FULL_ROW]);
    expect(hasLineOfSight(cells, 10, indexAt(1, 1), indexAt(3, 1))).toBe(false);
  });

  it('sees down-right and down-left diagonals across empty cells', () => {
    const cells = cellsFromRows(['3111111113', '1.111111.1', '1171111711']);
    expect(hasLineOfSight(cells, 10, indexAt(1, 1), indexAt(3, 3))).toBe(true);
    expect(hasLineOfSight(cells, 10, indexAt(1, 10), indexAt(3, 8))).toBe(true);
  });

  it('is blocked diagonally by a number', () => {
    const cells = cellsFromRows([FULL_ROW, FULL_ROW, FULL_ROW]);
    expect(hasLineOfSight(cells, 10, indexAt(1, 1), indexAt(3, 3))).toBe(false);
  });

  it('works the same whichever cell is given first', () => {
    const cells = cellsFromRows(['3111111111', '.111111111', '7111111111']);
    expect(hasLineOfSight(cells, 10, indexAt(3, 1), indexAt(1, 1))).toBe(true);
  });

  it('sees along reading order into the next row (the 3 and 7 example from the rules)', () => {
    // Row 1 column 7 holds a 3, row 2 column 2 holds a 7, and row 1 columns 8 to 10 and row 2
    // column 1 are empty.
    const cells = cellsFromRows(['1111113...', '.711111111']);
    expect(hasLineOfSight(cells, 10, indexAt(1, 7), indexAt(2, 2))).toBe(true);
  });

  it('is blocked along reading order by a number', () => {
    const cells = cellsFromRows(['1111113..1', '.711111111']);
    expect(hasLineOfSight(cells, 10, indexAt(1, 7), indexAt(2, 2))).toBe(false);
  });

  it('does not wrap diagonals around the board edge', () => {
    // Wrapping down-right from row 1 column 10 would pass the empty row 2 column 1 and reach
    // row 3 column 2. Reading order is blocked by the rest of row 2.
    const cells = cellsFromRows(['1111111113', '.111111111', '1711111111']);
    expect(hasLineOfSight(cells, 10, indexAt(1, 10), indexAt(3, 2))).toBe(false);
  });

  it('refuses the same cell twice', () => {
    const cells = cellsFromRows([FULL_ROW]);
    expect(() => hasLineOfSight(cells, 10, 0, 0)).toThrow(RangeError);
  });
});
