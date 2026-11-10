import { describe, expect, it } from 'vitest';
import { createEmptyCells } from './board.js';
import { drawShapeId } from './deal-shapes.js';
import type { GameState } from './game-state.js';
import { applyPlacement, type PlacementResult } from './place-shape.js';
import { CHECKERBOARD_ROWS, cellsFromRows, makeTestState } from './test-support.js';

type AcceptedPlacement = Extract<PlacementResult, { accepted: true }>;

function expectAccepted(result: PlacementResult): AcceptedPlacement {
  if (!result.accepted) {
    throw new Error(`Expected the placement to be accepted, got ${result.reason}`);
  }
  return result;
}

const EMPTY_STATE = makeTestState({ cells: createEmptyCells(8) });

const ALMOST_FULL_BOTTOM_ROW = cellsFromRows([
  '........',
  '........',
  '........',
  '........',
  '........',
  '........',
  '........',
  '11111..1',
]);

describe('applyPlacement', () => {
  it('fills the shape cells with its colour and earns 1 point per cell', () => {
    const result = expectAccepted(applyPlacement(EMPTY_STATE, 1, 0, 0));
    expect(result.placedCellIndexes).toEqual([0, 1, 8, 9]);
    expect(result.state.cells.filter((cell) => cell !== null)).toEqual([3, 3, 3, 3]);
    expect(result.pointsEarned).toBe(4);
    expect(result.state).toMatchObject({ score: 4, streak: 0, linesCleared: 0, shapesPlaced: 1 });
    expect(result).toMatchObject({ clearedRows: [], clearedColumns: [], clearedCellIndexes: [] });
  });

  it('refills only the used slot, with the next shape from the random state', () => {
    const result = expectAccepted(applyPlacement(EMPTY_STATE, 1, 0, 0));
    const refill = drawShapeId(EMPTY_STATE.randomState);
    expect(result.state.slots).toEqual(['single', refill.value, 'line-3-horizontal']);
    expect(result.state.randomState).toBe(refill.randomState);
  });

  it('clears a full row and keeps the rest of the placed shape', () => {
    const state = makeTestState({ cells: ALMOST_FULL_BOTTOM_ROW });
    const result = expectAccepted(applyPlacement(state, 1, 6, 5));
    expect(result.clearedRows).toEqual([7]);
    expect(result.clearedColumns).toEqual([]);
    expect(result.clearedCellIndexes).toEqual([56, 57, 58, 59, 60, 61, 62, 63]);
    expect(result.state.cells).toEqual(
      cellsFromRows([
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '.....33.',
        '........',
      ]),
    );
    expect(result.pointsEarned).toBe(4 + 10);
    expect(result.state).toMatchObject({ score: 14, streak: 1, linesCleared: 1 });
  });

  it('clears a row and a column together, counting the crossing cell for both', () => {
    const state = makeTestState({
      cells: cellsFromRows([
        '.2222222',
        '2.......',
        '2.......',
        '2.......',
        '2.......',
        '2.......',
        '2.......',
        '2.......',
      ]),
    });
    const result = expectAccepted(applyPlacement(state, 0, 0, 0));
    expect(result).toMatchObject({ clearedRows: [0], clearedColumns: [0] });
    expect(result.clearedCellIndexes).toHaveLength(15);
    expect(result.state.cells.every((cell) => cell === null)).toBe(true);
    expect(result.pointsEarned).toBe(1 + 10 * 2 * 2);
    expect(result.state.linesCleared).toBe(2);
  });

  it('multiplies line points by the streak of back-to-back clearing placements', () => {
    const state = makeTestState({ cells: ALMOST_FULL_BOTTOM_ROW, streak: 2, shapesPlaced: 5 });
    const result = expectAccepted(applyPlacement(state, 1, 6, 5));
    expect(result.state.streak).toBe(3);
    expect(result.pointsEarned).toBe(4 + 10 * 3);
  });

  it('resets the streak after a placement that clears nothing', () => {
    const state = makeTestState({ cells: ALMOST_FULL_BOTTOM_ROW, streak: 2, shapesPlaced: 5 });
    const result = expectAccepted(applyPlacement(state, 0, 0, 0));
    expect(result.state.streak).toBe(0);
    expect(result.pointsEarned).toBe(1);
  });

  it('does not change the state it was given', () => {
    const state = makeTestState({ cells: ALMOST_FULL_BOTTOM_ROW });
    const before = JSON.stringify(state);
    applyPlacement(state, 1, 6, 5);
    expect(JSON.stringify(state)).toBe(before);
  });

  it.each([
    { problem: 'a slot past the last one', slotIndex: 3, reason: 'slot-out-of-range' },
    { problem: 'a negative slot', slotIndex: -1, reason: 'slot-out-of-range' },
    { problem: 'a decimal slot', slotIndex: 0.5, reason: 'slot-out-of-range' },
  ])('refuses $problem', ({ slotIndex, reason }) => {
    expect(applyPlacement(EMPTY_STATE, slotIndex, 0, 0)).toEqual({ accepted: false, reason });
  });

  it('refuses a shape that would stick out of the board', () => {
    expect(applyPlacement(EMPTY_STATE, 2, 0, 6)).toEqual({
      accepted: false,
      reason: 'out-of-bounds',
    });
  });

  it('refuses a shape that would cover a filled cell', () => {
    const state = makeTestState({ cells: ALMOST_FULL_BOTTOM_ROW });
    expect(applyPlacement(state, 0, 7, 0)).toEqual({ accepted: false, reason: 'cell-occupied' });
  });

  it('refuses every placement once no slot shape fits anywhere', () => {
    const state: GameState = makeTestState({
      cells: cellsFromRows(CHECKERBOARD_ROWS),
      slots: ['square-2', 'line-2-horizontal', 'line-2-vertical'],
    });
    expect(applyPlacement(state, 0, 0, 1)).toEqual({ accepted: false, reason: 'game-over' });
  });
});
