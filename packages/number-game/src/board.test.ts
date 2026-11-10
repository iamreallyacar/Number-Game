import { describe, expect, it } from 'vitest';
import { padToFullRows, removeEmptyRows } from './board.js';
import { cellsFromRows } from './test-support.js';

describe('removeEmptyRows', () => {
  it('removes fully empty rows and moves the rows below up', () => {
    const cells = cellsFromRows(['12', '..', '34', '..']);
    expect(removeEmptyRows(cells, 2)).toEqual({
      cells: cellsFromRows(['12', '34']),
      removedRowCount: 2,
    });
  });

  it('keeps gaps in rows that still hold a number', () => {
    const cells = cellsFromRows(['1.', '.4']);
    expect(removeEmptyRows(cells, 2)).toEqual({ cells, removedRowCount: 0 });
  });
});

describe('padToFullRows', () => {
  it('fills the last row with empty cells', () => {
    expect(padToFullRows(cellsFromRows(['123', '4']), 3)).toEqual(cellsFromRows(['123', '4..']));
  });

  it('leaves full rows alone', () => {
    const cells = cellsFromRows(['123']);
    expect(padToFullRows(cells, 3)).toEqual(cells);
  });
});
