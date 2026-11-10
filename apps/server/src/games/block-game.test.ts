import { BLOCK_GAME_ID, type GameState } from '@local/block-game';
import { describe, expect, it } from 'vitest';
import { blockGameServerModule } from './block-game.js';
import type { StoredGameState } from './game-registry.js';

const EMPTY_BOARD_STATE: GameState = {
  size: 8,
  cells: Array.from({ length: 64 }, () => null),
  slots: ['single', 'square-2', 'single'],
  score: 0,
  streak: 0,
  linesCleared: 0,
  shapesPlaced: 0,
  randomState: 12345,
};

const PLACE_SINGLE_AT_CORNER = { type: 'place-shape', slotIndex: 0, topRow: 0, leftColumn: 0 };

function store(state: GameState): StoredGameState {
  return { stateJson: JSON.stringify(state), stateVersion: 1 };
}

describe('Block Game server module', () => {
  it('is registered under the Block Game id with one category per board size', () => {
    expect(blockGameServerModule.id).toBe(BLOCK_GAME_ID);
    expect(blockGameServerModule.categories).toEqual(['8', '9', '10']);
  });

  it('starts a game with the chosen size and sums it up for the save slot list', () => {
    const started = blockGameServerModule.startGame({ size: 9 }, 42);
    expect(started.state).toMatchObject({ size: 9, score: 0, shapesPlaced: 0 });
    expect(blockGameServerModule.summarize(started.storedState)).toEqual({
      score: 0,
      category: '9',
      details: { size: 9, linesCleared: 0 },
    });
  });

  it('refuses a board size the game does not offer', () => {
    expect(() => blockGameServerModule.startGame({ size: 7 }, 1)).toThrow(
      'New game options are invalid',
    );
  });

  it('applies a placement', () => {
    const outcome = blockGameServerModule.applyMove(
      store(EMPTY_BOARD_STATE),
      PLACE_SINGLE_AT_CORNER,
    );
    expect(outcome).toMatchObject({ accepted: true, gameOver: false });
    if (outcome.accepted) {
      expect(blockGameServerModule.readState(outcome.storedState)).toMatchObject({
        shapesPlaced: 1,
        cells: expect.arrayContaining([0]) as unknown,
      });
    }
  });

  it('passes on why the rules refused a move', () => {
    expect(
      blockGameServerModule.applyMove(store(EMPTY_BOARD_STATE), {
        ...PLACE_SINGLE_AT_CORNER,
        topRow: 8,
      }),
    ).toEqual({ accepted: false, reason: 'out-of-bounds' });
  });

  it('rejects a move with the wrong shape', () => {
    expect(() =>
      blockGameServerModule.applyMove(store(EMPTY_BOARD_STATE), {
        type: 'place-shape',
        slotIndex: 'first',
        topRow: 0,
        leftColumn: 0,
      }),
    ).toThrow('Move is invalid');
  });

  it('rejects a broken save with a clear error', () => {
    expect(() =>
      blockGameServerModule.readState({ stateJson: '{"size": 9}', stateVersion: 1 }),
    ).toThrow('This save is broken');
  });
});
