// One function per server route. The answer shapes follow the Server API section of ARCHITECTURE.md.
import { Type, type Static } from 'typebox';
import { requestJson, requestWithoutBody } from './api-request.js';
import { getDeviceId } from './device-id.js';

const summaryDetailsSchema = Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]));

const savedSlotSchema = Type.Object({
  playerId: Type.String(),
  lastPlayedAt: Type.String(),
  summary: Type.Object({
    score: Type.Number(),
    category: Type.String(),
    details: summaryDetailsSchema,
  }),
});

const slotListingSchema = Type.Object({
  slotNumber: Type.Integer(),
  save: Type.Union([savedSlotSchema, Type.Null()]),
});

const openedSaveSchema = Type.Object({
  slotNumber: Type.Integer(),
  playerId: Type.String(),
  lastPlayedAt: Type.String(),
  // Each game checks its own state shape before using it.
  state: Type.Unknown(),
});

const gameResultSchema = Type.Object({
  playerId: Type.String(),
  score: Type.Number(),
  category: Type.String(),
  details: summaryDetailsSchema,
  finishedAt: Type.String(),
});

const moveResponseSchema = Type.Object({
  gameOver: Type.Boolean(),
  state: Type.Unknown(),
  details: Type.Unknown(),
  result: Type.Optional(gameResultSchema),
});

export type SummaryDetails = Static<typeof summaryDetailsSchema>;
export type SlotListing = Static<typeof slotListingSchema>;
export type OpenedSave = Static<typeof openedSaveSchema>;
export type GameResult = Static<typeof gameResultSchema>;
export type MoveResponse = Static<typeof moveResponseSchema>;

function gamePath(gameId: string): string {
  return `/api/games/${encodeURIComponent(gameId)}`;
}

function slotPath(gameId: string, slotNumber: number): string {
  return `${gamePath(gameId)}/slots/${String(slotNumber)}`;
}

export async function listPlayerIds(): Promise<readonly string[]> {
  const response = await requestJson(
    { method: 'GET', path: '/api/players' },
    Type.Object({ playerIds: Type.Array(Type.String()) }),
  );
  return response.playerIds;
}

/** Creates a player ID and returns it as the server stored it. */
export async function createPlayer(playerId: string): Promise<string> {
  const response = await requestJson(
    { method: 'POST', path: '/api/players', body: { playerId } },
    Type.Object({ playerId: Type.String() }),
  );
  return response.playerId;
}

export async function listSlots(gameId: string): Promise<readonly SlotListing[]> {
  const response = await requestJson(
    { method: 'GET', path: `${gamePath(gameId)}/slots` },
    Type.Object({ slots: Type.Array(slotListingSchema) }),
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
    openedSaveSchema,
  );
}

/** Loads a save and moves its lock to this device (PS-18). */
export async function openSlot(gameId: string, slotNumber: number): Promise<OpenedSave> {
  return requestJson(
    { method: 'POST', path: `${slotPath(gameId, slotNumber)}/open`, deviceId: getDeviceId() },
    openedSaveSchema,
  );
}

export async function deleteSlot(gameId: string, slotNumber: number): Promise<void> {
  await requestWithoutBody({ method: 'DELETE', path: slotPath(gameId, slotNumber) });
}

export async function sendMove(
  gameId: string,
  slotNumber: number,
  move: unknown,
): Promise<MoveResponse> {
  return requestJson(
    {
      method: 'POST',
      path: `${slotPath(gameId, slotNumber)}/moves`,
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
    Type.Object({ highScores: Type.Array(gameResultSchema) }),
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
    Type.Object({ personalBests: Type.Array(gameResultSchema) }),
  );
  return response.personalBests;
}
