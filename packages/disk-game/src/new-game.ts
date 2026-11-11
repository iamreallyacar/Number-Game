import { createRandomState } from '@local/seeded-random';
import type { GameState, StartingDiskCount } from './game-state.js';
import { startStage } from './stage.js';

export interface NewGameOptions {
  readonly startingDiskCount: StartingDiskCount;
  /** Any integer. The caller picks it, so the rules stay free of hidden randomness. */
  readonly seed: number;
}

export function createGame(options: NewGameOptions): GameState {
  return startStage({
    startingDiskCount: options.startingDiskCount,
    stage: 1,
    score: 0,
    movesCarriedOver: 0,
    randomState: createRandomState(options.seed),
  });
}
