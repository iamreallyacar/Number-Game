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
export {
  applyAddNumbers,
  countNumbersToAdd,
  type AddNumbersRefusal,
  type AddNumbersResult,
} from './add-numbers.js';
export { findValidPair, isGameOver, isStuck, type CellPair } from './find-pair.js';
export { applyHint, type HintRefusal, type HintResult } from './hint.js';
export { InvalidGameStateError, parseGameState } from './parse-game-state.js';
export { NUMBER_GAME_ID } from './game-id.js';
export { applyMove, type MoveRefusal, type MoveResult, type NumberGameMove } from './move.js';
export {
  InvalidSummaryDetailsError,
  parseSummaryDetails,
  summarizeGame,
  type NumberGameSummary,
  type NumberGameSummaryDetails,
} from './summary.js';
export {
  GAME_STATE_UPGRADES,
  SUMMARY_DETAILS_UPGRADES,
  type StoredFormatUpgrade,
} from './stored-format-upgrades.js';
