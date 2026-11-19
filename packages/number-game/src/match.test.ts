import { describe, expect, it } from 'vitest';
import { DIFFICULTY_PRESETS } from './difficulty.js';
import { applyMatch } from './match.js';
import { cellsFromRows, makeTestState } from './test-support.js';

describe('applyMatch', () => {
  it('clears both cells and adds the match points', () => {
    const state = makeTestState({ cells: cellsFromRows(['3711111111', '1111111111']) });
    const result = applyMatch(state, 0, 1);
    expect(result).toEqual({
      accepted: true,
      state: { ...state, cells: cellsFromRows(['..11111111', '1111111111']), score: 10 },
      removedRowCount: 0,
      stageCleared: false,
    });
  });

  it('removes a row that became empty and adds the row points', () => {
    const state = makeTestState({
      cells: cellsFromRows(['1111111111', '....55....', '2222222222']),
    });
    const result = applyMatch(state, 14, 15);
    expect(result.accepted && result.state.cells).toEqual(
      cellsFromRows(['1111111111', '2222222222']),
    );
    // NG-23: 10 for the match plus 50 for the removed row.
    expect(result.accepted && result.state.score).toBe(60);
    expect(result.accepted && result.removedRowCount).toBe(1);
  });

  it('moves to the next stage when the last pair is cleared', () => {
    const state = makeTestState({
      cells: cellsFromRows(['1.........', '.........9']),
      stage: 2,
      score: 100,
      addNumbersLeft: 0,
      hintsLeft: 0,
    });
    const result = applyMatch(state, 0, 19);
    if (!result.accepted) {
      throw new Error(`Expected the match to be accepted, got ${result.reason}`);
    }
    expect(result.stageCleared).toBe(true);
    expect(result.removedRowCount).toBe(2);
    expect(result.state.stage).toBe(3);
    // 100 + 10 for the match + 2 rows of 50 + 500 * stage 2
    expect(result.state.score).toBe(1210);
    expect(result.state.cells).toHaveLength(100);
    expect(result.state.addNumbersLeft).toBe(DIFFICULTY_PRESETS.normal.addNumbersUsesPerStage);
  });

  it('does not change the original state', () => {
    const cells = cellsFromRows(['3711111111']);
    const state = makeTestState({ cells });
    applyMatch(state, 0, 1);
    expect(state.cells).toEqual(cellsFromRows(['3711111111']));
  });

  it.each([
    { name: 'not a pair', first: 0, second: 1, reason: 'not-a-pair' },
    { name: 'blocked', first: 0, second: 3, reason: 'no-line-of-sight' },
    { name: 'the same cell', first: 0, second: 0, reason: 'same-cell' },
    { name: 'an empty cell', first: 0, second: 9, reason: 'empty-cell' },
    { name: 'outside the board', first: 0, second: 10, reason: 'cell-out-of-range' },
    { name: 'a negative index', first: -1, second: 0, reason: 'cell-out-of-range' },
    { name: 'a fractional index', first: 0.5, second: 1, reason: 'cell-out-of-range' },
  ])('refuses $name', ({ first, second, reason }) => {
    const state = makeTestState({ cells: cellsFromRows(['3423111111'.slice(0, 9) + '.']) });
    expect(applyMatch(state, first, second)).toEqual({ accepted: false, reason });
  });
});
