import { describe, expect, it } from 'vitest';
import { isGameOver } from './game-over.js';
import { BOARD_SIZES } from './game-state.js';
import { createGame } from './new-game.js';
import { isShapeId } from './shape-catalogue.js';

describe('createGame', () => {
  it.each(BOARD_SIZES)('starts an empty %s x %s board with nothing scored', (size) => {
    const state = createGame({ size, seed: 3 });
    expect(state.size).toBe(size);
    expect(state.cells).toHaveLength(size * size);
    expect(state.cells.every((cell) => cell === null)).toBe(true);
    expect(state).toMatchObject({ score: 0, streak: 0, linesCleared: 0, shapesPlaced: 0 });
    expect(isGameOver(state)).toBe(false);
  });

  it('deals three known shapes', () => {
    const state = createGame({ size: 8, seed: 3 });
    expect(state.slots).toHaveLength(3);
    expect(state.slots.every(isShapeId)).toBe(true);
  });

  it('deals the same shapes from the same seed, and different shapes from other seeds', () => {
    expect(createGame({ size: 9, seed: 17 })).toEqual(createGame({ size: 9, seed: 17 }));
    const slotLists = Array.from({ length: 10 }, (_, seed) =>
      createGame({ size: 9, seed }).slots.join(),
    );
    expect(new Set(slotLists).size).toBeGreaterThan(1);
  });
});
