// Lookups that several routes start with. Each one throws the matching error when the thing
// named in the request does not exist.
import type { PlayersStore } from '../database/players-store.js';
import type { SaveSlotsStore, StoredSave } from '../database/save-slots-store.js';
import type { GameRegistry, RegisteredGame } from '../games/game-registry.js';
import { HttpError } from '../http-error.js';

export interface SlotParams {
  readonly gameId: string;
  readonly slotNumber: number;
}

export interface SaveParams extends SlotParams {
  readonly saveId: string;
}

export interface GameSlot {
  readonly game: RegisteredGame;
  readonly slotNumber: number;
}

export interface SlotLookupDependencies {
  readonly games: GameRegistry;
  readonly saves: SaveSlotsStore;
  readonly saveSlotsPerGame: number;
}

/** Finds the game and checks the slot number is within the configured number of slots. */
export function findGameSlot(
  { games, saveSlotsPerGame }: SlotLookupDependencies,
  params: SlotParams,
): GameSlot {
  const game = games.getGame(params.gameId);
  if (params.slotNumber > saveSlotsPerGame) {
    throw new HttpError(
      404,
      'unknown-slot',
      `Slot ${String(params.slotNumber)} does not exist. There are ${String(saveSlotsPerGame)} slots`,
    );
  }
  return { game, slotNumber: params.slotNumber };
}

/**
 * Finds the game, the slot, and the save named in the request. A slot that is empty, or that
 * now holds a different game, is refused with 'save-gone', so an old link or a stale tab never
 * reaches someone else's game (PS-19, PS-20).
 */
export function findGameSave(
  dependencies: SlotLookupDependencies,
  params: SaveParams,
): GameSlot & { readonly save: StoredSave } {
  const gameSlot = findGameSlot(dependencies, params);
  const save = dependencies.saves.findSave(gameSlot.game.id, gameSlot.slotNumber);
  const slotText = String(gameSlot.slotNumber);
  if (save === null) {
    throw new HttpError(410, 'save-gone', `The game in slot ${slotText} has ended or was deleted`);
  }
  if (save.saveId !== params.saveId) {
    throw new HttpError(
      410,
      'save-gone',
      `The game in slot ${slotText} has ended, and the slot now holds a different game`,
    );
  }
  return { ...gameSlot, save };
}

/** Finds a player ID in any letter case and returns it as it was created. */
export function findPlayerId(players: PlayersStore, requestedPlayerId: string): string {
  const playerId = players.findPlayerId(requestedPlayerId);
  if (playerId === null) {
    throw new HttpError(404, 'unknown-player', `There is no player ID '${requestedPlayerId}'`);
  }
  return playerId;
}
