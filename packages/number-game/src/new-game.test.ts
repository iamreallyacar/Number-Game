import { describe, expect, it } from 'vitest';
import { DIFFICULTY_IDS, DIFFICULTY_PRESETS } from './difficulty.js';
import { BOARD_WIDTHS } from './game-state.js';
import { createGame } from './new-game.js';
import { isPair } from './pair.js';

function countNeighbourPairsInReadingOrder(seed: number, difficulty: 'easy' | 'normal'): number {
  const { cells } = createGame({ width: 10, difficulty, seed });
  return cells.slice(1).filter((cell, index) => {
    const previousCell = cells[index];
    return cell !== null && previousCell !== null && previousCell !== undefined
      ? isPair(previousCell, cell)
      : false;
  }).length;
}

describe('createGame', () => {
  it.each(BOARD_WIDTHS)('fills a %i by %i board with numbers', (width) => {
    const state = createGame({ width, difficulty: 'normal', seed: 1 });
    expect(state.width).toBe(width);
    expect(state.cells).toHaveLength(width * width);
    expect(state.cells.every((cell) => cell !== null)).toBe(true);
  });

  it.each(DIFFICULTY_IDS)(
    'starts %s at stage 1 with the full uses for the difficulty',
    (difficulty) => {
      const state = createGame({ width: 10, difficulty, seed: 1 });
      expect(state).toMatchObject({
        score: 0,
        stage: 1,
        difficulty,
        addNumbersLeft: DIFFICULTY_PRESETS[difficulty].addNumbersUsesPerStage,
        hintsLeft: DIFFICULTY_PRESETS[difficulty].hintsPerStage,
      });
    },
  );

  it('builds the same board from the same seed', () => {
    const options = { width: 12, difficulty: 'easy', seed: 99 } as const;
    expect(createGame(options)).toEqual(createGame(options));
  });

  it('builds Easy boards with many more neighbouring pairs than Normal boards', () => {
    const seeds = Array.from({ length: 20 }, (_, seed) => seed);
    const easyPairs = seeds.reduce(
      (sum, seed) => sum + countNeighbourPairsInReadingOrder(seed, 'easy'),
      0,
    );
    const normalPairs = seeds.reduce(
      (sum, seed) => sum + countNeighbourPairsInReadingOrder(seed, 'normal'),
      0,
    );
    expect(easyPairs).toBeGreaterThan(normalPairs * 1.5);
  });
});
