import {
  applyMove,
  BLOCK_GAME_ID,
  BOARD_SIZE_CATEGORIES,
  BOARD_SIZES,
  createGame,
  GAME_STATE_UPGRADES,
  isGameOver,
  parseGameState,
  parseSummaryDetails,
  summarizeGame,
  SUMMARY_DETAILS_UPGRADES,
  type BlockGameMove,
} from '@local/block-game';
import { Type, type Static } from 'typebox';
import { expectSameType } from './expect-same-type.js';
import { defineServerGame } from './game-registry.js';

const newGameOptionsSchema = Type.Object(
  { size: Type.Union(BOARD_SIZES.map((size) => Type.Literal(size))) },
  { additionalProperties: false },
);

const moveSchema = Type.Object(
  {
    type: Type.Literal('place-shape'),
    slotIndex: Type.Integer(),
    topRow: Type.Integer(),
    leftColumn: Type.Integer(),
  },
  { additionalProperties: false },
);

// The schema checks moves at run time and the rules package owns the move type.
expectSameType<Static<typeof moveSchema>, BlockGameMove>(true);

export const blockGameServerModule = defineServerGame({
  id: BLOCK_GAME_ID,
  categories: BOARD_SIZE_CATEGORIES,
  newGameOptionsSchema,
  moveSchema,
  createGame: (options, seed) => createGame({ ...options, seed }),
  stateUpgrades: GAME_STATE_UPGRADES,
  parseState: parseGameState,
  applyMove,
  isGameOver,
  summarize: summarizeGame,
  summaryDetailsUpgrades: SUMMARY_DETAILS_UPGRADES,
  parseSummaryDetails,
});
