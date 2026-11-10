// One function per server route. The request and answer shapes are shared with the server.
import {
  createPlayerResponseSchema,
  highScoresResponseSchema,
  moveResponseSchema,
  openedSaveResponseSchema,
  personalBestsResponseSchema,
  playerListResponseSchema,
  slotListResponseSchema,
  type GameResult,
  type MoveResponse,
  type OpenedSave,
  type SlotListing,
} from '@local/game-server-api';
import { requestJson, requestWithoutBody } from './api-request.js';
import { getDeviceId } from './device-id.js';

function gamePath(gameId: string): string {
  return `/api/games/${encodeURIComponent(gameId)}`;
}

function slotPath(gameId: string, slotNumber: number): string {
  return `${gamePath(gameId)}/slots/${String(slotNumber)}`;
}

/**
 * Names one game in one slot. The server refuses a save id that no longer matches the slot with
 * the error 'save-gone', so a stale page never reaches a newer game in the same slot (PS-19).
 */
export interface SaveAddress {
  readonly gameId: string;
  readonly slotNumber: number;
  readonly saveId: string;
}

function savePath(address: SaveAddress): string {
  return `${slotPath(address.gameId, address.slotNumber)}/saves/${encodeURIComponent(address.saveId)}`;
}

export async function listPlayerIds(): Promise<readonly string[]> {
  const response = await requestJson(
    { method: 'GET', path: '/api/players' },
    playerListResponseSchema,
  );
  return response.playerIds;
}

/** Creates a player ID and returns it as the server stored it. */
export async function createPlayer(playerId: string): Promise<string> {
  const response = await requestJson(
    { method: 'POST', path: '/api/players', body: { playerId } },
    createPlayerResponseSchema,
  );
  return response.playerId;
}

export async function listSlots(gameId: string): Promise<readonly SlotListing[]> {
  const response = await requestJson(
    { method: 'GET', path: `${gamePath(gameId)}/slots` },
    slotListResponseSchema,
  );
  return response.slots;
}

export interface StartGameRequest {
  readonly gameId: string;
  readonly slotNumber: number;
  readonly playerId: string;
  readonly options: unknown;
}

export async function startGame(request: StartGameRequest): Promise<OpenedSave> {
  return requestJson(
    {
      method: 'POST',
      path: slotPath(request.gameId, request.slotNumber),
      body: { playerId: request.playerId, options: request.options },
      deviceId: getDeviceId(),
    },
    openedSaveResponseSchema,
  );
}

/** Loads a save and moves its lock to this device (PS-18). */
export async function openSave(address: SaveAddress): Promise<OpenedSave> {
  return requestJson(
    { method: 'POST', path: `${savePath(address)}/open`, deviceId: getDeviceId() },
    openedSaveResponseSchema,
  );
}

export async function deleteSave(address: SaveAddress): Promise<void> {
  await requestWithoutBody({ method: 'DELETE', path: savePath(address) });
}

export async function sendMove(address: SaveAddress, move: unknown): Promise<MoveResponse> {
  return requestJson(
    {
      method: 'POST',
      path: `${savePath(address)}/moves`,
      body: { move },
      deviceId: getDeviceId(),
    },
    moveResponseSchema,
  );
}

/** Top results, either across every category or for one category. */
export async function listHighScores(
  gameId: string,
  category: string | null,
): Promise<readonly GameResult[]> {
  const query = category === null ? '' : `?category=${encodeURIComponent(category)}`;
  const response = await requestJson(
    { method: 'GET', path: `${gamePath(gameId)}/high-scores${query}` },
    highScoresResponseSchema,
  );
  return response.highScores;
}

/** A player's best result in each category. */
export async function listPersonalBests(
  gameId: string,
  playerId: string,
): Promise<readonly GameResult[]> {
  const response = await requestJson(
    {
      method: 'GET',
      path: `${gamePath(gameId)}/personal-bests/${encodeURIComponent(playerId)}`,
    },
    personalBestsResponseSchema,
  );
  return response.personalBests;
}
