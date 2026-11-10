import { createRandomState } from '@local/seeded-random';
import { createEmptyCells } from './board.js';
import { dealStartingSlots } from './deal-shapes.js';
import type { BoardSize, GameState } from './game-state.js';

export interface NewGameOptions {
  readonly size: BoardSize;
  /** Any integer. The caller picks it, so the rules stay free of hidden randomness. */
  readonly seed: number;
}

export function createGame(options: NewGameOptions): GameState {
  const slots = dealStartingSlots(createRandomState(options.seed));
  return {
    size: options.size,
    cells: createEmptyCells(options.size),
    slots: slots.value,
    score: 0,
    streak: 0,
    linesCleared: 0,
    shapesPlaced: 0,
    randomState: slots.randomState,
  };
}
