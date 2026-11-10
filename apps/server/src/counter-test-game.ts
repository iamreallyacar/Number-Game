// A tiny game for the tests of shared server code, so they do not depend on the rules of a real
// game. The count goes up by the amount of each move, and the game ends when it hits the target.
// Excluded from the build in tsconfig.build.json.
import { Type, type Static, type TSchema } from 'typebox';
import { Value } from 'typebox/value';
import { defineServerGame } from './games/game-registry.js';

export const COUNTER_GAME_ID = 'counter';

const counterStateSchema = Type.Object(
  { count: Type.Integer({ minimum: 0 }), target: Type.Union([Type.Literal(3), Type.Literal(5)]) },
  { additionalProperties: false },
);
const counterDetailsSchema = Type.Object(
  { count: Type.Integer() },
  { additionalProperties: false },
);

type CounterState = Static<typeof counterStateSchema>;

/** Format version 1 of the state and the details called the count `value`. */
function renameValueToCount(stored: unknown): unknown {
  if (typeof stored !== 'object' || stored === null) {
    return stored;
  }
  return Object.fromEntries(
    Object.entries(stored).map(([key, value]) => [key === 'value' ? 'count' : key, value]),
  );
}

export const COUNTER_FORMAT_VERSION = 2;

function parseChecked<Schema extends TSchema>(schema: Schema, stored: unknown): Static<Schema> {
  if (!Value.Check(schema, stored)) {
    throw new Error('stored counter value has the wrong shape');
  }
  return stored;
}

export const counterTestGame = defineServerGame({
  id: COUNTER_GAME_ID,
  categories: ['to-3', 'to-5'],
  newGameOptionsSchema: Type.Object(
    { target: Type.Union([Type.Literal(3), Type.Literal(5)]) },
    { additionalProperties: false },
  ),
  moveSchema: Type.Object(
    { type: Type.Literal('add'), amount: Type.Integer({ minimum: 1 }) },
    { additionalProperties: false },
  ),
  createGame: (options): CounterState => ({ count: 0, target: options.target }),
  stateUpgrades: [renameValueToCount],
  parseState: (stored) => parseChecked(counterStateSchema, stored),
  applyMove: (state, move) =>
    state.count + move.amount > state.target
      ? { accepted: false, reason: 'past-target' }
      : { accepted: true, state: { ...state, count: state.count + move.amount } },
  isGameOver: (state) => state.count === state.target,
  summarize: (state) => ({
    score: state.count * 10,
    category: `to-${String(state.target)}`,
    details: { count: state.count },
  }),
  summaryDetailsUpgrades: [renameValueToCount],
  parseSummaryDetails: (stored) => parseChecked(counterDetailsSchema, stored),
});
