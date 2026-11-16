import { randomInt } from 'node:crypto';
import {
  leaveRoomResponseSchema,
  roomListResponseSchema,
  roomPlayerRequestSchema,
  roomReadQuerySchema,
  roomResponseSchema,
  type Room as RoomAnswer,
} from '@local/game-server-api';
import type { PlayersStore } from '../database/players-store.js';
import type { GameRegistry } from '../games/game-registry.js';
import type { RegisteredRoomGame } from '../games/room-game.js';
import { gameParamsSchema, roomParamsSchema } from '../request-schemas.js';
import type { RoomRunner } from '../rooms/room-runner.js';
import { hostOf, type Room, type RoomStore } from '../rooms/room-store.js';
import type { TypedFastify } from '../typed-fastify.js';
import { requirePlayerId } from './request-lookups.js';

export interface RoomRouteDependencies {
  readonly games: GameRegistry;
  readonly players: PlayersStore;
  readonly rooms: RoomStore;
  readonly runner: RoomRunner;
}

const RANDOM_SEED_LIMIT = 2 ** 32;

function disconnectedPlayerIdsOf(room: Room): string[] {
  return room.status === 'running'
    ? room.playerIds.filter((playerId) => !room.connections.has(playerId))
    : [];
}

function describeRoom(game: RegisteredRoomGame, room: Room): RoomAnswer {
  return {
    roomId: room.roomId,
    status: room.status,
    hostPlayerId: hostOf(room),
    playerIds: [...room.playerIds],
    disconnectedPlayerIds: disconnectedPlayerIdsOf(room),
    maxPlayers: game.maxPlayers,
  };
}

/** Waiting rooms can be joined, and running rooms with a dropped player can be rejoined (SG-45). */
function isListed(room: Room): boolean {
  return room.status === 'waiting' || disconnectedPlayerIdsOf(room).length > 0;
}

export function registerRoomRoutes(
  app: TypedFastify,
  { games, players, rooms, runner }: RoomRouteDependencies,
): void {
  app.get(
    '/api/games/:gameId/rooms',
    { schema: { params: gameParamsSchema, response: { 200: roomListResponseSchema } } },
    (request) => {
      const game = games.getRoomGame(request.params.gameId);
      return {
        rooms: rooms
          .list(game.id)
          .filter(isListed)
          .map((room) => describeRoom(game, room)),
      };
    },
  );

  app.post(
    '/api/games/:gameId/rooms',
    {
      schema: {
        params: gameParamsSchema,
        body: roomPlayerRequestSchema,
        response: { 201: roomResponseSchema },
      },
    },
    async (request, reply) => {
      const game = games.getRoomGame(request.params.gameId);
      const playerId = requirePlayerId(players, request.body.playerId);
      const room = rooms.create(game, playerId);
      return reply.code(201).send({ room: describeRoom(game, room) });
    },
  );

  app.get(
    '/api/games/:gameId/rooms/:roomId',
    {
      schema: {
        params: roomParamsSchema,
        querystring: roomReadQuerySchema,
        response: { 200: roomResponseSchema },
      },
    },
    (request) => {
      const game = games.getRoomGame(request.params.gameId);
      const room = rooms.require(game.id, request.params.roomId);
      const askingPlayerId = request.query.playerId;
      if (askingPlayerId !== undefined) {
        rooms.markSeen(room, requirePlayerId(players, askingPlayerId));
      }
      return { room: describeRoom(game, room) };
    },
  );

  app.post(
    '/api/games/:gameId/rooms/:roomId/join',
    {
      schema: {
        params: roomParamsSchema,
        body: roomPlayerRequestSchema,
        response: { 200: roomResponseSchema },
      },
    },
    (request) => {
      const game = games.getRoomGame(request.params.gameId);
      const room = rooms.require(game.id, request.params.roomId);
      rooms.join(game, room, requirePlayerId(players, request.body.playerId));
      return { room: describeRoom(game, room) };
    },
  );

  app.post(
    '/api/games/:gameId/rooms/:roomId/leave',
    {
      schema: {
        params: roomParamsSchema,
        body: roomPlayerRequestSchema,
        response: { 200: leaveRoomResponseSchema },
      },
    },
    (request) => {
      const game = games.getRoomGame(request.params.gameId);
      const room = rooms.require(game.id, request.params.roomId);
      return { closed: rooms.leave(room, requirePlayerId(players, request.body.playerId)) };
    },
  );

  app.post(
    '/api/games/:gameId/rooms/:roomId/start',
    {
      schema: {
        params: roomParamsSchema,
        body: roomPlayerRequestSchema,
        response: { 200: roomResponseSchema },
      },
    },
    (request) => {
      const game = games.getRoomGame(request.params.gameId);
      const room = rooms.require(game.id, request.params.roomId);
      rooms.requireStartable(game, room, requirePlayerId(players, request.body.playerId));
      runner.startRun(game, room, randomInt(RANDOM_SEED_LIMIT));
      return { room: describeRoom(game, room) };
    },
  );
}
