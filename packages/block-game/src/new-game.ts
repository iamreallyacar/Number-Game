import { createRandomState } from '@local/seeded-random';
import { createEmptyCells } from './board.js';
import { dealHand } from './deal-shapes.js';
import type { GameState } from './game-state.js';

export interface NewGameOptions {
  /** Any integer. The caller picks it, so the rules stay free of hidden randomness. */
  readonly seed: number;
}

export function createGame(options: NewGameOptions): GameState {
  const cells = createEmptyCells();
  const slots = dealHand(createRandomState(options.seed), 0, { cells });
  return {
    cells,
    slots: slots.value,
    score: 0,
    streak: 0,
    linesCleared: 0,
    shapesPlaced: 0,
    randomState: slots.randomState,
  };
}
