import { describe, expect, it } from 'vitest';
import type { GameState } from './game-state.js';
import { applyMove } from './move.js';

const STATE: GameState = {
  width: 10,
  cells: [5, 5, 1, 2, 1, 2, 1, 2, 1, 2],
  score: 120,
  stage: 2,
  difficulty: 'normal',
  addNumbersLeft: 3,
  hintsLeft: 0,
  randomState: 1,
};

describe('applyMove', () => {
  it('applies a match', () => {
    const result = applyMove(STATE, { type: 'match', firstIndex: 0, secondIndex: 1 });
    expect(result).toMatchObject({ accepted: true, state: { score: 130 } });
  });

  it('applies Add Numbers', () => {
    const result = applyMove(STATE, { type: 'add-numbers' });
    expect(result).toMatchObject({ accepted: true, state: { addNumbersLeft: 2 } });
  });

  it('passes on the reason a move was refused', () => {
    expect(applyMove(STATE, { type: 'hint' })).toEqual({
      accepted: false,
      reason: 'no-hints-left',
    });
  });
});
