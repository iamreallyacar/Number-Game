import { describe, expect, it } from 'vitest';
import { diskCountOfStage, STARTING_DISK_COUNTS } from './game-state.js';
import { isGameOver } from './game-over.js';
import { createGame } from './new-game.js';
import { countDisks } from './pegs.js';

describe('createGame', () => {
  it.each(STARTING_DISK_COUNTS)('starts stage 1 with %i disks (DK-04)', (startingDiskCount) => {
    const state = createGame({ startingDiskCount, seed: 9 });
    expect(countDisks(state.pegs)).toBe(startingDiskCount);
    expect(state).toMatchObject({
      startingDiskCount,
      stage: 1,
      score: 0,
      stageMovesUsed: 0,
      stageMoves: [],
      stageAssisted: false,
    });
  });

  it('gives 2 moves for each of the fewest moves of the first layout (DK-16)', () => {
    const state = createGame({ startingDiskCount: 5, seed: 3 });
    expect(state.movesLeft).toBe(2 * state.stageFewestMoves);
    expect(isGameOver(state)).toBe(false);
  });

  it('is the same game for the same seed', () => {
    expect(createGame({ startingDiskCount: 4, seed: 11 })).toEqual(
      createGame({ startingDiskCount: 4, seed: 11 }),
    );
  });
});

describe('diskCountOfStage', () => {
  it('adds one disk each stage and stops at 10 (DK-05)', () => {
    expect(diskCountOfStage(3, 1)).toBe(3);
    expect(diskCountOfStage(3, 2)).toBe(4);
    expect(diskCountOfStage(5, 6)).toBe(10);
    expect(diskCountOfStage(5, 20)).toBe(10);
  });
});
