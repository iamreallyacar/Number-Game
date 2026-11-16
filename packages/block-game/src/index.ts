// Public entry point of the Block Game rules. Only what the server and the browser use is exported here.
export type { BoardCell, ShapeColour } from './board-cell.js';
export { getShape, type BlockShape, type ShapeId } from './shape-catalogue.js';
export {
  BOARD_SIZE,
  type BoardGrid,
  type CellIndex,
  type GameState,
  type ShapeSlots,
} from './game-state.js';
export { cellIndexAt, columnOf, rowOf } from './board.js';
export { linesClearedByPlacement, shapeFitsAnywhere, shapeFitsAt } from './shape-fit.js';
export { isGameOver } from './game-over.js';
export { createGame } from './new-game.js';
export { applyPlacement, type PlacementRefusal } from './place-shape.js';
export { parseGameState } from './parse-game-state.js';
export { BLOCK_GAME_ID } from './game-id.js';
export { applyMove, type BlockGameMove } from './move.js';
export {
  BLOCK_GAME_CATEGORIES,
  BLOCK_GAME_CATEGORY,
  parseSummaryDetails,
  summarizeGame,
} from './summary.js';
export { GAME_STATE_UPGRADES, SUMMARY_DETAILS_UPGRADES } from './stored-format-upgrades.js';
