// Public entry point of the Number Game rules. Only what the server and the browser use is exported here.
export type { Cell, Digit } from './cell.js';
export {
  DIFFICULTY_IDS,
  DIFFICULTY_PRESETS,
  type DifficultyId,
  type HintAllowance,
} from './difficulty.js';
export { BOARD_WIDTH, type CellIndex, type GameState } from './game-state.js';
export { columnOf, rowOf } from './board.js';
export { createGame } from './new-game.js';
export { applyMatch, type MatchRefusal, type MatchResult } from './match.js';
export { applyAddNumbers } from './add-numbers.js';
export { isGameOver, isStuck, type CellPair } from './find-pair.js';
export { applyHint } from './hint.js';
export { parseGameState } from './parse-game-state.js';
export { NUMBER_GAME_ID } from './game-id.js';
export { applyMove, type NumberGameMove } from './move.js';
export { parseSummaryDetails, summarizeGame } from './summary.js';
export { GAME_STATE_UPGRADES, SUMMARY_DETAILS_UPGRADES } from './stored-format-upgrades.js';
