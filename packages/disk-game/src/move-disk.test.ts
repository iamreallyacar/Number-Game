import { describe, expect, it } from 'vitest';
import { applyDiskMove } from './move-disk.js';
import { countDisks, findSortedPeg } from './pegs.js';
import { expectAccepted, makeTestState } from './test-support.js';

describe('applyDiskMove', () => {
  it('moves the disk, takes 1 from moves left, and remembers the move (DK-08, DK-11)', () => {
    const state = makeTestState();
    const result = expectAccepted(applyDiskMove(state, { fromPeg: 1, toPeg: 2 }));
    expect(result.stageClear).toBeNull();
    expect(result.state).toEqual({
      ...state,
      pegs: [[3], [2], [1]],
      movesLeft: 5,
      stageMovesUsed: 1,
      stageMoves: [{ fromPeg: 1, toPeg: 2 }],
    });
  });

  it('refuses a drop onto a smaller disk and changes nothing (DK-10)', () => {
    const state = makeTestState();
    expect(applyDiskMove(state, { fromPeg: 0, toPeg: 1 })).toEqual({
      accepted: false,
      reason: 'onto-smaller-disk',
    });
  });

  it('refuses a move from an empty peg, to the same peg, or to a peg that does not exist', () => {
    const state = makeTestState();
    expect(applyDiskMove(state, { fromPeg: 2, toPeg: 0 })).toMatchObject({ reason: 'empty-peg' });
    expect(applyDiskMove(state, { fromPeg: 1, toPeg: 1 })).toMatchObject({ reason: 'same-peg' });
    expect(applyDiskMove(state, { fromPeg: 1, toPeg: 5 })).toMatchObject({ reason: 'no-such-peg' });
  });

  it('refuses every move once the game is over (DK-19)', () => {
    const state = makeTestState({ movesLeft: 2 });
    expect(applyDiskMove(state, { fromPeg: 1, toPeg: 2 })).toEqual({
      accepted: false,
      reason: 'game-over',
    });
  });

  it('clears the stage when every disk is on one peg and starts the next (DK-05, DK-15)', () => {
    const state = makeTestState({ pegs: [[3, 2], [], [1]], movesLeft: 4, score: 100 });
    const result = expectAccepted(applyDiskMove(state, { fromPeg: 2, toPeg: 0 }));
    expect(result.stageClear).toMatchObject({ sortedPegIndex: 0, sortedPegs: [[3, 2, 1], [], []] });
    expect(result.state.stage).toBe(2);
    expect(countDisks(result.state.pegs)).toBe(4);
    expect(findSortedPeg(result.state.pegs)).toBeNull();
    expect(result.state).toMatchObject({ stageMovesUsed: 0, stageMoves: [], stageAssisted: false });
    expect(result.state.randomState).not.toBe(state.randomState);
  });

  it('carries unused moves over and adds 2 for each fewest move of the new layout (DK-16)', () => {
    const state = makeTestState({ pegs: [[3, 2], [], [1]], movesLeft: 4 });
    const { state: nextStage } = expectAccepted(applyDiskMove(state, { fromPeg: 2, toPeg: 0 }));
    expect(nextStage.movesLeft).toBe(3 + 2 * nextStage.stageFewestMoves);
  });

  it('gives 10 points for each fewest move of the starting layout (DK-17)', () => {
    const state = makeTestState({
      pegs: [[3, 2], [], [1]],
      stageFewestMoves: 3,
      stageMovesUsed: 6,
      stageMoves: [],
      stageAssisted: true,
      score: 100,
    });
    const result = expectAccepted(applyDiskMove(state, { fromPeg: 2, toPeg: 0 }));
    expect(result.stageClear).toMatchObject({ pointsEarned: 30, perfect: false });
    expect(result.state.score).toBe(130);
  });

  it('adds 5 more for each fewest move after a perfect stage (DK-17)', () => {
    const state = makeTestState({
      pegs: [[3, 2], [], [1]],
      stageFewestMoves: 3,
      stageMovesUsed: 2,
    });
    const result = expectAccepted(applyDiskMove(state, { fromPeg: 2, toPeg: 0 }));
    expect(result.stageClear).toMatchObject({ pointsEarned: 45, perfect: true });
    expect(result.state.score).toBe(45);
  });

  it('is not perfect with extra moves, or after an undo or a hint (DK-17)', () => {
    const lastMove = { fromPeg: 2, toPeg: 0 };
    const pegs = [[3, 2], [], [1]] as const;
    const slow = makeTestState({ pegs, stageFewestMoves: 3, stageMovesUsed: 4 });
    const assisted = makeTestState({
      pegs,
      stageFewestMoves: 3,
      stageMovesUsed: 2,
      stageAssisted: true,
    });
    expect(expectAccepted(applyDiskMove(slow, lastMove)).stageClear?.perfect).toBe(false);
    expect(expectAccepted(applyDiskMove(assisted, lastMove)).stageClear?.perfect).toBe(false);
  });
});
