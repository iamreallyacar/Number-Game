import { describe, expect, it } from 'vitest';
import { createEmptyCells } from './board.js';
import type { BoardGrid } from './game-state.js';
import {
  coveredCellIndexes,
  fillShape,
  findFitProblem,
  linesClearedByPlacement,
  shapeFitsAnywhere,
  shapeFitsAt,
} from './shape-fit.js';
import { CHECKERBOARD_ROWS, cellsFromRows } from './test-support.js';

const EMPTY_BOARD: BoardGrid = { cells: createEmptyCells() };

const BOARD_WITH_GAP_ROW: BoardGrid = {
  cells: cellsFromRows([
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '1111.11111',
    '..........',
  ]),
};

describe('findFitProblem', () => {
  it('lets a shape fit on an empty board, up to the far edges', () => {
    expect(findFitProblem(EMPTY_BOARD, 'square-3', 0, 0)).toBeNull();
    expect(findFitProblem(EMPTY_BOARD, 'square-3', 7, 7)).toBeNull();
  });

  it.each([
    { where: 'past the right edge', topRow: 0, leftColumn: 8 },
    { where: 'past the bottom edge', topRow: 8, leftColumn: 0 },
    { where: 'above the board', topRow: -1, leftColumn: 0 },
    { where: 'left of the board', topRow: 0, leftColumn: -1 },
    { where: 'at a decimal row', topRow: 0.5, leftColumn: 0 },
    { where: 'at a decimal column', topRow: 0, leftColumn: 1.5 },
  ])('refuses a shape $where', ({ topRow, leftColumn }) => {
    expect(findFitProblem(EMPTY_BOARD, 'square-3', topRow, leftColumn)).toBe('out-of-bounds');
  });

  it('refuses a shape that covers a filled cell', () => {
    expect(findFitProblem(BOARD_WITH_GAP_ROW, 'line-2-vertical', 8, 0)).toBe('cell-occupied');
  });

  it('reports a block off the board before an occupied cell', () => {
    expect(findFitProblem(BOARD_WITH_GAP_ROW, 'line-3-vertical', 8, 0)).toBe('out-of-bounds');
  });

  it('only checks the cells of the shape, not the gaps in its bounding box', () => {
    // Both shapes pass through the gap at row 8 column 4, while the filled cells at row 8 columns 3
    // and 5 sit in the gaps of their bounding boxes.
    expect(findFitProblem(BOARD_WITH_GAP_ROW, 'diagonal-3-up', 7, 3)).toBeNull();
    expect(findFitProblem(BOARD_WITH_GAP_ROW, 't-down', 7, 3)).toBeNull();
  });
});

describe('shapeFitsAt and shapeFitsAnywhere', () => {
  it('agrees with findFitProblem', () => {
    expect(shapeFitsAt(EMPTY_BOARD, 'plus', 0, 0)).toBe(true);
    expect(shapeFitsAt(EMPTY_BOARD, 'plus', 8, 8)).toBe(false);
  });

  it('finds a place on an empty board for every shape size', () => {
    expect(shapeFitsAnywhere(EMPTY_BOARD, 'square-3')).toBe(true);
  });

  it('finds no place when only lone empty cells are left', () => {
    const board: BoardGrid = { cells: cellsFromRows(CHECKERBOARD_ROWS) };
    expect(shapeFitsAnywhere(board, 'single')).toBe(true);
    expect(shapeFitsAnywhere(board, 'diagonal-2-down')).toBe(true);
    expect(shapeFitsAnywhere(board, 'line-2-horizontal')).toBe(false);
    expect(shapeFitsAnywhere(board, 'square-2')).toBe(false);
  });
});

describe('placing cells', () => {
  it('lists the covered cells in reading order and fills them with the shape colour', () => {
    expect(coveredCellIndexes(EMPTY_BOARD, 'corner-small-bottom-right', 1, 2)).toEqual([
      13, 22, 23,
    ]);
    const cells = fillShape(EMPTY_BOARD, 'corner-small-bottom-right', 1, 2);
    expect(cells.filter((cell) => cell !== null)).toEqual([6, 6, 6]);
  });

  it('throws when asked to cover cells for a shape that does not fit', () => {
    expect(() => coveredCellIndexes(BOARD_WITH_GAP_ROW, 'single', 8, 0)).toThrow('cell-occupied');
  });
});

describe('linesClearedByPlacement', () => {
  it('previews the row a placement would fill', () => {
    expect(linesClearedByPlacement(BOARD_WITH_GAP_ROW, 'line-2-vertical', 8, 4)).toEqual({
      rows: [8],
      columns: [],
    });
  });

  it('previews no lines when nothing gets full', () => {
    expect(linesClearedByPlacement(BOARD_WITH_GAP_ROW, 'single', 0, 0)).toEqual({
      rows: [],
      columns: [],
    });
  });

  it('throws for a shape that does not fit', () => {
    expect(() => linesClearedByPlacement(EMPTY_BOARD, 'square-3', 9, 9)).toThrow(RangeError);
  });
});
