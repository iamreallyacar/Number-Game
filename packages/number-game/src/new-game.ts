import { DIFFICULTY_PRESETS, type DifficultyId } from './difficulty.js';
import type { BoardWidth, GameState } from './game-state.js';
import { createRandomState } from '@local/seeded-random';
import { generateStageBoard } from './stage-board.js';

export interface NewGameOptions {
  readonly width: BoardWidth;
  readonly difficulty: DifficultyId;
  /** Any integer. The caller picks it, so the rules stay free of hidden randomness. */
  readonly seed: number;
}

export function createGame(options: NewGameOptions): GameState {
  const preset = DIFFICULTY_PRESETS[options.difficulty];
  const board = generateStageBoard(options.width, preset, createRandomState(options.seed));
  return {
    width: options.width,
    cells: board.value,
    score: 0,
    stage: 1,
    difficulty: options.difficulty,
    addNumbersLeft: preset.addNumbersUsesPerStage,
    hintsLeft: preset.hintsPerStage,
    randomState: board.randomState,
  };
}
