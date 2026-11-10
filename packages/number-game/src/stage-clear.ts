import { countNumbers } from './board.js';
import { DIFFICULTY_PRESETS } from './difficulty.js';
import type { GameState } from './game-state.js';
import { stageClearBonus } from './scoring.js';
import { generateStageBoard } from './stage-board.js';

/**
 * Called once the board has no numbers left: adds the stage clear bonus, moves up a stage, fills a
 * new board, and resets Add Numbers and hints (NG-20, NG-21, DF-02).
 */
export function advanceStage(clearedState: GameState): GameState {
  const numbersLeft = countNumbers(clearedState.cells);
  if (numbersLeft > 0) {
    throw new Error(`Cannot advance the stage while ${String(numbersLeft)} numbers are left`);
  }
  const preset = DIFFICULTY_PRESETS[clearedState.difficulty];
  const board = generateStageBoard(clearedState.width, preset, clearedState.randomState);
  return {
    ...clearedState,
    cells: board.value,
    score: clearedState.score + stageClearBonus(clearedState.stage),
    stage: clearedState.stage + 1,
    addNumbersLeft: preset.addNumbersUsesPerStage,
    hintsLeft: preset.hintsPerStage,
    randomState: board.randomState,
  };
}
