import { describe, expect, it } from 'vitest';
import {
  COUNTER_URL,
  createPlayer,
  DEVICE_A,
  DEVICE_B,
  SLOTS_URL,
  startTestServer,
  storeSave,
} from '../test-support.js';

const MOVES_URL = `${SLOTS_URL}/1/moves`;
const ADD_ONE = { move: { type: 'add', amount: 1 } };

async function startServerWithSave(count: number) {
  const server = await startTestServer();
  await createPlayer(server.app, 'Sam');
  storeSave(server.database, { slotNumber: 1, playerId: 'Sam', state: { count, target: 3 } });
  return server;
}

describe('move route', () => {
  it('applies a move and saves it right away', async () => {
    const { app } = await startServerWithSave(1);
    const moved = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: ADD_ONE,
    });
    expect(moved.statusCode).toBe(200);
    expect(moved.json()).toEqual({ gameOver: false });
    const opened = await app.inject({
      method: 'POST',
      url: `${SLOTS_URL}/1/open`,
      headers: DEVICE_A,
    });
    expect(opened.json()).toMatchObject({ state: { count: 2 } });
  });

  it('refuses a move the rules do not allow and keeps the save as it was', async () => {
    const { app } = await startServerWithSave(1);
    const moved = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: { move: { type: 'add', amount: 5 } },
    });
    expect(moved.statusCode).toBe(422);
    expect(moved.json()).toEqual({
      error: 'move-refused',
      message: 'Move refused: past-target',
      reason: 'past-target',
    });
    const opened = await app.inject({
      method: 'POST',
      url: `${SLOTS_URL}/1/open`,
      headers: DEVICE_A,
    });
    expect(opened.json()).toMatchObject({ state: { count: 1 } });
  });

  it('rejects a move with the wrong shape', async () => {
    const { app } = await startServerWithSave(1);
    const moved = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: { move: { type: 'add', amount: 'one' } },
    });
    expect(moved.statusCode).toBe(400);
    expect(moved.json()).toMatchObject({ error: 'invalid-move' });
  });

  it('refuses moves from a device that no longer holds the lock', async () => {
    const { app } = await startServerWithSave(1);
    await app.inject({ method: 'POST', url: `${SLOTS_URL}/1/open`, headers: DEVICE_B });
    const fromOldDevice = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: ADD_ONE,
    });
    expect(fromOldDevice.statusCode).toBe(409);
    expect(fromOldDevice.json()).toMatchObject({ error: 'opened-elsewhere' });
    const fromNewDevice = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_B,
      body: ADD_ONE,
    });
    expect(fromNewDevice.statusCode).toBe(200);
  });

  it('records the result and empties the slot when the game ends', async () => {
    const { app } = await startServerWithSave(2);
    const moved = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: ADD_ONE,
    });
    expect(moved.json()).toMatchObject({
      gameOver: true,
      result: { playerId: 'Sam', score: 30, category: 'to-3', details: { count: 3 } },
    });

    const opened = await app.inject({
      method: 'POST',
      url: `${SLOTS_URL}/1/open`,
      headers: DEVICE_A,
    });
    expect(opened.statusCode).toBe(404);
    const highScores = await app.inject({ method: 'GET', url: `${COUNTER_URL}/high-scores` });
    expect(highScores.json()).toMatchObject({
      highScores: [{ playerId: 'Sam', score: 30, details: { count: 3 } }],
    });
  });

  it('reports a broken save instead of loading it', async () => {
    const server = await startTestServer();
    await createPlayer(server.app, 'Sam');
    storeSave(server.database, { slotNumber: 1, playerId: 'Sam', state: { count: 'two' } });
    const moved = await server.app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: ADD_ONE,
    });
    expect(moved.statusCode).toBe(500);
    expect(moved.json()).toMatchObject({ error: 'broken-save' });
  });
});
