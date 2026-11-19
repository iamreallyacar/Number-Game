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
import { FAKE_ROOM_GAME_ID, fakeRoomTestGame } from './fake-room-test-game.js';
import { GameRegistry } from './games/game-registry.js';
import type { StepScheduler } from './rooms/step-loop.js';
import type { TypedFastify } from './typed-fastify.js';

export const DEVICE_A = { 'x-device-id': 'device-aaaa' };
export const DEVICE_B = { 'x-device-id': 'device-bbbb' };
export const FAKE_ROOMS_URL = `/api/games/${FAKE_ROOM_GAME_ID}/rooms`;
export const COUNTER_URL = `/api/games/${COUNTER_GAME_ID}`;
export const SLOTS_URL = `${COUNTER_URL}/slots`;

/** The URL of one save of the counter test game. Open and moves are added after it. */
export function saveUrl(slotNumber: number, saveId: string): string {
  return `${SLOTS_URL}/${String(slotNumber)}/saves/${saveId}`;
}

/** A clock and timer that only move when a test says so, so loops can be stepped by hand. */
export class ManualScheduler implements StepScheduler {
  private currentTime = 0;
  private readonly timers = new Set<{ readonly dueAt: number; readonly callback: () => void }>();

  now(): number {
    return this.currentTime;
  }

  schedule(callback: () => void, delayMilliseconds: number): () => void {
    const timer = { dueAt: this.currentTime + delayMilliseconds, callback };
    this.timers.add(timer);
    return () => {
      this.timers.delete(timer);
    };
  }

  /** Moves the clock forward and fires every timer that falls due, in order. */
  advance(milliseconds: number): void {
    const targetTime = this.currentTime + milliseconds;
    for (;;) {
      const nextTimer = [...this.timers]
        .filter((timer) => timer.dueAt <= targetTime)
        .sort((first, second) => first.dueAt - second.dueAt)[0];
      if (nextTimer === undefined) {
        break;
      }
      this.timers.delete(nextTimer);
      this.currentTime = Math.max(this.currentTime, nextTimer.dueAt);
      nextTimer.callback();
    }
    this.currentTime = targetTime;
  }

  get pendingTimerCount(): number {
    return this.timers.size;
  }
}

export interface TestServer {
  readonly app: TypedFastify;
  readonly database: DatabaseSync;
  /** Drives the step loops of room games. */
  readonly scheduler: ManualScheduler;
}

function createTestGameRegistry(): GameRegistry {
  const games = new GameRegistry();
  games.register(counterTestGame);
  games.register(fakeRoomTestGame);
  return games;
}

export interface TestServerOptions {
  /** The folder of the built browser app. Left out, the server has no browser app to serve. */
  readonly webAppDir?: string;
  /** The games the server offers. Left out, it offers the counter and fake room test games. */
  readonly games?: GameRegistry;
  /** Left out, 4, like the default setting. */
  readonly maxRoomGameRuns?: number;
}

/** A server with an in-memory database. */
export async function startTestServer(options: TestServerOptions = {}): Promise<TestServer> {
  const webAppDir = options.webAppDir ?? join(tmpdir(), 'no-web-app-here');
  const games = options.games ?? createTestGameRegistry();
  const scheduler = new ManualScheduler();
  const database = openInMemoryDatabase();
  const app = await buildApp({
    database,
    games,
    saveSlotsPerGame: 3,
    maxRoomGameRuns: options.maxRoomGameRuns ?? 4,
    stepScheduler: scheduler,
    webAppDir,
    logRequests: false,
  });
  return { app, database, scheduler };
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
    moveCount: 0,
  });
  if (!inserted) {
    throw new Error(`Test slot ${String(save.slotNumber)} is already in use`);
  }
  return saveId;
}
