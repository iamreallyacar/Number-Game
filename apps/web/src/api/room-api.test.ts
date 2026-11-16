import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-request.js';
import { createRoom, getRoom, joinRoom, leaveRoom, listRooms, startRoom } from './room-api.js';

const ROOM = {
  roomId: 'room 1',
  status: 'waiting',
  hostPlayerId: 'Sam',
  playerIds: ['Sam'],
  disconnectedPlayerIds: [],
  maxPlayers: 4,
};

function answerWith(status: number, body: unknown) {
  const fetchSpy = vi.fn<(path: string, init: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(Response.json(body, { status })),
  );
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}

describe('room routes in the browser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the rooms of the game', async () => {
    const fetchSpy = answerWith(200, { rooms: [ROOM] });
    expect(await listRooms('survivor-game')).toEqual([ROOM]);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('/api/games/survivor-game/rooms');
  });

  it('names the room in its path and sends the player ID in the body', async () => {
    const fetchSpy = answerWith(200, { room: ROOM });
    await getRoom('survivor-game', 'room 1', null);
    await createRoom('survivor-game', 'Sam');
    await joinRoom('survivor-game', 'room 1', 'Alex');
    await startRoom('survivor-game', 'room 1', 'Sam');
    const calls = fetchSpy.mock.calls.map(([path, init]) => [path, init.method, init.body]);
    expect(calls).toEqual([
      ['/api/games/survivor-game/rooms/room%201', 'GET', undefined],
      ['/api/games/survivor-game/rooms', 'POST', '{"playerId":"Sam"}'],
      ['/api/games/survivor-game/rooms/room%201/join', 'POST', '{"playerId":"Alex"}'],
      ['/api/games/survivor-game/rooms/room%201/start', 'POST', '{"playerId":"Sam"}'],
    ]);
  });

  it('says which player is asking when it reads a room', async () => {
    const fetchSpy = answerWith(200, { room: ROOM });
    await getRoom('survivor-game', 'room 1', 'Sam Lee');
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(
      '/api/games/survivor-game/rooms/room%201?playerId=Sam%20Lee',
    );
  });

  it('answers whether leaving closed the room', async () => {
    answerWith(200, { closed: true });
    expect(await leaveRoom('survivor-game', 'room 1', 'Sam')).toBe(true);
  });

  it('passes on a refusal with the message the server wrote', async () => {
    answerWith(409, { error: 'too-many-runs', message: '4 rooms are open' });
    await expect(createRoom('survivor-game', 'Sam')).rejects.toEqual(
      new ApiError(409, 'too-many-runs', '4 rooms are open', null),
    );
  });

  it('fails loudly on an answer of the wrong shape', async () => {
    answerWith(200, { room: { roomId: 'x' } });
    await expect(getRoom('survivor-game', 'x', null)).rejects.toThrow('wrong shape');
  });
});
