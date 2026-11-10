import {
  createPlayerRequestSchema,
  createPlayerResponseSchema,
  playerListResponseSchema,
} from '@local/game-server-api';
import type { PlayersStore } from '../database/players-store.js';
import { HttpError } from '../http-error.js';
import type { TypedFastify } from '../typed-fastify.js';

export function registerPlayerRoutes(app: TypedFastify, players: PlayersStore): void {
  app.get('/api/players', { schema: { response: { 200: playerListResponseSchema } } }, () => ({
    playerIds: players.listPlayerIds(),
  }));

  app.post(
    '/api/players',
    {
      schema: {
        body: createPlayerRequestSchema,
        response: { 201: createPlayerResponseSchema },
      },
    },
    async (request, reply) => {
      const { playerId } = request.body;
      if (!players.createPlayer(playerId, new Date().toISOString())) {
        throw new HttpError(409, 'player-exists', `The player ID '${playerId}' is already taken`);
      }
      return reply.code(201).send({ playerId });
    },
  );
}
