import { randomInt, randomUUID } from 'node:crypto';
import {
  openedSaveResponseSchema,
  slotListResponseSchema,
  startGameRequestSchema,
  type OpenedSave,
} from '@local/game-server-api';
import type { PlayersStore } from '../database/players-store.js';
import type { SaveSlotsStore, StoredSave } from '../database/save-slots-store.js';
import type { GameRegistry, RegisteredGame } from '../games/game-registry.js';
import { HttpError } from '../http-error.js';
import {
  deviceHeadersSchema,
  gameParamsSchema,
  saveParamsSchema,
  slotParamsSchema,
} from '../request-schemas.js';
import type { TypedFastify } from '../typed-fastify.js';
import { findGameSave, findGameSlot, findPlayerId } from './request-lookups.js';

export interface SaveSlotRouteDependencies {
  readonly games: GameRegistry;
  readonly players: PlayersStore;
  readonly saves: SaveSlotsStore;
  readonly saveSlotsPerGame: number;
}

const RANDOM_SEED_LIMIT = 2 ** 32;

function describeOpenSave(game: RegisteredGame, save: StoredSave): OpenedSave {
  return {
    saveId: save.saveId,
    slotNumber: save.slotNumber,
    playerId: save.playerId,
    lastPlayedAt: save.lastPlayedAt,
    state: game.readState(save),
  };
}

export function registerSaveSlotRoutes(
  app: TypedFastify,
  dependencies: SaveSlotRouteDependencies,
): void {
  const { games, players, saves, saveSlotsPerGame } = dependencies;

  app.get(
    '/api/games/:gameId/slots',
    { schema: { params: gameParamsSchema, response: { 200: slotListResponseSchema } } },
    (request) => {
      const game = games.getGame(request.params.gameId);
      const savesBySlot = new Map(saves.listSaves(game.id).map((save) => [save.slotNumber, save]));
      const slots = Array.from({ length: saveSlotsPerGame }, (_, index) => {
        const slotNumber = index + 1;
        const save = savesBySlot.get(slotNumber);
        return {
          slotNumber,
          save:
            save === undefined
              ? null
              : {
                  saveId: save.saveId,
                  playerId: save.playerId,
                  lastPlayedAt: save.lastPlayedAt,
                  summary: game.summarize(save),
                },
        };
      });
      return { slots };
    },
  );

  app.post(
    '/api/games/:gameId/slots/:slotNumber',
    {
      schema: {
        params: slotParamsSchema,
        headers: deviceHeadersSchema,
        body: startGameRequestSchema,
        response: { 201: openedSaveResponseSchema },
      },
    },
    async (request, reply) => {
      const { game, slotNumber } = findGameSlot(dependencies, request.params);
      const playerId = findPlayerId(players, request.body.playerId);
      const startedGame = game.startGame(request.body.options, randomInt(RANDOM_SEED_LIMIT));
      const save: StoredSave = {
        gameId: game.id,
        slotNumber,
        saveId: randomUUID(),
        playerId,
        ...startedGame.storedState,
        lockedDeviceId: request.headers['x-device-id'],
        lastPlayedAt: new Date().toISOString(),
      };
      if (!saves.insertSave(save)) {
        throw new HttpError(409, 'slot-in-use', `Slot ${String(slotNumber)} is already in use`);
      }
      return reply.code(201).send(describeOpenSave(game, save));
    },
  );

  app.post(
    '/api/games/:gameId/slots/:slotNumber/saves/:saveId/open',
    {
      schema: {
        params: saveParamsSchema,
        headers: deviceHeadersSchema,
        response: { 200: openedSaveResponseSchema },
      },
    },
    (request) => {
      const { game, save } = findGameSave(dependencies, request.params);
      // Opening takes the lock, so any other device that had this save open stops saving to it.
      const openedSave: StoredSave = { ...save, lockedDeviceId: request.headers['x-device-id'] };
      // The answer is built first, so a save that cannot be read keeps its lock where it was.
      const openedSaveAnswer = describeOpenSave(game, openedSave);
      saves.updateSave(save.saveId, openedSave);
      return openedSaveAnswer;
    },
  );

  app.delete(
    '/api/games/:gameId/slots/:slotNumber/saves/:saveId',
    { schema: { params: saveParamsSchema } },
    async (request, reply) => {
      const { save } = findGameSave(dependencies, request.params);
      saves.deleteSave(save.saveId);
      return reply.code(204).send();
    },
  );
}
