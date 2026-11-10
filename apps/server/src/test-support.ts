// Builders shared by the test files. Excluded from the build in tsconfig.build.json.
import { randomUUID } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import type { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from './app.js';
import { COUNTER_FORMAT_VERSION, COUNTER_GAME_ID, counterTestGame } from './counter-test-game.js';
import { openInMemoryDatabase } from './database/open-database.js';
import { SaveSlotsStore } from './database/save-slots-store.js';
import { GameRegistry } from './games/game-registry.js';
import type { TypedFastify } from './typed-fastify.js';

export const DEVICE_A = { 'x-device-id': 'device-aaaa' };
export const DEVICE_B = { 'x-device-id': 'device-bbbb' };
export const COUNTER_URL = `/api/games/${COUNTER_GAME_ID}`;
export const SLOTS_URL = `${COUNTER_URL}/slots`;

/** The URL of one save of the counter test game. Open and moves are added after it. */
export function saveUrl(slotNumber: number, saveId: string): string {
  return `${SLOTS_URL}/${String(slotNumber)}/saves/${saveId}`;
}

export interface TestServer {
  readonly app: TypedFastify;
  readonly database: DatabaseSync;
}

/** A server with an in-memory database that offers only the counter test game. */
export async function startTestServer(
  webAppDir = join(tmpdir(), 'no-web-app-here'),
): Promise<TestServer> {
  const database = openInMemoryDatabase();
  const games = new GameRegistry();
  games.register(counterTestGame);
  const app = await buildApp({
    database,
    games,
    saveSlotsPerGame: 3,
    webAppDir,
    logRequests: false,
  });
  return { app, database };
}

export function makeWebAppDir(): string {
  const webAppDir = mkdtempSync(join(tmpdir(), 'web-app-'));
  writeFileSync(join(webAppDir, 'index.html'), '<html>dashboard</html>');
  writeFileSync(join(webAppDir, 'app.js'), 'console.log("app")');
  return webAppDir;
}

export async function createPlayer(app: TypedFastify, playerId: string): Promise<void> {
  const response = await app.inject({ method: 'POST', url: '/api/players', body: { playerId } });
  if (response.statusCode !== 201) {
    throw new Error(`Could not create test player: ${response.body}`);
  }
}

export interface HandMadeSave {
  readonly slotNumber: number;
  readonly playerId: string;
  readonly state: unknown;
  readonly stateVersion?: number;
}

/** Puts a hand-made counter game state into a slot, locked to device A. Returns its save id. */
export function storeSave(database: DatabaseSync, save: HandMadeSave): string {
  const saveId = randomUUID();
  const inserted = new SaveSlotsStore(database).insertSave({
    gameId: COUNTER_GAME_ID,
    slotNumber: save.slotNumber,
    saveId,
    playerId: save.playerId,
    stateJson: JSON.stringify(save.state),
    stateVersion: save.stateVersion ?? COUNTER_FORMAT_VERSION,
    lockedDeviceId: DEVICE_A['x-device-id'],
    lastPlayedAt: '2026-01-01T00:00:00.000Z',
  });
  if (!inserted) {
    throw new Error(`Test slot ${String(save.slotNumber)} is already in use`);
  }
  return saveId;
}
