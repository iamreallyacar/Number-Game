// Builders shared by the test files. Excluded from the build in tsconfig.build.json.
import { mkdtempSync, writeFileSync } from 'node:fs';
import type { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { GameState } from '@local/number-game';
import { buildApp } from './app.js';
import { openInMemoryDatabase } from './database/open-database.js';
import { SaveSlotsStore } from './database/save-slots-store.js';
import { createGameRegistry } from './games/create-game-registry.js';
import { NUMBER_GAME_ID } from './games/number-game.js';
import type { TypedFastify } from './typed-fastify.js';

export const DEVICE_A = { 'x-device-id': 'device-aaaa' };
export const DEVICE_B = { 'x-device-id': 'device-bbbb' };
export const SLOTS_URL = `/api/games/${NUMBER_GAME_ID}/slots`;

export interface TestServer {
  readonly app: TypedFastify;
  readonly database: DatabaseSync;
}

export async function startTestServer(
  webAppDir = join(tmpdir(), 'no-web-app-here'),
): Promise<TestServer> {
  const database = openInMemoryDatabase();
  const app = await buildApp({
    database,
    games: createGameRegistry(),
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

/** Puts a hand-made game state into a slot, locked to device A. */
export function storeSave(
  database: DatabaseSync,
  slotNumber: number,
  state: GameState,
  playerId: string,
): void {
  new SaveSlotsStore(database).insertSave({
    gameId: NUMBER_GAME_ID,
    slotNumber,
    playerId,
    stateJson: JSON.stringify(state),
    lockedDeviceId: DEVICE_A['x-device-id'],
    lastPlayedAt: '2026-01-01T00:00:00.000Z',
  });
}

/** A Hard game with one match left (the two 5s) and no Add Numbers, so that match ends it. */
export const ONE_MATCH_FROM_GAME_OVER: GameState = {
  width: 10,
  cells: [5, 5, 1, 2, 1, 2, 1, 2, 1, 2],
  score: 120,
  stage: 2,
  difficulty: 'hard',
  addNumbersLeft: 0,
  hintsLeft: 0,
  randomState: 1,
};
