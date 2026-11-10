import type { DatabaseSync } from 'node:sqlite';
import { Type } from 'typebox';
import type { HighScoresStore } from '../database/high-scores-store.js';
import { runInTransaction } from '../database/run-in-transaction.js';
import type { SaveSlotsStore } from '../database/save-slots-store.js';
import type { GameRegistry } from '../games/game-registry.js';
import { HttpError } from '../http-error.js';
import { deviceHeadersSchema, slotParamsSchema } from '../request-schemas.js';
import type { TypedFastify } from '../typed-fastify.js';
import { checkSlotNumber, requireSave } from './slot-access.js';

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
export function registerMoveRoutes(
  app: TypedFastify,
  { database, games, saves, highScores, saveSlotsPerGame }: MoveRouteDependencies,
): void {
  app.post(
    '/api/games/:gameId/slots/:slotNumber/moves',
    {
      schema: {
        params: slotParamsSchema,
        headers: deviceHeadersSchema,
        body: Type.Object({ move: Type.Unknown() }),
      },
    },
    (request) => {
      const game = games.getGame(request.params.gameId);
      const { slotNumber } = request.params;
      const deviceId = request.headers['x-device-id'];
      checkSlotNumber(slotNumber, saveSlotsPerGame);
      const save = requireSave(saves.findSave(game.id, slotNumber), slotNumber);
      if (save.lockedDeviceId !== deviceId) {
        throw new HttpError(
          409,
          'opened-elsewhere',
          'This game was opened on another device, so this device can no longer save it',
        );
      }

      const outcome = game.applyMove(save.stateJson, request.body.move);
      if (!outcome.accepted) {
        throw new HttpError(422, 'move-refused', `Move refused: ${outcome.reason}`, outcome.reason);
      }

      const now = new Date().toISOString();
      if (!outcome.gameOver) {
        saves.updateSave(game.id, slotNumber, {
          stateJson: outcome.stateJson,
          lockedDeviceId: deviceId,
          lastPlayedAt: now,
        });
        return { gameOver: false, state: outcome.state, details: outcome.details };
      }

      const result = {
        gameId: game.id,
        playerId: save.playerId,
        score: outcome.summary.score,
        category: outcome.summary.category,
        detailsJson: JSON.stringify(outcome.summary.details),
        finishedAt: now,
      };
      runInTransaction(database, () => {
        highScores.insertResult(result);
        saves.deleteSave(game.id, slotNumber);
      });
      return {
        gameOver: true,
        state: outcome.state,
        details: outcome.details,
        result: {
          playerId: result.playerId,
          score: result.score,
          category: result.category,
          details: outcome.summary.details,
          finishedAt: result.finishedAt,
        },
      };
    },
  );
}
