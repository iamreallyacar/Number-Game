import { describe, expect, it } from 'vitest';
import {
  cellIndexAt,
  columnOf,
  countFullLines,
  createEmptyCells,
  findFullLines,
  rowOf,
} from './board.js';
import { cellsFromRows } from './test-support.js';

describe('board positions', () => {
  it('turns a row and column into a reading order index and back', () => {
    expect(cellIndexAt(9, 2, 4)).toBe(22);
    expect(rowOf(9, 22)).toBe(2);
    expect(columnOf(9, 22)).toBe(4);
  });

  it('makes an empty board of size times size cells', () => {
    const cells = createEmptyCells(10);
    expect(cells).toHaveLength(100);
    expect(cells.every((cell) => cell === null)).toBe(true);
  });
});

describe('findFullLines', () => {
  it('finds full rows and full columns in increasing order', () => {
    const cells = cellsFromRows([
      '1.....1.',
      '11111111',
      '1.....1.',
      '1.....1.',
      '1.....1.',
      '11111111',
      '1.....1.',
      '1.....1.',
    ]);
    const lines = findFullLines({ size: 8, cells });
    expect(lines).toEqual({ rows: [1, 5], columns: [0, 6] });
    expect(countFullLines(lines)).toBe(4);
  });

  it('finds nothing on an empty board', () => {
    expect(findFullLines({ size: 8, cells: createEmptyCells(8) })).toEqual({
      rows: [],
      columns: [],
    });
  });
});
