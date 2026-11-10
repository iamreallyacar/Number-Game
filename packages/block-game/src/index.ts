// Public entry point of the Block Game rules. Everything the server and browser need is exported here.
export { isShapeColour, SHAPE_COLOURS, type BoardCell, type ShapeColour } from './board-cell.js';
export {
  getShape,
  isShapeId,
  SHAPE_CATALOGUE,
  SHAPE_IDS,
  type BlockShape,
  type ShapeCell,
  type ShapeId,
} from './shape-catalogue.js';
export {
  BOARD_SIZES,
  isBoardSize,
  SLOT_COUNT,
  type BoardGrid,
  type BoardSize,
  type CellIndex,
  type GameState,
  type ShapeSlots,
} from './game-state.js';
export { cellIndexAt, columnOf, findFullLines, rowOf, type FullLines } from './board.js';
export {
  findFitProblem,
  linesClearedByPlacement,
  shapeFitsAnywhere,
  shapeFitsAt,
  type FitRefusal,
} from './shape-fit.js';
export { anySlotShapeFits, isGameOver } from './game-over.js';
export {
  LINE_CLEAR_POINTS,
  lineClearPoints,
  PLACED_CELL_POINTS,
  placementPoints,
} from './scoring.js';
export { createGame, type NewGameOptions } from './new-game.js';
export { applyPlacement, type PlacementRefusal, type PlacementResult } from './place-shape.js';
export { InvalidGameStateError, parseGameState } from './parse-game-state.js';
export { BLOCK_GAME_ID } from './game-id.js';
export { applyMove, type BlockGameMove, type MoveRefusal, type MoveResult } from './move.js';
export {
  BOARD_SIZE_CATEGORIES,
  boardSizeCategory,
  InvalidSummaryDetailsError,
  parseSummaryDetails,
  summarizeGame,
  type BlockGameSummary,
  type BlockGameSummaryDetails,
  type BoardSizeCategory,
} from './summary.js';
export {
  GAME_STATE_UPGRADES,
  SUMMARY_DETAILS_UPGRADES,
  type StoredFormatUpgrade,
} from './stored-format-upgrades.js';
