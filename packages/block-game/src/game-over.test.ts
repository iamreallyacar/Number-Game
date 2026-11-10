import { describe, expect, it } from 'vitest';
import { createEmptyCells } from './board.js';
import { anySlotShapeFits, isGameOver } from './game-over.js';
import { CHECKERBOARD_ROWS, cellsFromRows, makeTestState } from './test-support.js';

describe('isGameOver', () => {
  it('is not over while the board is empty', () => {
    const state = makeTestState({ cells: createEmptyCells(8) });
    expect(anySlotShapeFits(state)).toBe(true);
    expect(isGameOver(state)).toBe(false);
  });

  it('is not over while at least one slot shape fits', () => {
    const state = makeTestState({
      cells: cellsFromRows(CHECKERBOARD_ROWS),
      slots: ['square-2', 'diagonal-2-up', 'line-2-vertical'],
    });
    expect(isGameOver(state)).toBe(false);
  });

  it('is over when none of the slot shapes fits anywhere', () => {
    const state = makeTestState({
      cells: cellsFromRows(CHECKERBOARD_ROWS),
      slots: ['square-2', 'line-2-horizontal', 'line-2-vertical'],
    });
    expect(anySlotShapeFits(state)).toBe(false);
    expect(isGameOver(state)).toBe(true);
  });
});
