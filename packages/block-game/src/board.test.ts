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
    expect(cellIndexAt(2, 4)).toBe(24);
    expect(rowOf(24)).toBe(2);
    expect(columnOf(24)).toBe(4);
  });

  it('makes an empty board of 10 times 10 cells', () => {
    const cells = createEmptyCells();
    expect(cells).toHaveLength(100);
    expect(cells.every((cell) => cell === null)).toBe(true);
  });
});

describe('findFullLines', () => {
  it('finds full rows and full columns in increasing order', () => {
    const cells = cellsFromRows([
      '1......1..',
      '1111111111',
      '1......1..',
      '1......1..',
      '1......1..',
      '1111111111',
      '1......1..',
      '1......1..',
      '1......1..',
      '1......1..',
    ]);
    const lines = findFullLines({ cells });
    expect(lines).toEqual({ rows: [1, 5], columns: [0, 7] });
    expect(countFullLines(lines)).toBe(4);
  });

  it('finds nothing on an empty board', () => {
    expect(findFullLines({ cells: createEmptyCells() })).toEqual({
      rows: [],
      columns: [],
    });
  });
});
