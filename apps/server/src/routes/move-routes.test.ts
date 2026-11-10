import { describe, expect, it } from 'vitest';
import {
  createPlayer,
  DEVICE_A,
  DEVICE_B,
  ONE_MATCH_FROM_GAME_OVER,
  SLOTS_URL,
  startTestServer,
  storeSave,
} from '../test-support.js';

const MOVES_URL = `${SLOTS_URL}/1/moves`;
const MATCH_THE_FIVES = { move: { type: 'match', firstIndex: 0, secondIndex: 1 } };

async function startServerWithSave() {
  const server = await startTestServer();
  await createPlayer(server.app, 'Sam');
  storeSave(server.database, 1, { ...ONE_MATCH_FROM_GAME_OVER, addNumbersLeft: 3 }, 'Sam');
  return server;
}

describe('move route', () => {
  it('applies a match and saves it right away', async () => {
    const { app } = await startServerWithSave();
    const moved = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: MATCH_THE_FIVES,
    });
    expect(moved.statusCode).toBe(200);
    expect(moved.json()).toMatchObject({
      gameOver: false,
      state: { score: 130, cells: [null, null, 1, 2, 1, 2, 1, 2, 1, 2] },
      details: { removedRowCount: 0, stageCleared: false },
    });
    const opened = await app.inject({
      method: 'POST',
      url: `${SLOTS_URL}/1/open`,
      headers: DEVICE_A,
    });
    expect(opened.json()).toMatchObject({ state: { score: 130 } });
  });

  it('applies Add Numbers', async () => {
    const { app } = await startServerWithSave();
    const moved = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: { move: { type: 'add-numbers' } },
    });
    expect(moved.json()).toMatchObject({
      state: { addNumbersLeft: 2 },
      details: { addedCount: 5 },
    });
  });

  it('refuses a move the rules do not allow and keeps the save as it was', async () => {
    const { app } = await startServerWithSave();
    const moved = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: { move: { type: 'hint' } },
    });
    expect(moved.statusCode).toBe(422);
    expect(moved.json()).toEqual({
      error: 'move-refused',
      message: 'Move refused: no-hints-left',
      reason: 'no-hints-left',
    });
  });

  it('rejects a move with the wrong shape', async () => {
    const { app } = await startServerWithSave();
    const moved = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: { move: { type: 'match', firstIndex: 'zero' } },
    });
    expect(moved.statusCode).toBe(400);
    expect(moved.json()).toMatchObject({ error: 'invalid-move' });
  });

  it('refuses moves from a device that no longer holds the lock', async () => {
    const { app } = await startServerWithSave();
    await app.inject({ method: 'POST', url: `${SLOTS_URL}/1/open`, headers: DEVICE_B });
    const fromOldDevice = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: MATCH_THE_FIVES,
    });
    expect(fromOldDevice.statusCode).toBe(409);
    expect(fromOldDevice.json()).toMatchObject({ error: 'opened-elsewhere' });
    const fromNewDevice = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_B,
      body: MATCH_THE_FIVES,
    });
    expect(fromNewDevice.statusCode).toBe(200);
  });

  it('records the result and empties the slot when the game ends', async () => {
    const server = await startTestServer();
    await createPlayer(server.app, 'Sam');
    storeSave(server.database, 1, ONE_MATCH_FROM_GAME_OVER, 'Sam');
    const { app } = server;

    const moved = await app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: MATCH_THE_FIVES,
    });
    expect(moved.json()).toMatchObject({
      gameOver: true,
      result: {
        playerId: 'Sam',
        score: 130,
        category: 'hard',
        details: { stage: 2, width: 10, difficulty: 'hard' },
      },
    });

    const opened = await app.inject({
      method: 'POST',
      url: `${SLOTS_URL}/1/open`,
      headers: DEVICE_A,
    });
    expect(opened.statusCode).toBe(404);
    const highScores = await app.inject({
      method: 'GET',
      url: '/api/games/number-game/high-scores',
    });
    expect(highScores.json()).toMatchObject({ highScores: [{ playerId: 'Sam', score: 130 }] });
  });

  it('reports a broken save instead of loading it', async () => {
    const server = await startTestServer();
    await createPlayer(server.app, 'Sam');
    storeSave(server.database, 1, { ...ONE_MATCH_FROM_GAME_OVER, stage: 0 }, 'Sam');
    const moved = await server.app.inject({
      method: 'POST',
      url: MOVES_URL,
      headers: DEVICE_A,
      body: MATCH_THE_FIVES,
    });
    expect(moved.statusCode).toBe(500);
    expect(moved.json()).toMatchObject({ error: 'broken-save' });
  });
});
