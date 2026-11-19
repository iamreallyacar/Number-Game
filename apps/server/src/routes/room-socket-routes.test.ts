import { WebSocket as ClientSocket, type WebSocket as ServerSideSocket } from 'ws';
import { describe, expect, it } from 'vitest';
import { FAKE_ROOM_PLAYER_PARAMETER } from '../fake-room-test-game.js';
import { SOCKET_MAX_FRAMES_PER_WINDOW, SOCKET_PING_INTERVAL_MS } from '../rooms/room-timing.js';
import { createPlayer, FAKE_ROOMS_URL, startTestServer } from '../test-support.js';

/** `idleMilliseconds` passes before the run starts, to move the watchdog off the run's own steps. */
async function startRunningRoom(idleMilliseconds = 0) {
  const server = await startTestServer();
  server.scheduler.advance(idleMilliseconds);
  for (const playerId of ['Sam', 'Ana']) {
    await createPlayer(server.app, playerId);
  }
  const created = await server.app.inject({
    method: 'POST',
    url: FAKE_ROOMS_URL,
    body: { playerId: 'Sam' },
  });
  const roomId = created.json<{ room: { roomId: string } }>().room.roomId;
  await server.app.inject({
    method: 'POST',
    url: `${FAKE_ROOMS_URL}/${roomId}/join`,
    body: { playerId: 'Ana' },
  });
  await server.app.inject({
    method: 'POST',
    url: `${FAKE_ROOMS_URL}/${roomId}/start`,
    body: { playerId: 'Sam' },
  });
  await server.app.ready();
  return { ...server, roomId };
}

type Started = Awaited<ReturnType<typeof startRunningRoom>>;

function socketPath(roomId: string, playerId: string): string {
  return `${FAKE_ROOMS_URL}/${roomId}/socket?${FAKE_ROOM_PLAYER_PARAMETER}=${playerId}`;
}

/** Opens a socket and collects what the server sends and how it closes. */
async function openSocket(started: Started, path: string) {
  const messages: Record<string, unknown>[] = [];
  const socket: ServerSideSocket = await started.app.injectWS(
    path,
    {},
    {
      onInit: (preparedSocket: ServerSideSocket) => {
        // A socket made by injectWS does not answer pings by itself, as a real browser does.
        preparedSocket.on('ping', () => {
          preparedSocket.pong();
        });
        preparedSocket.on('message', (data: Buffer) => {
          messages.push(JSON.parse(data.toString('utf8')) as Record<string, unknown>);
        });
      },
    },
  );
  const closed = new Promise<{ code: number; reason: string }>((resolve) => {
    socket.on('close', (code: number, reason: Buffer) => {
      resolve({ code, reason: reason.toString('utf8') });
    });
  });
  return { socket, messages, closed };
}

