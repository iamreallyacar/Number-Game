import { describe, expect, it } from 'vitest';
import { isGameOver } from './game-over.js';
import { BOARD_SIZE } from './game-state.js';
import { createGame } from './new-game.js';
import { isShapeId } from './shape-catalogue.js';

describe('createGame', () => {
  it('starts an empty 10 x 10 board with nothing scored', () => {
    const state = createGame({ seed: 3 });
    expect(state.cells).toHaveLength(BOARD_SIZE * BOARD_SIZE);
    expect(state.cells.every((cell) => cell === null)).toBe(true);
    expect(state).toMatchObject({ score: 0, streak: 0, linesCleared: 0, shapesPlaced: 0 });
    expect(isGameOver(state)).toBe(false);
  });

  it('deals three known shapes', () => {
    const state = createGame({ seed: 3 });
    expect(state.slots).toHaveLength(3);
    expect(state.slots.every(isShapeId)).toBe(true);
  });

  it('deals the same shapes from the same seed, and different shapes from other seeds', () => {
    expect(createGame({ seed: 17 })).toEqual(createGame({ seed: 17 }));
    const slotLists = Array.from({ length: 10 }, (_, seed) => createGame({ seed }).slots.join());
    expect(new Set(slotLists).size).toBeGreaterThan(1);
  });
});
