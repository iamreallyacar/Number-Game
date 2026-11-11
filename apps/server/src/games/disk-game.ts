import {
  applyMove,
  createGame,
  DISK_GAME_ID,
  GAME_STATE_UPGRADES,
  isGameOver,
  parseGameState,
  parseSummaryDetails,
  STARTING_DISK_COUNT_CATEGORIES,
  STARTING_DISK_COUNTS,
  summarizeGame,
  SUMMARY_DETAILS_UPGRADES,
  type DiskGameMove,
} from '@local/disk-game';
import { Type, type Static } from 'typebox';
import { expectSameType } from './expect-same-type.js';
import { defineServerGame } from './game-registry.js';

const newGameOptionsSchema = Type.Object(
  {
    startingDiskCount: Type.Union(
      STARTING_DISK_COUNTS.map((startingDiskCount) => Type.Literal(startingDiskCount)),
    ),
  },
  { additionalProperties: false },
);

const moveSchema = Type.Union([
  Type.Object(
    { type: Type.Literal('move-disk'), fromPeg: Type.Integer(), toPeg: Type.Integer() },
    { additionalProperties: false },
  ),
  Type.Object({ type: Type.Literal('undo') }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal('hint') }, { additionalProperties: false }),
]);

// The schema checks moves at run time and the rules package owns the move type.
expectSameType<Static<typeof moveSchema>, DiskGameMove>(true);

export const diskGameServerModule = defineServerGame({
  id: DISK_GAME_ID,
  categories: STARTING_DISK_COUNT_CATEGORIES,
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
