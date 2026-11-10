import {
  applyMove,
  BOARD_WIDTHS,
  createGame,
  DIFFICULTY_IDS,
  GAME_STATE_UPGRADES,
  isGameOver,
  NUMBER_GAME_ID,
  parseGameState,
  parseSummaryDetails,
  summarizeGame,
  SUMMARY_DETAILS_UPGRADES,
  type NumberGameMove,
} from '@local/number-game';
import { Type, type Static } from 'typebox';
import { expectSameType } from './expect-same-type.js';
import { defineServerGame } from './game-registry.js';

const newGameOptionsSchema = Type.Object(
  {
    width: Type.Union(BOARD_WIDTHS.map((width) => Type.Literal(width))),
    difficulty: Type.Union(DIFFICULTY_IDS.map((difficulty) => Type.Literal(difficulty))),
  },
  { additionalProperties: false },
);

const cellIndexSchema = Type.Integer({ minimum: 0 });

const moveSchema = Type.Union([
  Type.Object(
    { type: Type.Literal('match'), firstIndex: cellIndexSchema, secondIndex: cellIndexSchema },
    { additionalProperties: false },
  ),
  Type.Object({ type: Type.Literal('add-numbers') }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal('hint') }, { additionalProperties: false }),
]);

// The schema checks moves at run time and the rules package owns the move type.
expectSameType<Static<typeof moveSchema>, NumberGameMove>(true);

export const numberGameServerModule = defineServerGame({
  id: NUMBER_GAME_ID,
  categories: DIFFICULTY_IDS,
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
