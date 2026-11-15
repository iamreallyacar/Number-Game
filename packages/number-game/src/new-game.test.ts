import { describe, expect, it } from 'vitest';
import { DIFFICULTY_IDS, DIFFICULTY_PRESETS } from './difficulty.js';
import { BOARD_WIDTH } from './game-state.js';
import { createGame } from './new-game.js';
import { pairGroupsWithOddCount } from './pair.js';

describe('createGame', () => {
  it('fills a 10 by 10 board with numbers', () => {
    const state = createGame({ difficulty: 'normal', seed: 1 });
    expect(state.cells).toHaveLength(BOARD_WIDTH * BOARD_WIDTH);
    expect(state.cells.every((cell) => cell !== null)).toBe(true);
  });

  it.each(DIFFICULTY_IDS)('starts %s boards with every pair group even', (difficulty) => {
    for (let seed = 0; seed < 30; seed++) {
      const { cells } = createGame({ difficulty, seed });
      expect(pairGroupsWithOddCount(cells)).toEqual([]);
    }
  });

  it.each(DIFFICULTY_IDS)(
    'starts %s at stage 1 with the full uses for the difficulty',
    (difficulty) => {
      const state = createGame({ difficulty, seed: 1 });
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
    const options = { difficulty: 'easy', seed: 99 } as const;
    expect(createGame(options)).toEqual(createGame(options));
  });
});
