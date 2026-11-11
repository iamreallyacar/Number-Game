import { DISK_GAME_ID, type GameState } from '@local/disk-game';
import { describe, expect, it } from 'vitest';
import { diskGameServerModule } from './disk-game.js';
import type { StoredGameState } from './game-registry.js';

// Disk 3 on the left peg and disks 2 and 1 in the middle, which takes 3 moves to sort.
const THREE_MOVE_STATE: GameState = {
  startingDiskCount: 3,
  stage: 1,
  pegs: [[3], [2, 1], []],
  score: 0,
  movesLeft: 6,
  stageFewestMoves: 3,
  stageMovesUsed: 0,
  stageMoves: [],
  stageAssisted: false,
  randomState: 12345,
};

function store(state: GameState): StoredGameState {
  return { stateJson: JSON.stringify(state), stateVersion: 1 };
}

describe('Disk Game server module', () => {
  it('is registered under the Disk Game id with one category per starting disk count', () => {
    expect(diskGameServerModule.id).toBe(DISK_GAME_ID);
    expect(diskGameServerModule.categories).toEqual(['3', '4', '5']);
  });

  it('starts a game with the chosen disk count and sums it up for the save slot list', () => {
    const started = diskGameServerModule.startGame({ startingDiskCount: 4 }, 42);
    expect(started.state).toMatchObject({ startingDiskCount: 4, stage: 1, score: 0 });
    const { movesLeft } = diskGameServerModule.readState(started.storedState) as GameState;
    expect(diskGameServerModule.summarize(started.storedState)).toEqual({
      score: 0,
      category: '4',
      details: { stage: 1, startingDiskCount: 4, movesLeft },
    });
  });

  it('refuses a starting disk count the game does not offer', () => {
    expect(() => diskGameServerModule.startGame({ startingDiskCount: 6 }, 1)).toThrow(
      'New game options are invalid',
    );
  });

  it('applies a disk move, an undo, and a hint', () => {
    const moved = diskGameServerModule.applyMove(store(THREE_MOVE_STATE), {
      type: 'move-disk',
      fromPeg: 1,
      toPeg: 2,
    });
    if (!moved.accepted) {
      throw new Error(`Expected the disk move to be accepted, got ${moved.reason}`);
    }
    expect(diskGameServerModule.readState(moved.storedState)).toMatchObject({
      pegs: [[3], [2], [1]],
      movesLeft: 5,
    });
    const hinted = diskGameServerModule.applyMove(moved.storedState, { type: 'hint' });
    if (!hinted.accepted) {
      throw new Error(`Expected the hint to be accepted, got ${hinted.reason}`);
    }
    expect(diskGameServerModule.readState(hinted.storedState)).toMatchObject({ movesLeft: 3 });
    expect(diskGameServerModule.applyMove(store(THREE_MOVE_STATE), { type: 'undo' })).toEqual({
      accepted: false,
      reason: 'nothing-to-undo',
    });
  });

  it('ends the game when the moves left can no longer clear the stage', () => {
    const outcome = diskGameServerModule.applyMove(store({ ...THREE_MOVE_STATE, movesLeft: 3 }), {
      type: 'move-disk',
      fromPeg: 1,
      toPeg: 0,
    });
    expect(outcome).toMatchObject({
      accepted: true,
      gameOver: true,
      summary: { score: 0, category: '3', details: { stage: 1, startingDiskCount: 3 } },
    });
  });

  it('passes on why the rules refused a move', () => {
    expect(
      diskGameServerModule.applyMove(store(THREE_MOVE_STATE), {
        type: 'move-disk',
        fromPeg: 0,
        toPeg: 1,
      }),
    ).toEqual({ accepted: false, reason: 'onto-smaller-disk' });
  });

  it('rejects a move with the wrong shape', () => {
    expect(() =>
      diskGameServerModule.applyMove(store(THREE_MOVE_STATE), {
        type: 'move-disk',
        fromPeg: 'left',
        toPeg: 1,
      }),
    ).toThrow('Move is invalid');
  });

  it('rejects a broken save with a clear error', () => {
    expect(() =>
      diskGameServerModule.readState({ stateJson: '{"stage": 1}', stateVersion: 1 }),
    ).toThrow('This save is broken');
  });
});
