// One function per room route of a room game. The request and answer shapes are shared with the server.
import {
  leaveRoomResponseSchema,
  roomListResponseSchema,
  roomResponseSchema,
  type Room,
} from '@local/game-server-api';
import { requestJson } from './api-request.js';
import { gamePath } from './game-server-api.js';

function roomsPath(gameId: string): string {
  return `${gamePath(gameId)}/rooms`;
}

function roomPath(gameId: string, roomId: string): string {
  return `${roomsPath(gameId)}/${encodeURIComponent(roomId)}`;
}

/** Every waiting room, and every running room that has a dropped player to rejoin (SG-05, SG-45). */
export async function listRooms(gameId: string): Promise<readonly Room[]> {
  const response = await requestJson(
    { method: 'GET', path: roomsPath(gameId) },
    roomListResponseSchema,
  );
  return response.rooms;
}

/**
 * Reads one room. The player who asks is noted as still being in a waiting room, and a waiting
 * room member who is not asking for a while is removed. A page with no player ID leaves it out.
 */
export async function getRoom(
  gameId: string,
  roomId: string,
  askingPlayerId: string | null,
): Promise<Room> {
  const query = askingPlayerId === null ? '' : `?playerId=${encodeURIComponent(askingPlayerId)}`;
  const response = await requestJson(
    { method: 'GET', path: `${roomPath(gameId, roomId)}${query}` },
    roomResponseSchema,
  );
  return response.room;
}

/** Makes a room with the player as its host. */
export async function createRoom(gameId: string, playerId: string): Promise<Room> {
  const response = await requestJson(
    { method: 'POST', path: roomsPath(gameId), body: { playerId } },
    roomResponseSchema,
  );
  return response.room;
}

export async function joinRoom(gameId: string, roomId: string, playerId: string): Promise<Room> {
  const response = await requestJson(
    { method: 'POST', path: `${roomPath(gameId, roomId)}/join`, body: { playerId } },
    roomResponseSchema,
  );
  return response.room;
}

/** Only the host can start the run (SG-06). */
export async function startRoom(gameId: string, roomId: string, playerId: string): Promise<Room> {
  const response = await requestJson(
    { method: 'POST', path: `${roomPath(gameId, roomId)}/start`, body: { playerId } },
    roomResponseSchema,
  );
  return response.room;
}

/** Leaves a waiting room. Answers whether the room closed because nobody was left (SG-07). */
export async function leaveRoom(
  gameId: string,
  roomId: string,
  playerId: string,
): Promise<boolean> {
  const response = await requestJson(
    { method: 'POST', path: `${roomPath(gameId, roomId)}/leave`, body: { playerId } },
    leaveRoomResponseSchema,
  );
  return response.closed;
}
