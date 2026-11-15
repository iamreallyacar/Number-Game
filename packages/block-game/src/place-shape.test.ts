import { describe, expect, it } from 'vitest';
import { createEmptyCells } from './board.js';
import { dealHand } from './deal-shapes.js';
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

const EMPTY_STATE = makeTestState({ cells: createEmptyCells() });

const ALMOST_FULL_BOTTOM_ROW = cellsFromRows([
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '11111..111',
]);

describe('applyPlacement', () => {
  it('fills the shape cells with its colour and earns 1 point per cell', () => {
    const result = expectAccepted(applyPlacement(EMPTY_STATE, 1, 0, 0));
    expect(result.placedCellIndexes).toEqual([0, 1, 10, 11]);
    expect(result.state.cells.filter((cell) => cell !== null)).toEqual([3, 3, 3, 3]);
    expect(result.pointsEarned).toBe(4);
    expect(result.state).toMatchObject({ score: 4, streak: 0, linesCleared: 0, shapesPlaced: 1 });
    expect(result).toMatchObject({ clearedRows: [], clearedColumns: [], clearedCellIndexes: [] });
  });

  it('empties only the used slot and keeps the random state while the hand is not finished', () => {
    const result = expectAccepted(applyPlacement(EMPTY_STATE, 1, 0, 0));
    expect(result.state.slots).toEqual(['single', null, 'line-3-horizontal']);
    expect(result.state.randomState).toBe(EMPTY_STATE.randomState);
  });

  it('deals a new hand of three after the third shape of a hand is placed', () => {
    const afterFirst = expectAccepted(applyPlacement(EMPTY_STATE, 0, 0, 0)).state;
    const afterSecond = expectAccepted(applyPlacement(afterFirst, 2, 5, 0)).state;
    expect(afterSecond.slots).toEqual([null, 'square-2', null]);
    expect(afterSecond.randomState).toBe(EMPTY_STATE.randomState);

    const afterThird = expectAccepted(applyPlacement(afterSecond, 1, 0, 5)).state;
    const nextHand = dealHand(EMPTY_STATE.randomState, 3, afterThird);
    expect(afterThird.slots).toEqual(nextHand.value);
    expect(afterThird.randomState).toBe(nextHand.randomState);
    expect(afterThird.shapesPlaced).toBe(3);
  });

  it('lets the shapes of a hand be placed in any order', () => {
    const afterFirst = expectAccepted(applyPlacement(EMPTY_STATE, 2, 0, 0)).state;
    expect(afterFirst.slots).toEqual(['single', 'square-2', null]);
  });

  it('carries the streak from one hand into the next (BG-15)', () => {
    const state = makeTestState({
      cells: ALMOST_FULL_BOTTOM_ROW,
      slots: [null, null, 'square-2'],
      streak: 2,
      shapesPlaced: 5,
    });
    const result = expectAccepted(applyPlacement(state, 2, 8, 5));
    expect(result.state.streak).toBe(3);
    expect(result.state.slots).toEqual(dealHand(state.randomState, 6, result.state).value);
  });

  it('clears a full row and keeps the rest of the placed shape', () => {
    const state = makeTestState({ cells: ALMOST_FULL_BOTTOM_ROW });
    const result = expectAccepted(applyPlacement(state, 1, 8, 5));
    expect(result.clearedRows).toEqual([9]);
    expect(result.clearedColumns).toEqual([]);
    expect(result.clearedCellIndexes).toEqual([90, 91, 92, 93, 94, 95, 96, 97, 98, 99]);
    expect(result.state.cells).toEqual(
      cellsFromRows([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '.....33...',
        '..........',
      ]),
    );
    expect(result.pointsEarned).toBe(4 + 10);
    expect(result.state).toMatchObject({ score: 14, streak: 1, linesCleared: 1 });
  });

  it('clears a row and a column together, counting the crossing cell for both', () => {
    const state = makeTestState({
      cells: cellsFromRows([
        '.222222222',
        '2.........',
        '2.........',
        '2.........',
        '2.........',
        '2.........',
        '2.........',
        '2.........',
        '2.........',
        '2.........',
      ]),
    });
    const result = expectAccepted(applyPlacement(state, 0, 0, 0));
    expect(result).toMatchObject({ clearedRows: [0], clearedColumns: [0] });
    expect(result.clearedCellIndexes).toHaveLength(19);
    expect(result.state.cells.every((cell) => cell === null)).toBe(true);
    expect(result.pointsEarned).toBe(1 + 10 * 2 * 2);
    expect(result.state.linesCleared).toBe(2);
  });

  it('multiplies line points by the streak of back-to-back clearing placements', () => {
    const state = makeTestState({ cells: ALMOST_FULL_BOTTOM_ROW, streak: 2, shapesPlaced: 5 });
    const result = expectAccepted(applyPlacement(state, 1, 8, 5));
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
    applyPlacement(state, 1, 8, 5);
    expect(JSON.stringify(state)).toBe(before);
  });

  it.each([
    { problem: 'a slot past the last one', slotIndex: 3, reason: 'slot-out-of-range' },
    { problem: 'a negative slot', slotIndex: -1, reason: 'slot-out-of-range' },
    { problem: 'a decimal slot', slotIndex: 0.5, reason: 'slot-out-of-range' },
  ])('refuses $problem', ({ slotIndex, reason }) => {
    expect(applyPlacement(EMPTY_STATE, slotIndex, 0, 0)).toEqual({ accepted: false, reason });
  });

  it('refuses a move on an empty slot and leaves the state unchanged', () => {
    const state = makeTestState({
      cells: createEmptyCells(),
      slots: ['single', null, 'line-3-horizontal'],
    });
    const before = JSON.stringify(state);
    expect(applyPlacement(state, 1, 0, 0)).toEqual({ accepted: false, reason: 'slot-empty' });
    expect(JSON.stringify(state)).toBe(before);
  });

  it('refuses a shape that would stick out of the board', () => {
    expect(applyPlacement(EMPTY_STATE, 2, 0, 8)).toEqual({
      accepted: false,
      reason: 'out-of-bounds',
    });
  });

  it('refuses a shape that would cover a filled cell', () => {
    const state = makeTestState({ cells: ALMOST_FULL_BOTTOM_ROW });
    expect(applyPlacement(state, 0, 9, 0)).toEqual({ accepted: false, reason: 'cell-occupied' });
  });

  it('refuses every placement once no shape left in the hand fits anywhere', () => {
    const state: GameState = makeTestState({
      cells: cellsFromRows(CHECKERBOARD_ROWS),
      slots: ['square-2', 'line-2-horizontal', 'line-2-vertical'],
    });
    expect(applyPlacement(state, 0, 0, 1)).toEqual({ accepted: false, reason: 'game-over' });
  });
});
