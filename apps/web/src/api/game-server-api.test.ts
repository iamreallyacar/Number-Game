import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '../test-support/memory-storage.js';
import { ApiError } from './api-request.js';
import { getDeviceId } from './device-id.js';
import { deleteSave, openSave, sendMove, startGame, type SaveAddress } from './game-server-api.js';

const SAVE_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const ADDRESS: SaveAddress = { gameId: 'number-game', slotNumber: 2, saveId: SAVE_ID };
const SAVE_PATH = `/api/games/number-game/slots/2/saves/${SAVE_ID}`;
const OPENED_SAVE = {
  saveId: SAVE_ID,
  slotNumber: 2,
  playerId: 'Sam',
  lastPlayedAt: '2026-01-01T00:00:00.000Z',
  state: {},
};

function answerWith(status: number, body: unknown) {
  const fetchSpy = vi.fn<(path: string, init: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(Response.json(body, { status })),
  );
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}

function requestedPaths(fetchSpy: ReturnType<typeof answerWith>): string[] {
  return fetchSpy.mock.calls.map(([path]) => path);
}

describe('save routes in the browser', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    // The device ID lives in local storage, which the tests keep in memory.
    storage = new MemoryStorage();
    vi.stubGlobal('window', { localStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the save id the server gave a new game', async () => {
    answerWith(201, OPENED_SAVE);
    const save = await startGame({
      gameId: 'number-game',
      slotNumber: 2,
      playerId: 'Sam',
      options: {},
    });
    expect(save.saveId).toBe(SAVE_ID);
  });

  it('names the save in the open, move, and delete paths', async () => {
    const fetchSpy = answerWith(200, OPENED_SAVE);
    await openSave(ADDRESS);
    fetchSpy.mockResolvedValueOnce(Response.json({ gameOver: false }));
    await sendMove(ADDRESS, { type: 'hint' });
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await deleteSave(ADDRESS);
    expect(requestedPaths(fetchSpy)).toEqual([
      `${SAVE_PATH}/open`,
      `${SAVE_PATH}/moves`,
      SAVE_PATH,
    ]);
  });

  it('sends this device id when starting, opening, and moving, for the save lock', async () => {
    const fetchSpy = answerWith(200, OPENED_SAVE);
    await startGame({ gameId: 'number-game', slotNumber: 2, playerId: 'Sam', options: {} });
    await openSave(ADDRESS);
    fetchSpy.mockResolvedValueOnce(Response.json({ gameOver: false }));
    await sendMove(ADDRESS, { type: 'hint' });
    const deviceId = getDeviceId(storage);
    expect(fetchSpy.mock.calls).toHaveLength(3);
    for (const [, init] of fetchSpy.mock.calls) {
      expect(init.headers).toMatchObject({ 'x-device-id': deviceId });
    }
  });

  it('passes on save-gone when the slot no longer holds this save', async () => {
    answerWith(410, { error: 'save-gone', message: 'The game in slot 2 has ended' });
    await expect(openSave(ADDRESS)).rejects.toEqual(
      new ApiError(410, 'save-gone', 'The game in slot 2 has ended', null),
    );
  });
});
