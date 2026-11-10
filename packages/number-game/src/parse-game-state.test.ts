import { describe, expect, it } from 'vitest';
import { applyAddNumbers } from './add-numbers.js';
import type { GameState } from './game-state.js';
import { createGame } from './new-game.js';
import { InvalidGameStateError, parseGameState } from './parse-game-state.js';
import { cellsFromRows, makeTestState } from './test-support.js';

function roundTripThroughJson(state: GameState): unknown {
  return JSON.parse(JSON.stringify(state));
}

const validState = makeTestState({ cells: cellsFromRows(['1111111111', '11........']) });

describe('parseGameState', () => {
  it('gives back a new game unchanged after a trip through JSON', () => {
    const state = createGame({ width: 11, difficulty: 'easy', seed: 5 });
    expect(parseGameState(roundTripThroughJson(state))).toEqual(state);
  });

  it('gives back a board with empty cells unchanged after a trip through JSON', () => {
    const result = applyAddNumbers(validState);
    if (!result.accepted) {
      throw new Error(`Expected Add Numbers to be accepted, got ${result.reason}`);
    }
    expect(parseGameState(roundTripThroughJson(result.state))).toEqual(result.state);
  });

  it.each([
    { problem: 'not an object', value: [], message: 'expected an object' },
    { problem: 'null', value: null, message: 'expected an object' },
    { problem: 'an unknown field', value: { ...validState, cheat: true }, message: "'cheat'" },
    { problem: 'a missing field', value: { ...validState, score: undefined }, message: 'score' },
    { problem: 'a bad width', value: { ...validState, width: 9 }, message: 'width' },
    {
      problem: 'cells that are not an array',
      value: { ...validState, cells: 'x' },
      message: 'cells',
    },
    {
      problem: 'a zero cell',
      value: { ...validState, cells: [0, ...validState.cells.slice(1)] },
      message: 'cell 0',
    },
    {
      problem: 'a decimal cell',
      value: { ...validState, cells: [1.5, ...validState.cells.slice(1)] },
      message: 'cell 0',
    },
    {
      problem: 'a partial row',
      value: { ...validState, cells: validState.cells.slice(0, 15) },
      message: 'whole rows',
    },
    { problem: 'no cells', value: { ...validState, cells: [] }, message: 'whole rows' },
    {
      problem: 'an empty row',
      value: { ...validState, cells: cellsFromRows(['1111111111', '..........']) },
      message: 'row 2 is empty',
    },
    { problem: 'a negative score', value: { ...validState, score: -1 }, message: 'score' },
    { problem: 'stage 0', value: { ...validState, stage: 0 }, message: 'stage' },
    {
      problem: 'an unknown difficulty',
      value: { ...validState, difficulty: 'expert' },
      message: 'difficulty',
    },
    {
      problem: 'too many Add Numbers',
      value: { ...validState, addNumbersLeft: 6 },
      message: 'addNumbersLeft',
    },
    { problem: 'too many hints', value: { ...validState, hintsLeft: 4 }, message: 'hintsLeft' },
    {
      problem: 'unlimited hints on Normal',
      value: { ...validState, hintsLeft: 'unlimited' },
      message: 'hintsLeft',
    },
    {
      problem: 'counted hints on Easy',
      value: { ...validState, difficulty: 'easy', addNumbersLeft: 8, hintsLeft: 3 },
      message: "'unlimited'",
    },
    {
      problem: 'a bad random state',
      value: { ...validState, randomState: 2 ** 32 },
      message: 'randomState',
    },
  ])('rejects $problem', ({ value, message }) => {
    expect(() => parseGameState(value)).toThrow(InvalidGameStateError);
    expect(() => parseGameState(value)).toThrow(message);
  });
});