/** Moves the clock in small steps with real time between them, so pongs reach the ping checks. */
async function advanceWithPongs(started: Started, milliseconds: number): Promise<void> {
  const chunkMilliseconds = 1000;
  for (let moved = 0; moved < milliseconds; moved += chunkMilliseconds) {
    started.scheduler.advance(Math.min(chunkMilliseconds, milliseconds - moved));
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function waitFor(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Timed out waiting for the socket');
}

async function waitForRoom(
  started: Started,
  condition: (room: { disconnectedPlayerIds: string[] }) => boolean,
): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const response = await started.app.inject({
      method: 'GET',
      url: `${FAKE_ROOMS_URL}/${started.roomId}`,
    });
    if (condition(response.json<{ room: { disconnectedPlayerIds: string[] } }>().room)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Timed out waiting for the room');
}

describe('room WebSocket route', () => {
  it('hides a running room from the list while every player is connected', async () => {
    const started = await startRunningRoom();
    const listedRoomIds = async () => {
      const list = await started.app.inject({ method: 'GET', url: FAKE_ROOMS_URL });
      return list.json<{ rooms: { roomId: string }[] }>().rooms.map((room) => room.roomId);
    };
    expect(await listedRoomIds()).toEqual([started.roomId]);

    const sam = await openSocket(started, socketPath(started.roomId, 'Sam'));
    const ana = await openSocket(started, socketPath(started.roomId, 'Ana'));
    await waitFor(() => sam.messages.length === 1 && ana.messages.length === 1);
    expect(await listedRoomIds()).toEqual([]);

    sam.socket.terminate();
    await sam.closed;
    expect(await listedRoomIds()).toEqual([started.roomId]);
    ana.socket.terminate();
    await started.app.close();
  });

  it('sends the state right after connecting and then reports as the loop steps', async () => {
    const started = await startRunningRoom();
    const { socket, messages } = await openSocket(started, socketPath(started.roomId, 'Sam'));
    await waitFor(() => messages.length === 1);
    expect(messages[0]).toMatchObject({ type: 'state', state: { stepCount: 0 } });

    started.scheduler.advance(200);
    await waitFor(() => messages.length === 2);
    expect(messages[1]).toMatchObject({ type: 'state', state: { stepCount: 2 } });
    socket.terminate();
    await started.app.close();
  });

  it('applies a message from the browser, and answers a refused one', async () => {
    const started = await startRunningRoom();
    const { socket, messages } = await openSocket(started, socketPath(started.roomId, 'Sam'));
    await waitFor(() => messages.length === 1);
    socket.send('{"type":"hold","amount":4}');
    socket.send('{"type":"refuse"}');
    await waitFor(() => messages.length === 2);
    expect(messages[1]).toMatchObject({ type: 'message-refused', reason: 'not-allowed' });

    started.scheduler.advance(200);
    await waitFor(() => messages.length === 3);
    expect(messages[2]).toMatchObject({
      type: 'state',
      state: { score: 8, heldInLastStep: { Sam: 4 } },
    });
    socket.terminate();
    await started.app.close();
  });

  it.each([
    { name: 'a room that does not exist', path: () => socketPath('nope', 'Sam'), code: 4404 },
    {
      name: 'a player who is not in the room',
      path: (roomId: string) => socketPath(roomId, 'Lee'),
      code: 4404,
    },
    {
      name: 'a missing player ID',
      path: (roomId: string) => `${FAKE_ROOMS_URL}/${roomId}/socket`,
      code: 4404,
    },
    {
      name: 'a game that is not a room game',
      path: (roomId: string) => `/api/games/counter/rooms/${roomId}/socket?playerId=Sam`,
      code: 4404,
    },
  ])('closes the connection with $code for $name', async ({ path, code }) => {
    const started = await startRunningRoom();
    const { closed } = await openSocket(started, path(started.roomId));
    expect((await closed).code).toBe(code);
    await started.app.close();
  });

  it('closes the connection with 4400 for a room that is still waiting', async () => {
    const started = await startTestServer();
    await createPlayer(started.app, 'Sam');
    const created = await started.app.inject({
      method: 'POST',
      url: FAKE_ROOMS_URL,
      body: { playerId: 'Sam' },
    });
    const roomId = created.json<{ room: { roomId: string } }>().room.roomId;
    await started.app.ready();
    const { closed } = await openSocket({ ...started, roomId }, socketPath(roomId, 'Sam'));
    expect((await closed).code).toBe(4400);
    await started.app.close();
  });

  it('refuses a second connection of the same player with 4409 and keeps the first', async () => {
    const started = await startRunningRoom();
    const first = await openSocket(started, socketPath(started.roomId, 'Sam'));
    await waitFor(() => first.messages.length === 1);
    const second = await openSocket(started, socketPath(started.roomId, 'Sam'));
    expect((await second.closed).code).toBe(4409);
    started.scheduler.advance(200);
    await waitFor(() => first.messages.length === 2);
    first.socket.terminate();
    await started.app.close();
  });

  it('marks the player as dropped when the connection closes, and lets them rejoin', async () => {
    const started = await startRunningRoom();
    const address = await started.app.listen({ host: '127.0.0.1', port: 0 });
    const url = `${address.replace('http', 'ws')}${socketPath(started.roomId, 'Sam')}`;

    const first = new WebSocket(url);
    await new Promise((resolve) => {
      first.addEventListener('message', resolve, { once: true });
    });
    first.close();
    await waitForRoom(started, (room) => room.disconnectedPlayerIds.length === 2);

    const rejoined = new WebSocket(url);
    const rejoinMessage = await new Promise<{ data: unknown }>((resolve) => {
      rejoined.addEventListener('message', resolve, { once: true });
    });
    expect(JSON.parse(String(rejoinMessage.data))).toMatchObject({ type: 'state' });
    rejoined.close();
    await started.app.close();
  });

  it('closes the sockets with a normal close when the run ends', async () => {
    const started = await startRunningRoom();
    const { messages, closed } = await openSocket(started, socketPath(started.roomId, 'Sam'));
    await waitFor(() => messages.length === 1);
    await advanceWithPongs(started, 100 * 100);
    expect((await closed).code).toBe(1000);
    expect(messages.at(-1)).toMatchObject({ type: 'run-ended', reason: 'finished' });
    const room = await started.app.inject({
      method: 'GET',
      url: `${FAKE_ROOMS_URL}/${started.roomId}`,
    });
    expect(room.statusCode).toBe(404);
    await started.app.close();
  });

  it('closes the sockets and stops the loops when the app closes', async () => {
    const started = await startRunningRoom();
    const { closed } = await openSocket(started, socketPath(started.roomId, 'Sam'));
    await started.app.close();
    expect((await closed).code).toBe(1001);
    expect(started.scheduler.pendingTimerCount).toBe(0);
  });

  it('closes a socket that sends too many frames with 1008 and marks the player as dropped', async () => {
    const started = await startRunningRoom();
    const { socket, messages, closed } = await openSocket(
      started,
      socketPath(started.roomId, 'Sam'),
    );
    await waitFor(() => messages.length === 1);
    for (let frame = 0; frame <= SOCKET_MAX_FRAMES_PER_WINDOW; frame += 1) {
      socket.send('{"type":"hold","amount":1}');
    }
    expect((await closed).code).toBe(1008);
    await waitForRoom(started, (room) => room.disconnectedPlayerIds.includes('Sam'));
    await started.app.close();
  });

  it('keeps a socket that stays within the frame limit', async () => {
    const started = await startRunningRoom();
    const { socket, messages } = await openSocket(started, socketPath(started.roomId, 'Sam'));
    await waitFor(() => messages.length === 1);
    for (let frame = 0; frame < SOCKET_MAX_FRAMES_PER_WINDOW; frame += 1) {
      socket.send('{"type":"hold","amount":1}');
    }
    started.scheduler.advance(200);
    await waitFor(() => messages.length === 2);
    socket.terminate();
    await started.app.close();
  });

  it('terminates a socket that stopped answering pings, so the player can rejoin', async () => {
    const started = await startRunningRoom(SOCKET_PING_INTERVAL_MS / 2);
    const address = await started.app.listen({ host: '127.0.0.1', port: 0 });
    const url = `${address.replace('http', 'ws')}${socketPath(started.roomId, 'Sam')}`;
    const stalled = new ClientSocket(url, { autoPong: false });
    await new Promise((resolve) => {
      stalled.once('message', resolve);
    });
    const stalledClosed = new Promise<number>((resolve) => {
      stalled.once('close', resolve);
    });

    started.scheduler.advance(SOCKET_PING_INTERVAL_MS / 2);
    started.scheduler.advance(SOCKET_PING_INTERVAL_MS);
    expect(await stalledClosed).toBe(1006);
    await waitForRoom(started, (room) => room.disconnectedPlayerIds.includes('Sam'));

    const rejoined = new ClientSocket(url);
    const rejoinMessage = await new Promise<Buffer>((resolve) => {
      rejoined.once('message', (data: Buffer) => {
        resolve(data);
      });
    });
    expect(JSON.parse(rejoinMessage.toString('utf8'))).toMatchObject({ type: 'state' });
    rejoined.close();
    await started.app.close();
  });
});
