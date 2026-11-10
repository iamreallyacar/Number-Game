import { describe, expect, it } from 'vitest';
import { createEmptyCells } from './board.js';
import { applyMove } from './move.js';
import { makeTestState } from './test-support.js';

const STATE = makeTestState({ cells: createEmptyCells(8), score: 40, shapesPlaced: 3 });

describe('applyMove', () => {
  it('applies a placement', () => {
    const result = applyMove(STATE, {
      type: 'place-shape',
      slotIndex: 1,
      topRow: 2,
      leftColumn: 3,
    });
    expect(result).toMatchObject({ accepted: true, state: { score: 44, shapesPlaced: 4 } });
  });

  it('passes on the reason a move was refused', () => {
    expect(
      applyMove(STATE, { type: 'place-shape', slotIndex: 2, topRow: 7, leftColumn: 7 }),
    ).toEqual({ accepted: false, reason: 'out-of-bounds' });
  });
});
