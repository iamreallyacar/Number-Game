import { describe, expect, it } from 'vitest';
import { fakeRoomTestGame } from '../fake-room-test-game.js';
import { GameRegistry } from '../games/game-registry.js';
import { COUNTER_URL, createPlayer, FAKE_ROOMS_URL, startTestServer } from '../test-support.js';

async function startServerWithPlayers(maxRoomGameRuns?: number) {
  const server = await startTestServer(maxRoomGameRuns === undefined ? {} : { maxRoomGameRuns });
  for (const playerId of ['Sam', 'Ana', 'Lee']) {
    await createPlayer(server.app, playerId);
  }
  return server;
}

type TestApp = Awaited<ReturnType<typeof startServerWithPlayers>>['app'];

async function post(app: TestApp, url: string, playerId: string) {
  return app.inject({ method: 'POST', url, body: { playerId } });
}

async function createRoom(app: TestApp, playerId: string): Promise<string> {
  const response = await post(app, FAKE_ROOMS_URL, playerId);
  expect(response.statusCode).toBe(201);
  return response.json<{ room: { roomId: string } }>().room.roomId;
}

describe('room routes', () => {
  it('refuses to start a room with fewer players than the game needs', async () => {
    const games = new GameRegistry();
    games.register({ ...fakeRoomTestGame, id: 'fake-pair', minPlayers: 2 });
    const { app } = await startTestServer({ games });
    await createPlayer(app, 'Sam');
    const roomsUrl = '/api/games/fake-pair/rooms';
    const roomId = (await post(app, roomsUrl, 'Sam')).json<{ room: { roomId: string } }>().room
      .roomId;
    const response = await post(app, `${roomsUrl}/${roomId}/start`, 'Sam');
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'not-enough-players' });
    const room = await app.inject({ method: 'GET', url: `${roomsUrl}/${roomId}` });
    expect(room.json()).toMatchObject({ room: { status: 'waiting' } });
  });

  it('creates a room with the caller as host', async () => {
    const { app } = await startServerWithPlayers();
    const response = await post(app, FAKE_ROOMS_URL, 'sam');
    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      room: {
        roomId: expect.stringMatching(/^[0-9a-f-]{36}$/) as string,
        status: 'waiting',
        hostPlayerId: 'Sam',
        playerIds: ['Sam'],
        disconnectedPlayerIds: [],
        maxPlayers: 2,
      },
    });
  });

  it('refuses an unknown player ID', async () => {
    const { app } = await startServerWithPlayers();
    const response = await post(app, FAKE_ROOMS_URL, 'Nobody');
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'unknown-player' });
  });

  it('refuses a body that is not a player ID', async () => {
    const { app } = await startServerWithPlayers();
    const response = await app.inject({ method: 'POST', url: FAKE_ROOMS_URL, body: {} });
    expect(response.statusCode).toBe(400);
  });

  it('lists waiting rooms and reads one room', async () => {
    const { app } = await startServerWithPlayers();
    const roomId = await createRoom(app, 'Sam');
    const list = await app.inject({ method: 'GET', url: FAKE_ROOMS_URL });
    expect(list.json<{ rooms: { roomId: string }[] }>().rooms.map((room) => room.roomId)).toEqual([
      roomId,
    ]);
    const one = await app.inject({ method: 'GET', url: `${FAKE_ROOMS_URL}/${roomId}` });
    expect(one.json()).toMatchObject({ room: { roomId, playerIds: ['Sam'] } });
  });

  it('answers 404 room-not-found for a room that does not exist', async () => {
    const { app } = await startServerWithPlayers();
    const response = await app.inject({ method: 'GET', url: `${FAKE_ROOMS_URL}/nope` });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'room-not-found' });
  });

  it('lets a second player join, and refuses a third and a repeat', async () => {
    const { app } = await startServerWithPlayers();
    const roomId = await createRoom(app, 'Sam');
    const joinUrl = `${FAKE_ROOMS_URL}/${roomId}/join`;
    const repeat = await post(app, joinUrl, 'Sam');
    expect(repeat.json()).toMatchObject({ error: 'player-in-room' });
    const joined = await post(app, joinUrl, 'Ana');
    expect(joined.statusCode).toBe(200);
    expect(joined.json()).toMatchObject({ room: { playerIds: ['Sam', 'Ana'] } });
    const full = await post(app, joinUrl, 'Lee');
    expect(full.statusCode).toBe(409);
    expect(full.json()).toMatchObject({ error: 'room-full' });
  });

  it('refuses creating or joining while in another room', async () => {
    const { app } = await startServerWithPlayers();
    await createRoom(app, 'Sam');
    const otherRoomId = await createRoom(app, 'Ana');
    const again = await post(app, FAKE_ROOMS_URL, 'Sam');
    expect(again.statusCode).toBe(409);
    expect(again.json()).toMatchObject({ error: 'player-in-room' });
    const join = await post(app, `${FAKE_ROOMS_URL}/${otherRoomId}/join`, 'Sam');
    expect(join.json()).toMatchObject({ error: 'player-in-room' });
  });

  it('refuses a room beyond MAX_ROOM_GAME_RUNS with too-many-runs', async () => {
    const { app } = await startServerWithPlayers(1);
    await createRoom(app, 'Sam');
    const response = await post(app, FAKE_ROOMS_URL, 'Ana');
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'too-many-runs' });
  });

  it('hands the room to the next player when the host leaves, then closes the empty room', async () => {
    const { app } = await startServerWithPlayers();
    const roomId = await createRoom(app, 'Sam');
    await post(app, `${FAKE_ROOMS_URL}/${roomId}/join`, 'Ana');
    const first = await post(app, `${FAKE_ROOMS_URL}/${roomId}/leave`, 'Sam');
    expect(first.json()).toEqual({ closed: false });
    const room = await app.inject({ method: 'GET', url: `${FAKE_ROOMS_URL}/${roomId}` });
    expect(room.json()).toMatchObject({ room: { hostPlayerId: 'Ana', playerIds: ['Ana'] } });
    const second = await post(app, `${FAKE_ROOMS_URL}/${roomId}/leave`, 'Ana');
    expect(second.json()).toEqual({ closed: true });
    const gone = await app.inject({ method: 'GET', url: `${FAKE_ROOMS_URL}/${roomId}` });
    expect(gone.statusCode).toBe(404);
  });

  it('refuses leaving a room the player is not in', async () => {
    const { app } = await startServerWithPlayers();
    const roomId = await createRoom(app, 'Sam');
    const response = await post(app, `${FAKE_ROOMS_URL}/${roomId}/leave`, 'Ana');
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'not-in-room' });
  });

  it('lets only the host start, and then refuses joining, leaving, and starting again', async () => {
    const { app } = await startServerWithPlayers();
    const roomId = await createRoom(app, 'Sam');
    await post(app, `${FAKE_ROOMS_URL}/${roomId}/join`, 'Ana');
    const notHost = await post(app, `${FAKE_ROOMS_URL}/${roomId}/start`, 'Ana');
    expect(notHost.statusCode).toBe(403);
    expect(notHost.json()).toMatchObject({ error: 'not-host' });

    const started = await post(app, `${FAKE_ROOMS_URL}/${roomId}/start`, 'Sam');
    expect(started.statusCode).toBe(200);
    expect(started.json()).toMatchObject({
      room: { status: 'running', disconnectedPlayerIds: ['Sam', 'Ana'] },
    });

    const joinAgain = await post(app, `${FAKE_ROOMS_URL}/${roomId}/join`, 'Lee');
    expect(joinAgain.json()).toMatchObject({ error: 'room-started' });
    const leave = await post(app, `${FAKE_ROOMS_URL}/${roomId}/leave`, 'Sam');
    expect(leave.json()).toMatchObject({ error: 'room-started' });
    const startAgain = await post(app, `${FAKE_ROOMS_URL}/${roomId}/start`, 'Sam');
    expect(startAgain.json()).toMatchObject({ error: 'room-started' });
  });

  it('lists a running room only while a player is disconnected', async () => {
    const { app } = await startServerWithPlayers();
    const roomId = await createRoom(app, 'Sam');
    await post(app, `${FAKE_ROOMS_URL}/${roomId}/start`, 'Sam');
    const list = await app.inject({ method: 'GET', url: FAKE_ROOMS_URL });
    expect(list.json()).toMatchObject({ rooms: [{ roomId, status: 'running' }] });
  });

  it('ends a run nobody connected to after the empty run time and frees its room', async () => {
    const { app, scheduler } = await startServerWithPlayers();
    const roomId = await createRoom(app, 'Sam');
    await post(app, `${FAKE_ROOMS_URL}/${roomId}/start`, 'Sam');
    scheduler.advance(2000);
    const gone = await app.inject({ method: 'GET', url: `${FAKE_ROOMS_URL}/${roomId}` });
    expect(gone.statusCode).toBe(404);
    const scores = await app.inject({ method: 'GET', url: '/api/games/fake-room/high-scores' });
    expect(scores.json()).toMatchObject({ highScores: [{ playerIds: ['Sam'], category: '1' }] });
  });

  it('stops every loop when the app closes', async () => {
    const { app, scheduler } = await startServerWithPlayers();
    const roomId = await createRoom(app, 'Sam');
    const timersWithoutLoop = scheduler.pendingTimerCount;
    await post(app, `${FAKE_ROOMS_URL}/${roomId}/start`, 'Sam');
    expect(scheduler.pendingTimerCount).toBe(timersWithoutLoop + 1);
    await app.close();
    expect(scheduler.pendingTimerCount).toBe(0);
  });

  it('refuses room routes for a saved game and slot routes for a room game', async () => {
    const { app } = await startServerWithPlayers();
    const rooms = await app.inject({ method: 'GET', url: `${COUNTER_URL}/rooms` });
    expect(rooms.statusCode).toBe(400);
    expect(rooms.json()).toMatchObject({ error: 'wrong-game-kind' });
    const slots = await app.inject({ method: 'GET', url: '/api/games/fake-room/slots' });
    expect(slots.statusCode).toBe(400);
    expect(slots.json()).toMatchObject({ error: 'wrong-game-kind' });
    const unknown = await app.inject({ method: 'GET', url: '/api/games/chess/rooms' });
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json()).toMatchObject({ error: 'unknown-game' });
  });

  describe('waiting rooms whose players stop being seen', () => {
    const POLL_INTERVAL_MS = 1000;

    async function pollRoom(app: TestApp, roomId: string, playerId: string) {
      return app.inject({
        method: 'GET',
        url: `${FAKE_ROOMS_URL}/${roomId}?playerId=${playerId}`,
      });
    }

    async function listedRoomIds(app: TestApp): Promise<string[]> {
      const list = await app.inject({ method: 'GET', url: FAKE_ROOMS_URL });
      return list.json<{ rooms: { roomId: string }[] }>().rooms.map((room) => room.roomId);
    }

    it('removes a room whose only player stopped polling, and frees the player ID', async () => {
      const { app, scheduler } = await startServerWithPlayers();
      const roomId = await createRoom(app, 'Sam');
      scheduler.advance(20_000);
      expect(await listedRoomIds(app)).toEqual([roomId]);
      scheduler.advance(20_000);
      expect(await listedRoomIds(app)).toEqual([]);
      expect(
        (await app.inject({ method: 'GET', url: `${FAKE_ROOMS_URL}/${roomId}` })).statusCode,
      ).toBe(404);
      expect((await post(app, FAKE_ROOMS_URL, 'Sam')).statusCode).toBe(201);
    });

    it('keeps a room whose player keeps polling with their player ID', async () => {
      const { app, scheduler } = await startServerWithPlayers();
      const roomId = await createRoom(app, 'Sam');
      for (let second = 0; second < 90; second += 1) {
        scheduler.advance(POLL_INTERVAL_MS);
        expect((await pollRoom(app, roomId, 'sam')).statusCode).toBe(200);
      }
      expect(await listedRoomIds(app)).toEqual([roomId]);
    });

    it('does not count the room list or a read without a player as being seen', async () => {
      const { app, scheduler } = await startServerWithPlayers();
      const roomId = await createRoom(app, 'Sam');
      for (let second = 0; second < 40; second += 1) {
        scheduler.advance(POLL_INTERVAL_MS);
        await listedRoomIds(app);
        await app.inject({ method: 'GET', url: `${FAKE_ROOMS_URL}/${roomId}` });
      }
      expect(await listedRoomIds(app)).toEqual([]);
    });

    it('hands the host to the player who is still polling', async () => {
      const { app, scheduler } = await startServerWithPlayers();
      const roomId = await createRoom(app, 'Sam');
      await post(app, `${FAKE_ROOMS_URL}/${roomId}/join`, 'Ana');
      for (let second = 0; second < 40; second += 1) {
        scheduler.advance(POLL_INTERVAL_MS);
        await pollRoom(app, roomId, 'Ana');
      }
      const room = (await pollRoom(app, roomId, 'Ana')).json<{
        room: { hostPlayerId: string; playerIds: string[] };
      }>().room;
      expect(room).toMatchObject({ hostPlayerId: 'Ana', playerIds: ['Ana'] });
      const refused = await post(app, `${FAKE_ROOMS_URL}/${roomId}/start`, 'Sam');
      expect(refused.statusCode).toBe(403);
    });

    it('refuses a read that names an unknown player', async () => {
      const { app } = await startServerWithPlayers();
      const roomId = await createRoom(app, 'Sam');
      const response = await pollRoom(app, roomId, 'Nobody');
      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ error: 'unknown-player' });
    });

    it('stops the expiry timer when the app closes', async () => {
      const { app, scheduler } = await startServerWithPlayers();
      await app.close();
      expect(scheduler.pendingTimerCount).toBe(0);
    });
  });
});
