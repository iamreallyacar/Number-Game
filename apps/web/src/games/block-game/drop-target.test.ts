import { describe, expect, it } from 'vitest';
import {
  cellPitchOf,
  findDropTarget,
  grabOffsetFor,
  TOUCH_LIFT_PX,
  type BoardMetrics,
} from './drop-target.js';

// 10 cells of 39px with 1px grid lines between them: 10 * 39 + 9 = 399px, so each cell starts 40px
// after the one before.
const BOARD: BoardMetrics = { left: 100, top: 200, innerWidth: 399, gridLinePx: 1 };
const SQUARE_2 = { width: 2, height: 2 };
const LINE_5_WIDE = { width: 5, height: 1 };
const SQUARE_4 = { width: 4, height: 4 };
const LINE_3_WIDE = { width: 3, height: 1 };

describe('cellPitchOf', () => {
  it('shares the board width and grid lines out between the cells', () => {
    expect(cellPitchOf(BOARD)).toBe(40);
  });
});

describe('grabOffsetFor', () => {
  it('holds the shape by its middle with a mouse or pen', () => {
    expect(grabOffsetFor(LINE_3_WIDE, 40, 'mouse')).toEqual({ x: 60, y: 20 });
    expect(grabOffsetFor(LINE_3_WIDE, 40, 'pen')).toEqual({ x: 60, y: 20 });
  });

  it('holds the biggest shapes by their middle', () => {
    expect(grabOffsetFor(LINE_5_WIDE, 40, 'mouse')).toEqual({ x: 100, y: 20 });
    expect(grabOffsetFor(SQUARE_4, 40, 'touch')).toEqual({ x: 80, y: 160 + TOUCH_LIFT_PX });
  });

  it('lifts the shape above the finger on touch', () => {
    expect(grabOffsetFor(SQUARE_2, 40, 'touch')).toEqual({ x: 40, y: 80 + TOUCH_LIFT_PX });
  });
});

describe('findDropTarget', () => {
  it('snaps the shape to the nearest cell', () => {
    expect(findDropTarget(BOARD, SQUARE_2, { x: 100 + 3 * 40 + 15, y: 200 + 2 * 40 - 15 })).toEqual(
      { topRow: 2, leftColumn: 3 },
    );
  });

  it('pulls a shape that sticks out over an edge back onto the board', () => {
    expect(findDropTarget(BOARD, LINE_3_WIDE, { x: 100 - 30, y: 200 - 15 })).toEqual({
      topRow: 0,
      leftColumn: 0,
    });
    expect(
      findDropTarget(BOARD, LINE_3_WIDE, { x: 100 + 8 * 40 + 10, y: 200 + 9 * 40 + 15 }),
    ).toEqual({ topRow: 9, leftColumn: 7 });
  });

  it('keeps a 5 wide line fully on the board in the last columns', () => {
    expect(findDropTarget(BOARD, LINE_5_WIDE, { x: 100 + 5 * 40 + 8, y: 200 + 4 * 40 })).toEqual({
      topRow: 4,
      leftColumn: 5,
    });
    expect(findDropTarget(BOARD, LINE_5_WIDE, { x: 100 + 7 * 40, y: 200 + 4 * 40 })).toEqual({
      topRow: 4,
      leftColumn: 5,
    });
  });

  it('puts a 4 x 4 square in the bottom right corner when dropped near it', () => {
    expect(findDropTarget(BOARD, SQUARE_4, { x: 100 + 6 * 40 + 10, y: 200 + 6 * 40 + 10 })).toEqual(
      { topRow: 6, leftColumn: 6 },
    );
    expect(findDropTarget(BOARD, SQUARE_4, { x: 100 + 8 * 40, y: 200 + 8 * 40 })).toEqual({
      topRow: 6,
      leftColumn: 6,
    });
  });

  it('gives no target when the middle of the shape is off the board', () => {
    // The middle of the line is 60px to the right of its left edge.
    expect(findDropTarget(BOARD, LINE_3_WIDE, { x: 100 - 61, y: 200 })).toBeNull();
    expect(findDropTarget(BOARD, SQUARE_2, { x: 100, y: 200 + 400 - 39 })).toBeNull();
    expect(findDropTarget(BOARD, SQUARE_2, { x: 100, y: 200 - 41 })).toBeNull();
  });
});
