// Public entry point of the Number Game rules. Everything the server and browser need is exported here.
export { DIGITS, isDigit, type Cell, type Digit } from './cell.js';
export {
  DIFFICULTY_IDS,
  DIFFICULTY_PRESETS,
  isDifficultyId,
  type DifficultyId,
  type DifficultyPreset,
  type HintAllowance,
} from './difficulty.js';
export {
  BOARD_WIDTHS,
  isBoardWidth,
  type BoardWidth,
  type CellIndex,
  type GameState,
} from './game-state.js';
export { columnOf, countNumbers, rowOf } from './board.js';
export { isPair } from './pair.js';
export { hasLineOfSight } from './line-of-sight.js';
export { EMPTY_ROW_POINTS, MATCH_POINTS, STAGE_CLEAR_POINTS_PER_STAGE } from './scoring.js';
export { createGame, type NewGameOptions } from './new-game.js';
export { applyMatch, type MatchRefusal, type MatchResult } from './match.js';
export { applyAddNumbers, countNumbersToAdd, type AddNumbersResult } from './add-numbers.js';
export { findValidPair, isGameOver, isStuck, type CellPair } from './find-pair.js';
export { applyHint, type HintRefusal, type HintResult } from './hint.js';
export { InvalidGameStateError, parseGameState } from './parse-game-state.js';
