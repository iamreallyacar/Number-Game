import { describe, expect, it } from 'vitest';
import type { GameState } from './game-state.js';
import { createGame } from './new-game.js';
import { InvalidGameStateError, parseGameState } from './parse-game-state.js';
import { applyPlacement } from './place-shape.js';
import { cellsFromRows, makeTestState } from './test-support.js';

function roundTripThroughJson(state: GameState): unknown {
  return JSON.parse(JSON.stringify(state));
}

const validState = makeTestState({
  cells: cellsFromRows([
    '0.......',
    '12......',
    '........',
    '........',
    '........',
    '........',
    '........',
    '7777777.',
  ]),
  score: 30,
  streak: 1,
  linesCleared: 2,
  shapesPlaced: 6,
});

describe('parseGameState', () => {
  it('gives back a new game unchanged after a trip through JSON', () => {
    const state = createGame({ size: 10, seed: 5 });
    expect(parseGameState(roundTripThroughJson(state))).toEqual(state);
  });

  it('gives back a played game unchanged after a trip through JSON', () => {
    const result = applyPlacement(validState, 2, 3, 2);
    if (!result.accepted) {
      throw new Error(`Expected the placement to be accepted, got ${result.reason}`);
    }
    expect(parseGameState(roundTripThroughJson(result.state))).toEqual(result.state);
  });

  it.each([
    { problem: 'not an object', value: [], message: 'expected an object' },
    { problem: 'null', value: null, message: 'expected an object' },
    { problem: 'an unknown field', value: { ...validState, cheat: true }, message: "'cheat'" },
    { problem: 'a missing field', value: { ...validState, score: undefined }, message: 'score' },
    { problem: 'a bad size', value: { ...validState, size: 7 }, message: 'size' },
    {
      problem: 'cells that are not an array',
      value: { ...validState, cells: 'x' },
      message: 'cells',
    },
    {
      problem: 'too few cells',
      value: { ...validState, cells: validState.cells.slice(1) },
      message: 'must hold 64 cells',
    },
    {
      problem: 'an unknown colour',
      value: { ...validState, cells: [8, ...validState.cells.slice(1)] },
      message: 'cell 0',
    },
    {
      problem: 'a full row',
      value: { ...validState, cells: [...validState.cells.slice(0, 63), 7] },
      message: 'full row or column',
    },
    {
      problem: 'slots that are not a list',
      value: { ...validState, slots: 'single' },
      message: 'slots',
    },
    {
      problem: 'only two slots',
      value: { ...validState, slots: ['single', 'single'] },
      message: 'slots',
    },
    {
      problem: 'an unknown shape',
      value: { ...validState, slots: ['single', 'hexagon', 'single'] },
      message: 'known shape id',
    },
    { problem: 'a negative score', value: { ...validState, score: -1 }, message: 'score' },
    { problem: 'a decimal streak', value: { ...validState, streak: 0.5 }, message: 'streak' },
    {
      problem: 'negative lines cleared',
      value: { ...validState, linesCleared: -2 },
      message: 'linesCleared',
    },
    {
      problem: 'shapes placed as text',
      value: { ...validState, shapesPlaced: '6' },
      message: 'shapesPlaced',
    },
    {
      problem: 'a streak longer than the shapes placed',
      value: { ...validState, streak: 7 },
      message: 'streak cannot be longer',
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
