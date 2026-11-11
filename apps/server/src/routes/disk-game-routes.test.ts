import { DISK_GAME_ID } from '@local/disk-game';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { openInMemoryDatabase } from '../database/open-database.js';
import { createGameRegistry } from '../games/create-game-registry.js';
import { createPlayer, DEVICE_A } from '../test-support.js';

const SLOT_URL = `/api/games/${DISK_GAME_ID}/slots/1`;

async function startServerWithDiskGameInSlot() {
  const app = await buildApp({
    database: openInMemoryDatabase(),
    games: createGameRegistry(),
    saveSlotsPerGame: 3,
    webAppDir: '/no-web-app-here',
    logRequests: false,
  });
  await createPlayer(app, 'Sam');
  const started = await app.inject({
    method: 'POST',
    url: SLOT_URL,
    headers: DEVICE_A,
    body: { playerId: 'Sam', options: { startingDiskCount: 3 } },
  });
  expect(started.statusCode).toBe(201);
  const saveUrl = `${SLOT_URL}/saves/${started.json<{ saveId: string }>().saveId}`;
  return { app, saveUrl };
}

describe('Disk Game through the routes', () => {
  it('accepts a hint and saves its cost', async () => {
    const { app, saveUrl } = await startServerWithDiskGameInSlot();
    const before = await app.inject({ method: 'POST', url: `${saveUrl}/open`, headers: DEVICE_A });
    const { movesLeft } = before.json<{ state: { movesLeft: number } }>().state;
    const moved = await app.inject({
      method: 'POST',
      url: `${saveUrl}/moves`,
      headers: DEVICE_A,
      body: { move: { type: 'hint' } },
    });
    expect(moved.statusCode).toBe(200);
    expect(moved.json()).toEqual({ gameOver: false });
    const opened = await app.inject({ method: 'POST', url: `${saveUrl}/open`, headers: DEVICE_A });
    expect(opened.json()).toMatchObject({
      state: { movesLeft: movesLeft - 2, stageAssisted: true },
    });
  });

  it('refuses an undo at the start of a stage and gives the reason', async () => {
    const { app, saveUrl } = await startServerWithDiskGameInSlot();
    const moved = await app.inject({
      method: 'POST',
      url: `${saveUrl}/moves`,
      headers: DEVICE_A,
      body: { move: { type: 'undo' } },
    });
    expect(moved.statusCode).toBe(422);
    expect(moved.json()).toMatchObject({ error: 'move-refused', reason: 'nothing-to-undo' });
  });
});
