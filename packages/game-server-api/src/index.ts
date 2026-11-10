// The request and answer shapes of the server API, shared by the server and the browser app so
// the two cannot drift apart. The routes are listed in the Server API section of ARCHITECTURE.md.
export { apiErrorBodySchema, type ApiErrorBody } from './error-body.js';
export {
  gameSummarySchema,
  summaryDetailsSchema,
  type GameSummary,
  type SummaryDetails,
} from './game-summary-schemas.js';
export {
  gameResultSchema,
  highScoresResponseSchema,
  personalBestsResponseSchema,
  type GameResult,
} from './high-score-schemas.js';
export { moveRequestSchema, moveResponseSchema, type MoveResponse } from './move-schemas.js';
export {
  createPlayerRequestSchema,
  createPlayerResponseSchema,
  playerIdSchema,
  playerListResponseSchema,
} from './player-schemas.js';
export {
  openedSaveResponseSchema,
  slotListResponseSchema,
  startGameRequestSchema,
  type OpenedSave,
  type SlotListing,
} from './save-slot-schemas.js';
