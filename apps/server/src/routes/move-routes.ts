import type { DatabaseSync } from 'node:sqlite';
import { moveRequestSchema, moveResponseSchema, type MoveResponse } from '@local/game-server-api';
import type { HighScoresStore } from '../database/high-scores-store.js';
import { runInTransaction } from '../database/run-in-transaction.js';
import type { SaveSlotsStore } from '../database/save-slots-store.js';
import type { GameRegistry } from '../games/game-registry.js';
import { HttpError } from '../http-error.js';
import { deviceHeadersSchema, slotParamsSchema } from '../request-schemas.js';
import type { TypedFastify } from '../typed-fastify.js';
import { findGameSave } from './request-lookups.js';

export interface MoveRouteDependencies {
  readonly database: DatabaseSync;
  readonly games: GameRegistry;
  readonly saves: SaveSlotsStore;
  readonly highScores: HighScoresStore;
  readonly saveSlotsPerGame: number;
}

/**
 * Applies one move to a saved game with the game's own rules and saves the result right away
 * (PS-07). When the move ends the game, the result goes into the high scores and the slot is
 * emptied in the same transaction (NG-27, PS-12).
 */
export function registerMoveRoutes(app: TypedFastify, dependencies: MoveRouteDependencies): void {
  const { database, saves, highScores } = dependencies;

  app.post(
    '/api/games/:gameId/slots/:slotNumber/moves',
    {
      schema: {
        params: slotParamsSchema,
        headers: deviceHeadersSchema,
        body: moveRequestSchema,
        response: { 200: moveResponseSchema },
      },
    },
    (request): MoveResponse => {
      const { game, slotNumber, save } = findGameSave(dependencies, request.params);
      const deviceId = request.headers['x-device-id'];
      if (save.lockedDeviceId !== deviceId) {
        throw new HttpError(
          409,
          'opened-elsewhere',
          'This game was opened on another device, so this device can no longer save it',
        );
      }

      const outcome = game.applyMove(save, request.body.move);
      if (!outcome.accepted) {
        throw new HttpError(422, 'move-refused', `Move refused: ${outcome.reason}`, outcome.reason);
      }

      const now = new Date().toISOString();
      if (!outcome.gameOver) {
        saves.updateSave(game.id, slotNumber, {
          ...outcome.storedState,
          lockedDeviceId: deviceId,
          lastPlayedAt: now,
        });
        return { gameOver: false };
      }

      const { score, category, details } = outcome.summary;
      runInTransaction(database, () => {
        highScores.insertResult({
          gameId: game.id,
          playerId: save.playerId,
          score,
          category,
          ...outcome.storedSummaryDetails,
          finishedAt: now,
        });
        saves.deleteSave(game.id, slotNumber);
      });
      return {
        gameOver: true,
        result: { playerId: save.playerId, score, category, details, finishedAt: now },
      };
    },
  );
}
