import { BLOCK_GAME_ID } from '@local/block-game';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { openInMemoryDatabase } from '../database/open-database.js';
import { createGameRegistry } from '../games/create-game-registry.js';
import { createPlayer, DEVICE_A } from '../test-support.js';

const SLOT_URL = `/api/games/${BLOCK_GAME_ID}/slots/1`;
const PLACE_FIRST_SHAPE_AT_CORNER = {
  move: { type: 'place-shape', slotIndex: 0, topRow: 0, leftColumn: 0 },
};

async function startServerWithBlockGameInSlot() {
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
    body: { playerId: 'Sam', options: { size: 8 } },
  });
  expect(started.statusCode).toBe(201);
  const saveUrl = `${SLOT_URL}/saves/${started.json<{ saveId: string }>().saveId}`;
  return { app, saveUrl };
}

describe('Block Game through the routes', () => {
  it('accepts a placement and saves it', async () => {
    const { app, saveUrl } = await startServerWithBlockGameInSlot();
    const moved = await app.inject({
      method: 'POST',
      url: `${saveUrl}/moves`,
      headers: DEVICE_A,
      body: PLACE_FIRST_SHAPE_AT_CORNER,
    });
    expect(moved.statusCode).toBe(200);
    expect(moved.json()).toEqual({ gameOver: false });
    const opened = await app.inject({ method: 'POST', url: `${saveUrl}/open`, headers: DEVICE_A });
    expect(opened.json()).toMatchObject({ state: { shapesPlaced: 1 } });
  });

  it('refuses a placement off the board and gives the reason', async () => {
    const { app, saveUrl } = await startServerWithBlockGameInSlot();
    const moved = await app.inject({
      method: 'POST',
      url: `${saveUrl}/moves`,
      headers: DEVICE_A,
      body: { move: { type: 'place-shape', slotIndex: 0, topRow: 99, leftColumn: 0 } },
    });
    expect(moved.statusCode).toBe(422);
    expect(moved.json()).toMatchObject({ error: 'move-refused', reason: 'out-of-bounds' });
  });
});
