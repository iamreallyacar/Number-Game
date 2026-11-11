import type { GameState } from '@local/disk-game';
import { describe, expect, it } from 'vitest';
import { tapPeg } from './tap-peg.js';

// Disk 3 on the left peg and disks 2 and 1 in the middle. The right peg is empty.
const STATE: GameState = {
  startingDiskCount: 3,
  stage: 1,
  pegs: [[3], [2, 1], []],
  score: 0,
  movesLeft: 6,
  stageFewestMoves: 3,
  stageMovesUsed: 0,
  stageMoves: [],
  stageAssisted: false,
  randomState: 1,
};

describe('tapPeg', () => {
  it('picks up the top disk of a peg, and puts it back when tapped again (DK-09)', () => {
    expect(tapPeg(STATE, null, 1)).toEqual({ kind: 'picked-up', heldPeg: 1 });
    expect(tapPeg(STATE, 1, 1)).toEqual({ kind: 'put-back' });
  });

  it('picks up nothing from an empty peg (DK-09)', () => {
    expect(tapPeg(STATE, null, 2)).toEqual({ kind: 'ignored' });
  });

  it('drops the held disk on another peg (DK-08)', () => {
    const outcome = tapPeg(STATE, 1, 2);
    expect(outcome).toMatchObject({ kind: 'moved', move: { fromPeg: 1, toPeg: 2 } });
    if (outcome.kind === 'moved') {
      expect(outcome.result.state.pegs).toEqual([[3], [2], [1]]);
    }
  });

  it('refuses a drop onto a smaller disk with the reason (DK-10)', () => {
    expect(tapPeg(STATE, 0, 1)).toEqual({
      kind: 'refused',
      move: { fromPeg: 0, toPeg: 1 },
      reason: 'onto-smaller-disk',
    });
  });
});
