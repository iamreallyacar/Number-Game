import { Type } from 'typebox';
import type { GameResult, HighScoresStore } from '../database/high-scores-store.js';
import type { PlayersStore } from '../database/players-store.js';
import type { GameRegistry, RegisteredGame } from '../games/game-registry.js';
import { HttpError } from '../http-error.js';
import { gameParamsSchema, playerIdSchema } from '../request-schemas.js';
import type { TypedFastify } from '../typed-fastify.js';

export interface HighScoreRouteDependencies {
  readonly games: GameRegistry;
  readonly players: PlayersStore;
  readonly highScores: HighScoresStore;
}

const DEFAULT_HIGH_SCORE_LIMIT = 20;
const MAX_HIGH_SCORE_LIMIT = 100;

function describeResult(result: GameResult) {
  return {
    playerId: result.playerId,
    score: result.score,
    category: result.category,
    // Written by the server from GameSummary.details, so it is known to be a plain JSON object.
    details: JSON.parse(result.detailsJson) as unknown,
    finishedAt: result.finishedAt,
  };
}

function checkCategory(game: RegisteredGame, category: string): void {
  if (!game.categories.includes(category)) {
    throw new HttpError(
      400,
      'unknown-category',
      `'${category}' is not a category of ${game.id}. Use one of ${game.categories.join(', ')}`,
    );
  }
}

export function registerHighScoreRoutes(
  app: TypedFastify,
  { games, players, highScores }: HighScoreRouteDependencies,
): void {
  app.get(
    '/api/games/:gameId/high-scores',
    {
      schema: {
        params: gameParamsSchema,
        querystring: Type.Object({
          category: Type.Optional(Type.String()),
          limit: Type.Integer({
            minimum: 1,
            maximum: MAX_HIGH_SCORE_LIMIT,
            default: DEFAULT_HIGH_SCORE_LIMIT,
          }),
        }),
      },
    },
    (request) => {
      const game = games.getGame(request.params.gameId);
      const { category, limit } = request.query;
      if (category !== undefined) {
        checkCategory(game, category);
      }
      const topResults = highScores.listTopResults(game.id, category ?? null, limit);
      return { highScores: topResults.map(describeResult) };
    },
  );

  app.get(
    '/api/games/:gameId/personal-bests/:playerId',
    { schema: { params: Type.Object({ gameId: Type.String(), playerId: playerIdSchema }) } },
    (request) => {
      const game = games.getGame(request.params.gameId);
      const playerId = players.findPlayerId(request.params.playerId);
      if (playerId === null) {
        throw new HttpError(
          404,
          'unknown-player',
          `There is no player ID '${request.params.playerId}'`,
        );
      }
      return { personalBests: highScores.listPersonalBests(game.id, playerId).map(describeResult) };
    },
  );
}
