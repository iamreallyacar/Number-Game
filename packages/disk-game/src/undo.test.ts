import { describe, expect, it } from 'vitest';
import { applyDiskMove } from './move-disk.js';
import { expectAccepted, makeTestState } from './test-support.js';
import { applyUndo, findUndoProblem } from './undo.js';

describe('applyUndo', () => {
  it('takes back the last move for 1 move and marks the stage as assisted (DK-12)', () => {
    const start = makeTestState();
    const moved = expectAccepted(applyDiskMove(start, { fromPeg: 1, toPeg: 2 })).state;
    const undone = expectAccepted(applyUndo(moved));
    expect(undone.undoneMove).toEqual({ fromPeg: 1, toPeg: 2 });
    expect(undone.state).toEqual({
      ...start,
      movesLeft: 4,
      stageMovesUsed: 2,
      stageAssisted: true,
    });
  });

  it('goes further back when used again, up to the start of the stage (DK-12)', () => {
    const start = makeTestState({ movesLeft: 20 });
    const first = expectAccepted(applyDiskMove(start, { fromPeg: 1, toPeg: 2 })).state;
    const second = expectAccepted(applyDiskMove(first, { fromPeg: 1, toPeg: 0 })).state;
    const undoneOnce = expectAccepted(applyUndo(second)).state;
    expect(undoneOnce.pegs).toEqual(first.pegs);
    const undoneTwice = expectAccepted(applyUndo(undoneOnce)).state;
    expect(undoneTwice.pegs).toEqual(start.pegs);
    expect(applyUndo(undoneTwice)).toEqual({ accepted: false, reason: 'nothing-to-undo' });
  });

  it('cannot undo a move from an earlier stage (DK-12)', () => {
    const lastStage = makeTestState({ pegs: [[3, 2], [], [1]], movesLeft: 4 });
    const nextStage = expectAccepted(applyDiskMove(lastStage, { fromPeg: 2, toPeg: 0 })).state;
    expect(findUndoProblem(nextStage)).toBe('nothing-to-undo');
  });

  it('is turned off when it would end the game (DK-14)', () => {
    // After the first move 2 more are needed. Undoing leaves 2 moves for a layout that needs 3.
    const start = makeTestState({ movesLeft: 4 });
    const moved = expectAccepted(applyDiskMove(start, { fromPeg: 1, toPeg: 2 })).state;
    expect(findUndoProblem(moved)).toBe('would-end-game');
    expect(applyUndo(moved)).toEqual({ accepted: false, reason: 'would-end-game' });
  });

  it('is refused once the game is over', () => {
    const state = makeTestState({ movesLeft: 1, stageMoves: [{ fromPeg: 2, toPeg: 1 }] });
    expect(applyUndo(state)).toEqual({ accepted: false, reason: 'game-over' });
  });
});
