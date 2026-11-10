import { randomInt } from 'node:crypto';
import { Type } from 'typebox';
import type { PlayersStore } from '../database/players-store.js';
import type { SaveSlotsStore, StoredSave } from '../database/save-slots-store.js';
import type { GameRegistry, RegisteredGame } from '../games/game-registry.js';
import { HttpError } from '../http-error.js';
import {
  deviceHeadersSchema,
  gameParamsSchema,
  playerIdSchema,
  slotParamsSchema,
} from '../request-schemas.js';
import type { TypedFastify } from '../typed-fastify.js';
import { checkSlotNumber, requireSave } from './slot-access.js';

export interface SaveSlotRouteDependencies {
  readonly games: GameRegistry;
  readonly players: PlayersStore;
  readonly saves: SaveSlotsStore;
  readonly saveSlotsPerGame: number;
}

const RANDOM_SEED_LIMIT = 2 ** 32;

function describeOpenSave(game: RegisteredGame, save: StoredSave) {
  return {
    slotNumber: save.slotNumber,
    playerId: save.playerId,
    lastPlayedAt: save.lastPlayedAt,
    state: game.readState(save.stateJson),
  };
}

export function registerSaveSlotRoutes(
  app: TypedFastify,
  { games, players, saves, saveSlotsPerGame }: SaveSlotRouteDependencies,
): void {
  app.get('/api/games/:gameId/slots', { schema: { params: gameParamsSchema } }, (request) => {
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
                playerId: save.playerId,
                lastPlayedAt: save.lastPlayedAt,
                summary: game.summarize(save.stateJson),
              },
      };
    });
    return { slots };
  });

  app.post(
    '/api/games/:gameId/slots/:slotNumber',
    {
      schema: {
        params: slotParamsSchema,
        headers: deviceHeadersSchema,
        body: Type.Object({ playerId: playerIdSchema, options: Type.Unknown() }),
      },
    },
    async (request, reply) => {
      const game = games.getGame(request.params.gameId);
      const { slotNumber } = request.params;
      checkSlotNumber(slotNumber, saveSlotsPerGame);
      const playerId = players.findPlayerId(request.body.playerId);
      if (playerId === null) {
        throw new HttpError(
          404,
          'unknown-player',
          `There is no player ID '${request.body.playerId}'`,
        );
      }
      const startedGame = game.startGame(request.body.options, randomInt(RANDOM_SEED_LIMIT));
      const save: StoredSave = {
        gameId: game.id,
        slotNumber,
        playerId,
        stateJson: startedGame.stateJson,
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
    '/api/games/:gameId/slots/:slotNumber/open',
    { schema: { params: slotParamsSchema, headers: deviceHeadersSchema } },
    (request) => {
      const game = games.getGame(request.params.gameId);
      const { slotNumber } = request.params;
      checkSlotNumber(slotNumber, saveSlotsPerGame);
      const save = requireSave(saves.findSave(game.id, slotNumber), slotNumber);
      // Opening takes the lock, so any other device that had this save open stops saving to it.
      const openedSave: StoredSave = { ...save, lockedDeviceId: request.headers['x-device-id'] };
      saves.updateSave(game.id, slotNumber, openedSave);
      return describeOpenSave(game, openedSave);
    },
  );

  app.delete(
    '/api/games/:gameId/slots/:slotNumber',
    { schema: { params: slotParamsSchema } },
    async (request, reply) => {
      const game = games.getGame(request.params.gameId);
      const { slotNumber } = request.params;
      checkSlotNumber(slotNumber, saveSlotsPerGame);
      if (!saves.deleteSave(game.id, slotNumber)) {
        requireSave(null, slotNumber);
      }
      return reply.code(204).send();
    },
  );
}
