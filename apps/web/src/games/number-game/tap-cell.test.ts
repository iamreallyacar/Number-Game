import type { Cell, GameState } from '@local/number-game';
import { describe, expect, it } from 'vitest';
import { tapCell } from './tap-cell.js';

// One row of width 10: 3 7 1 . 2 1 1 1 1 1
const ROW: readonly Cell[] = [3, 7, 1, null, 2, 1, 1, 1, 1, 1];

const STATE: GameState = {
  width: 10,
  cells: [...ROW, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  score: 0,
  stage: 1,
  difficulty: 'normal',
  addNumbersLeft: 5,
  hintsLeft: 3,
  randomState: 1,
};

describe('tapCell', () => {
  it('selects a number, and deselects it when tapped again', () => {
    expect(tapCell(STATE, null, 0)).toEqual({ kind: 'selected', selectedIndex: 0 });
    expect(tapCell(STATE, 0, 0)).toEqual({ kind: 'deselected' });
  });

  it('ignores taps on empty cells', () => {
    expect(tapCell(STATE, null, 3)).toEqual({ kind: 'ignored' });
    expect(tapCell(STATE, 0, 3)).toEqual({ kind: 'ignored' });
  });

  it('matches a pair that can see each other', () => {
    const outcome = tapCell(STATE, 0, 1);
    expect(outcome.kind).toBe('matched');
    if (outcome.kind === 'matched') {
      expect(outcome.match.state.cells.slice(0, 2)).toEqual([null, null]);
    }
  });

  it('refuses a wrong match with the reason', () => {
    expect(tapCell(STATE, 0, 2)).toEqual({
      kind: 'refused',
      firstIndex: 0,
      secondIndex: 2,
      reason: 'not-a-pair',
    });
    expect(tapCell(STATE, 2, 9)).toEqual({
      kind: 'refused',
      firstIndex: 2,
      secondIndex: 9,
      reason: 'no-line-of-sight',
    });
  });
});
