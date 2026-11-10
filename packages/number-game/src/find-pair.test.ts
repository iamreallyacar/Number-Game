import { describe, expect, it } from 'vitest';
import { findValidPair, isGameOver, isStuck } from './find-pair.js';
import { applyHint } from './hint.js';
import { cellsFromRows, makeTestState } from './test-support.js';

// No two neighbouring numbers in any direction are equal or add up to 10.
const NO_PAIR_BOARD = cellsFromRows(['1212121212', '3434343434']);

describe('findValidPair', () => {
  it('finds a pair with line of sight', () => {
    const cells = cellsFromRows(['1212121212', '343434343.', '.........8']);
    expect(findValidPair(cells, 10)).toEqual({ firstIndex: 9, secondIndex: 29 });
  });

  it('returns null when no pair can see each other', () => {
    expect(findValidPair(NO_PAIR_BOARD, 10)).toBeNull();
  });

  it('ignores pairs that are blocked', () => {
    const cells = cellsFromRows(['1212121212', '3434343434', '1.........']);
    expect(findValidPair(cells, 10)).toBeNull();
  });
});

describe('isStuck and isGameOver', () => {
  it('is stuck when no pair is left but Add Numbers has uses', () => {
    const state = makeTestState({ cells: NO_PAIR_BOARD, addNumbersLeft: 1 });
    expect(isStuck(state)).toBe(true);
    expect(isGameOver(state)).toBe(false);
  });

  it('is over when no pair is left and Add Numbers is used up', () => {
    const state = makeTestState({ cells: NO_PAIR_BOARD, addNumbersLeft: 0 });
    expect(isStuck(state)).toBe(false);
    expect(isGameOver(state)).toBe(true);
  });

  it('is neither while a pair is left', () => {
    const state = makeTestState({ cells: cellsFromRows(['55........']), addNumbersLeft: 0 });
    expect(isStuck(state)).toBe(false);
    expect(isGameOver(state)).toBe(false);
  });
});

describe('applyHint', () => {
  const cellsWithPair = cellsFromRows(['55........']);

  it('reveals a pair and uses one hint', () => {
    const state = makeTestState({ cells: cellsWithPair, hintsLeft: 2 });
    expect(applyHint(state)).toEqual({
      accepted: true,
      state: { ...state, hintsLeft: 1 },
      pair: { firstIndex: 0, secondIndex: 1 },
    });
  });

  it('never runs out on unlimited hints', () => {
    const state = makeTestState({
      cells: cellsWithPair,
      difficulty: 'easy',
      hintsLeft: 'unlimited',
    });
    const result = applyHint(state);
    expect(result.accepted && result.state.hintsLeft).toBe('unlimited');
  });

  it('refuses when no hints are left', () => {
    const state = makeTestState({ cells: cellsWithPair, hintsLeft: 0 });
    expect(applyHint(state)).toEqual({ accepted: false, reason: 'no-hints-left' });
  });

  it('keeps the hint when no pair exists', () => {
    const state = makeTestState({ cells: NO_PAIR_BOARD, hintsLeft: 1 });
    expect(applyHint(state)).toEqual({ accepted: false, reason: 'no-pair-available' });
  });
});
