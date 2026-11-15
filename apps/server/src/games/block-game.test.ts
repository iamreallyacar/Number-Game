import { BLOCK_GAME_ID, BOARD_SIZE, type GameState } from '@local/block-game';
import { describe, expect, it } from 'vitest';
import { blockGameServerModule } from './block-game.js';
import type { StoredGameState } from './game-registry.js';

const EMPTY_BOARD_STATE: GameState = {
  cells: Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => null),
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
  it('is registered under the Block Game id with one category', () => {
    expect(blockGameServerModule.id).toBe(BLOCK_GAME_ID);
    expect(blockGameServerModule.categories).toEqual(['standard']);
  });

  it('starts a game and sums it up for the save slot list', () => {
    const started = blockGameServerModule.startGame({}, 42);
    expect(started.state).toMatchObject({ score: 0, shapesPlaced: 0 });
    expect(blockGameServerModule.summarize(started.storedState)).toEqual({
      score: 0,
      category: 'standard',
      details: { linesCleared: 0 },
    });
  });

  it('refuses a board size option, since the board is always the same size', () => {
    expect(() => blockGameServerModule.startGame({ size: 10 }, 1)).toThrow(
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
        topRow: 10,
      }),
    ).toEqual({ accepted: false, reason: 'out-of-bounds' });
  });

  it('passes on the refusal of a move on an empty slot', () => {
    const emptiedSlotState: GameState = {
      ...EMPTY_BOARD_STATE,
      slots: [null, 'square-2', 'single'],
    };
    expect(
      blockGameServerModule.applyMove(store(emptiedSlotState), PLACE_SINGLE_AT_CORNER),
    ).toEqual({ accepted: false, reason: 'slot-empty' });
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
      blockGameServerModule.readState({ stateJson: '{"size": 10}', stateVersion: 1 }),
    ).toThrow('This save is broken');
  });
});
