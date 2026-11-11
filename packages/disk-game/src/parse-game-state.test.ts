import { describe, expect, it } from 'vitest';
import type { GameState } from './game-state.js';
import { applyHint } from './hint.js';
import { applyDiskMove } from './move-disk.js';
import { createGame } from './new-game.js';
import { InvalidGameStateError, parseGameState } from './parse-game-state.js';
import { expectAccepted, makeTestState } from './test-support.js';
import { applyUndo } from './undo.js';

function roundTripThroughJson(state: GameState): unknown {
  return JSON.parse(JSON.stringify(state));
}

// One move into the stage: the small disk went from the middle peg to the right peg.
const validState = makeTestState({
  pegs: [[3], [2], [1]],
  movesLeft: 5,
  stageFewestMoves: 3,
  stageMovesUsed: 1,
  stageMoves: [{ fromPeg: 1, toPeg: 2 }],
});

describe('parseGameState', () => {
  it('gives back a new game unchanged after a trip through JSON', () => {
    const state = createGame({ startingDiskCount: 5, seed: 5 });
    expect(parseGameState(roundTripThroughJson(state))).toEqual(state);
  });

  it('gives back a played game unchanged after a trip through JSON', () => {
    expect(parseGameState(roundTripThroughJson(validState))).toEqual(validState);
    const moved = expectAccepted(applyDiskMove(validState, { fromPeg: 1, toPeg: 0 })).state;
    const undone = expectAccepted(applyUndo({ ...moved, movesLeft: 9 })).state;
    const hinted = expectAccepted(applyHint(undone)).state;
    expect(parseGameState(roundTripThroughJson(hinted))).toEqual(hinted);
  });

  it('accepts a later stage with more disks', () => {
    const lastStage = makeTestState({ pegs: [[3, 2], [], [1]], movesLeft: 4 });
    const nextStage = expectAccepted(applyDiskMove(lastStage, { fromPeg: 2, toPeg: 0 })).state;
    expect(parseGameState(roundTripThroughJson(nextStage))).toEqual(nextStage);
  });

  it.each([
    { problem: 'not an object', value: [], message: 'expected an object' },
    { problem: 'null', value: null, message: 'expected an object' },
    { problem: 'an unknown field', value: { ...validState, cheat: true }, message: "'cheat'" },
    { problem: 'a missing field', value: { ...validState, score: undefined }, message: 'score' },
    {
      problem: 'a bad starting disk count',
      value: { ...validState, startingDiskCount: 6 },
      message: 'startingDiskCount',
    },
    { problem: 'stage 0', value: { ...validState, stage: 0 }, message: 'stage' },
    { problem: 'pegs that are not a list', value: { ...validState, pegs: 'x' }, message: 'pegs' },
    { problem: 'only two pegs', value: { ...validState, pegs: [[3, 2], [1]] }, message: 'pegs' },
    {
      problem: 'a peg that is not a list',
      value: { ...validState, pegs: [[3], [2], 1] },
      message: 'peg 2',
    },
    {
      problem: 'a disk that is too large for the stage',
      value: { ...validState, pegs: [[4], [2], [1]] },
      message: 'disk sizes from 1 to 3',
    },
    {
      problem: 'a larger disk on a smaller one',
      value: { ...validState, pegs: [[2, 3], [], [1]] },
      message: 'on top of a smaller',
    },
    {
      problem: 'a missing disk',
      value: { ...validState, pegs: [[3], [], [1]] },
      message: 'exactly once',
    },
    {
      problem: 'a disk that is there twice',
      value: { ...validState, pegs: [[3], [1], [1]] },
      message: 'exactly once',
    },
    {
      problem: 'a sorted layout',
      value: { ...validState, pegs: [[3, 2, 1], [], []] },
      message: 'sorted layout',
    },
    { problem: 'a negative score', value: { ...validState, score: -1 }, message: 'score' },
    {
      problem: 'decimal moves left',
      value: { ...validState, movesLeft: 1.5 },
      message: 'movesLeft',
    },
    {
      problem: 'fewest moves below the reroll rule',
      value: { ...validState, stageFewestMoves: 1 },
      message: 'stageFewestMoves',
    },
    {
      problem: 'fewest moves that do not match the starting layout',
      value: { ...validState, stageFewestMoves: 5 },
      message: 'does not match the layout',
    },
    {
      problem: 'stage moves that are not a list',
      value: { ...validState, stageMoves: 'x' },
      message: 'stageMoves',
    },
    {
      problem: 'a stage move to a peg that does not exist',
      value: { ...validState, stageMoves: [{ fromPeg: 1, toPeg: 3 }] },
      message: 'stage move 0',
    },
    {
      problem: 'a stage move with an extra field',
      value: { ...validState, stageMoves: [{ fromPeg: 1, toPeg: 2, disk: 1 }] },
      message: 'stage move 0',
    },
    {
      problem: 'a stage move that could not have been made',
      value: { ...validState, stageMoves: [{ fromPeg: 2, toPeg: 0 }] },
      message: 'could not have been made',
    },
    {
      problem: 'fewer moves used than stage moves',
      value: { ...validState, stageMovesUsed: 0 },
      message: 'stageMovesUsed',
    },
    {
      problem: 'moves used that no number of undos explains',
      value: { ...validState, stageMovesUsed: 2 },
      message: 'stageMovesUsed',
    },
    {
      problem: 'an undo in a stage that is not marked as assisted',
      value: { ...validState, stageMovesUsed: 3 },
      message: 'stageAssisted',
    },
    {
      problem: 'stageAssisted as text',
      value: { ...validState, stageAssisted: 'no' },
      message: 'stageAssisted',
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
