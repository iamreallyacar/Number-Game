import {
  applyAddNumbers,
  applyHint,
  applyMatch,
  BOARD_WIDTHS,
  createGame,
  DIFFICULTY_IDS,
  isGameOver,
  parseGameState,
  type GameState,
} from '@local/number-game';
import { Type } from 'typebox';
import { defineServerGame, type GameMoveOutcome } from './game-registry.js';

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

type NumberGameMove = Type.Static<typeof moveSchema>;

function applyNumberGameMove(state: GameState, move: NumberGameMove): GameMoveOutcome<GameState> {
  switch (move.type) {
    case 'match': {
      const result = applyMatch(state, move.firstIndex, move.secondIndex);
      return result.accepted
        ? {
            accepted: true,
            state: result.state,
            details: { removedRowCount: result.removedRowCount, stageCleared: result.stageCleared },
          }
        : result;
    }
    case 'add-numbers': {
      const result = applyAddNumbers(state);
      return result.accepted
        ? { accepted: true, state: result.state, details: { addedCount: result.addedCount } }
        : result;
    }
    case 'hint': {
      const result = applyHint(state);
      return result.accepted
        ? { accepted: true, state: result.state, details: { pair: result.pair } }
        : result;
    }
  }
}

export const NUMBER_GAME_ID = 'number-game';

export const numberGameServerModule = defineServerGame({
  id: NUMBER_GAME_ID,
  categories: DIFFICULTY_IDS,
  newGameOptionsSchema,
  moveSchema,
  createGame: (options, seed) => createGame({ ...options, seed }),
  parseState: parseGameState,
  applyMove: applyNumberGameMove,
  isGameOver,
  summarize: (state) => ({
    score: state.score,
    category: state.difficulty,
    details: { stage: state.stage, width: state.width, difficulty: state.difficulty },
  }),
});
