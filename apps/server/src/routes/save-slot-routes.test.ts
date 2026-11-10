import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { TypedFastify } from '../typed-fastify.js';
import {
  createPlayer,
  DEVICE_A,
  DEVICE_B,
  saveUrl,
  SLOTS_URL,
  startTestServer,
  storeSave,
} from '../test-support.js';

const NEW_GAME = { playerId: 'Sam', options: { target: 3 } };
const SAVE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function startServerWithPlayer() {
  const server = await startTestServer();
  await createPlayer(server.app, 'Sam');
  return server;
}

/** Starts a counter game in a slot and returns its save id. */
async function startGameInSlot(
  app: TypedFastify,
  slotNumber: number,
  device: Record<string, string>,
): Promise<string> {
  const created = await app.inject({
    method: 'POST',
    url: `${SLOTS_URL}/${String(slotNumber)}`,
    headers: device,
    body: NEW_GAME,
  });
  expect(created.statusCode).toBe(201);
  return created.json<{ saveId: string }>().saveId;
}

describe('save slot routes', () => {
  it('lists every slot as empty at first', async () => {
    const { app } = await startServerWithPlayer();
    const response = await app.inject({ method: 'GET', url: SLOTS_URL });
    expect(response.json()).toEqual({
      slots: [
        { slotNumber: 1, save: null },
        { slotNumber: 2, save: null },
        { slotNumber: 3, save: null },
      ],
    });
  });

  it('starts a new game in an empty slot and lists its summary', async () => {
    const { app } = await startServerWithPlayer();
    const created = await app.inject({
      method: 'POST',
      url: `${SLOTS_URL}/2`,
      headers: DEVICE_A,
      body: NEW_GAME,
    });
    expect(created.statusCode).toBe(201);
    const { saveId } = created.json<{ saveId: string }>();
    expect(saveId).toMatch(SAVE_ID_PATTERN);
    expect(created.json()).toMatchObject({
      slotNumber: 2,
      playerId: 'Sam',
      state: { count: 0, target: 3 },
    });

    const listed = await app.inject({ method: 'GET', url: SLOTS_URL });
    expect(listed.json()).toMatchObject({
      slots: [
        { slotNumber: 1, save: null },
        {
          slotNumber: 2,
          save: {
            saveId,
            playerId: 'Sam',
            summary: { score: 0, category: 'to-3', details: { count: 0 } },
          },
        },
        { slotNumber: 3, save: null },
      ],
    });
  });

  it('links the slot to the player ID as it was created', async () => {
    const { app } = await startServerWithPlayer();
    const created = await app.inject({
      method: 'POST',
      url: `${SLOTS_URL}/1`,
      headers: DEVICE_A,
      body: { ...NEW_GAME, playerId: 'sam' },
    });
    expect(created.json()).toMatchObject({ playerId: 'Sam' });
  });

  it('refuses a slot that is in use', async () => {
    const { app } = await startServerWithPlayer();
    await app.inject({ method: 'POST', url: `${SLOTS_URL}/1`, headers: DEVICE_A, body: NEW_GAME });
    const second = await app.inject({
      method: 'POST',
      url: `${SLOTS_URL}/1`,
      headers: DEVICE_A,
      body: NEW_GAME,
    });
    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({ error: 'slot-in-use' });
  });

  it.each([
    {
      name: 'an unknown player',
      body: { ...NEW_GAME, playerId: 'Nobody' },
      url: `${SLOTS_URL}/1`,
      status: 404,
      error: 'unknown-player',
    },
    {
      name: 'options the game does not offer',
      body: { ...NEW_GAME, options: { target: 4 } },
      url: `${SLOTS_URL}/1`,
      status: 400,
      error: 'invalid-options',
    },
    {
      name: 'a slot above the limit',
      body: NEW_GAME,
      url: `${SLOTS_URL}/4`,
      status: 404,
      error: 'unknown-slot',
    },
    {
      name: 'an unknown game',
      body: NEW_GAME,
      url: '/api/games/chess/slots/1',
      status: 404,
      error: 'unknown-game',
    },
  ])('refuses to start a game for $name', async ({ body, url, status, error }) => {
    const { app } = await startServerWithPlayer();
    const response = await app.inject({ method: 'POST', url, headers: DEVICE_A, body });
    expect(response.statusCode).toBe(status);
    expect(response.json()).toMatchObject({ error });
  });

  it('refuses to start a game without a device ID', async () => {
    const { app } = await startServerWithPlayer();
    const response = await app.inject({ method: 'POST', url: `${SLOTS_URL}/1`, body: NEW_GAME });
    expect(response.statusCode).toBe(400);
  });

  it('gives every new game in a slot its own save id', async () => {
    const { app } = await startServerWithPlayer();
    const firstSaveId = await startGameInSlot(app, 1, DEVICE_A);
    await app.inject({ method: 'DELETE', url: saveUrl(1, firstSaveId) });
    const secondSaveId = await startGameInSlot(app, 1, DEVICE_A);
    expect(secondSaveId).not.toBe(firstSaveId);
  });

  it('loads a slot exactly as it was saved', async () => {
    const { app } = await startServerWithPlayer();
    const created = await app.inject({
      method: 'POST',
      url: `${SLOTS_URL}/1`,
      headers: DEVICE_A,
      body: NEW_GAME,
    });
    const opened = await app.inject({
      method: 'POST',
      url: `${saveUrl(1, created.json<{ saveId: string }>().saveId)}/open`,
      headers: DEVICE_B,
    });
    expect(opened.statusCode).toBe(200);
    expect(opened.json<unknown>()).toEqual(created.json<unknown>());
  });

  it('upgrades a save written in an older format before using it', async () => {
    const { app, database } = await startServerWithPlayer();
    const saveId = storeSave(database, {
      slotNumber: 1,
      playerId: 'Sam',
      state: { value: 2, target: 3 },
      stateVersion: 1,
    });
    const opened = await app.inject({
      method: 'POST',
      url: `${saveUrl(1, saveId)}/open`,
      headers: DEVICE_A,
    });
    expect(opened.json()).toMatchObject({ state: { count: 2, target: 3 } });
    const listed = await app.inject({ method: 'GET', url: SLOTS_URL });
    expect(listed.json<{ slots: unknown[] }>().slots[0]).toMatchObject({
      slotNumber: 1,
      save: { summary: { score: 20, details: { count: 2 } } },
    });
  });

  it('reports a save in a format newer than the server knows as broken', async () => {
    const { app, database } = await startServerWithPlayer();
    const saveId = storeSave(database, {
      slotNumber: 1,
      playerId: 'Sam',
      state: { count: 2, target: 3 },
      stateVersion: 3,
    });
    const opened = await app.inject({
      method: 'POST',
      url: `${saveUrl(1, saveId)}/open`,
      headers: DEVICE_A,
    });
    expect(opened.statusCode).toBe(500);
    expect(opened.json()).toMatchObject({ error: 'broken-save' });
  });

  it('refuses to open a save in a slot that is now empty, as save-gone', async () => {
    const { app } = await startServerWithPlayer();
    const response = await app.inject({
      method: 'POST',
      url: `${saveUrl(1, randomUUID())}/open`,
      headers: DEVICE_A,
    });
    expect(response.statusCode).toBe(410);
    expect(response.json()).toMatchObject({ error: 'save-gone' });
  });

  it('refuses an old save id after the slot was reused, and leaves the lock alone', async () => {
    const { app } = await startServerWithPlayer();
    const oldSaveId = await startGameInSlot(app, 1, DEVICE_A);
    await app.inject({ method: 'DELETE', url: saveUrl(1, oldSaveId) });
    const newSaveId = await startGameInSlot(app, 1, DEVICE_B);

    const stale = await app.inject({
      method: 'POST',
      url: `${saveUrl(1, oldSaveId)}/open`,
      headers: DEVICE_A,
    });
    expect(stale.statusCode).toBe(410);
    expect(stale.json()).toMatchObject({ error: 'save-gone' });

    // Had the lock moved to device A, this move from device B would be refused.
    const moveFromOwner = await app.inject({
      method: 'POST',
      url: `${saveUrl(1, newSaveId)}/moves`,
      headers: DEVICE_B,
      body: { move: { type: 'add', amount: 1 } },
    });
    expect(moveFromOwner.statusCode).toBe(200);
  });

  it('refuses a save id that is not in the server format', async () => {
    const { app } = await startServerWithPlayer();
    const response = await app.inject({
      method: 'POST',
      url: `${saveUrl(1, 'not-a-save-id')}/open`,
      headers: DEVICE_A,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'invalid-request' });
  });

  it('deletes a save so its slot is empty again', async () => {
    const { app } = await startServerWithPlayer();
    const saveId = await startGameInSlot(app, 1, DEVICE_A);
    const deleted = await app.inject({ method: 'DELETE', url: saveUrl(1, saveId) });
    expect(deleted.statusCode).toBe(204);
    const deletedAgain = await app.inject({ method: 'DELETE', url: saveUrl(1, saveId) });
    expect(deletedAgain.statusCode).toBe(410);
    expect(deletedAgain.json()).toMatchObject({ error: 'save-gone' });
  });

  it('does not delete a newer game with an old save id', async () => {
    const { app } = await startServerWithPlayer();
    const oldSaveId = await startGameInSlot(app, 1, DEVICE_A);
    await app.inject({ method: 'DELETE', url: saveUrl(1, oldSaveId) });
    const newSaveId = await startGameInSlot(app, 1, DEVICE_B);
    const stale = await app.inject({ method: 'DELETE', url: saveUrl(1, oldSaveId) });
    expect(stale.statusCode).toBe(410);
    const opened = await app.inject({
      method: 'POST',
      url: `${saveUrl(1, newSaveId)}/open`,
      headers: DEVICE_B,
    });
    expect(opened.statusCode).toBe(200);
  });
});
