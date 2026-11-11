import { describe, expect, it } from 'vitest';
import { applyHint, findHintProblem } from './hint.js';
import { makeTestState } from './test-support.js';

describe('applyHint', () => {
  it('shows the next move of a shortest path for 2 moves and changes no disk (DK-13)', () => {
    const state = makeTestState();
    expect(applyHint(state)).toEqual({
      accepted: true,
      state: { ...state, movesLeft: 4, stageAssisted: true },
      hintMove: { fromPeg: 1, toPeg: 2 },
    });
  });

  it('is turned off when paying for it would end the game (DK-14)', () => {
    const state = makeTestState({ movesLeft: 4 });
    expect(findHintProblem(state)).toBe('would-end-game');
    expect(applyHint(state)).toEqual({ accepted: false, reason: 'would-end-game' });
    expect(findHintProblem(makeTestState({ movesLeft: 5 }))).toBeNull();
  });

  it('is refused once the game is over', () => {
    expect(applyHint(makeTestState({ movesLeft: 2 }))).toEqual({
      accepted: false,
      reason: 'game-over',
    });
  });
});
