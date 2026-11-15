import { describe, expect, it } from 'vitest';
import { createEmptyCells } from './board.js';
import { canPlaceWholeHand } from './fair-hand.js';
import { CHECKERBOARD_ROWS, cellsFromRows } from './test-support.js';

const EMPTY_BOARD = { cells: createEmptyCells() };

const DIAGONAL_GAP_BOARD = {
  cells: cellsFromRows(
    Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 10 }, (_, column) => (row === column ? '.' : '0')).join(''),
    ),
  ),
};

// One 3 x 3 gap that no line leaves empty, so placing a shape there clears nothing.
const SINGLE_SQUARE_GAP_BOARD = {
  cells: cellsFromRows([
    '...00.0000',
    '...000.000',
    '...0000.00',
    '000.000000',
    '0000.00000',
    '.000000000',
    '0.00000000',
    '00.0000000',
    '00000000.0',
    '000000000.',
  ]),
};

describe('canPlaceWholeHand', () => {
  it('accepts any hand on an empty board, including three big squares, without a long search', () => {
    expect(canPlaceWholeHand(EMPTY_BOARD, ['single', 'plus', 'square-4'])).toBe(true);
    expect(canPlaceWholeHand(EMPTY_BOARD, ['square-4', 'square-4', 'square-4'])).toBe(true);
  });

  it('rejects a hand when one shape fits nowhere', () => {
    const board = { cells: cellsFromRows(CHECKERBOARD_ROWS) };
    expect(canPlaceWholeHand(board, ['single', 'single', 'line-2-horizontal'])).toBe(false);
  });

  it('finds the order when the first placement must clear a line to make room', () => {
    expect(canPlaceWholeHand(DIAGONAL_GAP_BOARD, ['line-2-horizontal'])).toBe(false);
    expect(canPlaceWholeHand(DIAGONAL_GAP_BOARD, ['line-2-horizontal', 'single'])).toBe(true);
  });

  it('rejects a hand whose shapes each fit alone but not together, and fails without a long search', () => {
    expect(canPlaceWholeHand(SINGLE_SQUARE_GAP_BOARD, ['square-3'])).toBe(true);
    expect(canPlaceWholeHand(SINGLE_SQUARE_GAP_BOARD, ['square-3', 'square-3'])).toBe(false);
    expect(canPlaceWholeHand(SINGLE_SQUARE_GAP_BOARD, ['square-3', 'square-3', 'single'])).toBe(
      false,
    );
  });

  it('counts two copies of one shape as needing two separate places', () => {
    expect(canPlaceWholeHand(SINGLE_SQUARE_GAP_BOARD, ['square-3', 'single'])).toBe(true);
    expect(canPlaceWholeHand(SINGLE_SQUARE_GAP_BOARD, ['plus', 'plus'])).toBe(false);
  });
});
