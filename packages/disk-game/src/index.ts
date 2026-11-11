// Public entry point of the Disk Game rules. Everything the server and browser need is exported here.
export {
  diskCountOfStage,
  isStartingDiskCount,
  MAX_DISK_COUNT,
  PEG_COUNT,
  STARTING_DISK_COUNTS,
  type DiskSize,
  type GameState,
  type Peg,
  type PegIndex,
  type PegMove,
  type Pegs,
  type StartingDiskCount,
} from './game-state.js';
export {
  countDisks,
  findPegMoveProblem,
  findSortedPeg,
  isPegIndex,
  moveTopDisk,
  PEG_INDEXES,
  pegAt,
  topDiskOf,
  type PegMoveProblem,
} from './pegs.js';
export { fewestMovesOf, findShortestPath, type ShortestPath } from './fewest-moves.js';
export { drawLayout, minimumFewestMoves, type Layout } from './layout.js';
export { MOVE_BUDGET_FACTOR } from './stage.js';
export {
  CLEAR_POINTS_PER_FEWEST_MOVE,
  PERFECT_POINTS_PER_FEWEST_MOVE,
  stageClearPoints,
} from './scoring.js';
export { createGame, type NewGameOptions } from './new-game.js';
export {
  applyDiskMove,
  MOVE_COST,
  type DiskMoveRefusal,
  type DiskMoveResult,
  type StageClear,
} from './move-disk.js';
export {
  applyUndo,
  findUndoProblem,
  UNDO_COST,
  type UndoRefusal,
  type UndoResult,
} from './undo.js';
export {
  applyHint,
  findHintProblem,
  HINT_COST,
  type HintRefusal,
  type HintResult,
} from './hint.js';
export { isGameOver } from './game-over.js';
export { InvalidGameStateError, parseGameState } from './parse-game-state.js';
export { DISK_GAME_ID } from './game-id.js';
export { applyMove, type DiskGameMove, type MoveRefusal, type MoveResult } from './move.js';
export {
  InvalidSummaryDetailsError,
  parseSummaryDetails,
  STARTING_DISK_COUNT_CATEGORIES,
  startingDiskCountCategory,
  summarizeGame,
  type DiskGameSummary,
  type DiskGameSummaryDetails,
  type StartingDiskCountCategory,
} from './summary.js';
export {
  GAME_STATE_UPGRADES,
  SUMMARY_DETAILS_UPGRADES,
  type StoredFormatUpgrade,
} from './stored-format-upgrades.js';
