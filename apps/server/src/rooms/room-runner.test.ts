import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HighScoresStore } from '../database/high-scores-store.js';
import { openInMemoryDatabase } from '../database/open-database.js';
import { PlayersStore } from '../database/players-store.js';
import {
  FAKE_ROOM_EMPTY_RUN_SECONDS,
  FAKE_ROOM_FINAL_STEP,
  FAKE_ROOM_STEP_RATE,
  FAKE_ROOM_STEPS_PER_REPORT,
  fakeRoomTestGame,
} from '../fake-room-test-game.js';
import { ManualScheduler } from '../test-support.js';
import { RoomRunner } from './room-runner.js';
import { CLOSE_CODES, type RoomSocket } from './room-socket.js';
import { RoomStore, type Room } from './room-store.js';

const STEP_MILLISECONDS = 1000 / FAKE_ROOM_STEP_RATE;
const EMPTY_RUN_STEPS = FAKE_ROOM_EMPTY_RUN_SECONDS * FAKE_ROOM_STEP_RATE;

class FakeSocket implements RoomSocket {
  readonly sent: unknown[] = [];
  closedWith: { code: number; reason: string } | null = null;

  send(text: string): void {
    this.sent.push(JSON.parse(text));
  }

  close(code: number, reason: string): void {
    this.closedWith = { code, reason };
  }

  messagesOfType(type: string): Record<string, unknown>[] {
    return this.sent.filter(
      (message): message is Record<string, unknown> =>
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        message.type === type,
    );
  }
}

interface Setup {
  readonly rooms: RoomStore;
  readonly highScores: HighScoresStore;
  readonly scheduler: ManualScheduler;
  readonly runner: RoomRunner;
  readonly logger: { error: ReturnType<typeof vi.fn> };
}

function setUp(): Setup {
  const database = openInMemoryDatabase();
  const players = new PlayersStore(database);
  for (const playerId of ['Sam', 'Ana', 'Lee', 'Kim']) {
    players.createPlayer(playerId, '2026-01-01');
  }
  const rooms = new RoomStore(4, () => 0);
  const highScores = new HighScoresStore(database);
  const scheduler = new ManualScheduler();
  const logger = { error: vi.fn() };
  const runner = new RoomRunner({ rooms, highScores, scheduler, logger });
  return { rooms, highScores, scheduler, runner, logger };
}

function startRoom(setup: Setup, playerIds: readonly string[]): Room {
  const [host, ...others] = playerIds;
  if (host === undefined) {
    throw new Error('A room needs a host');
  }
  const room = setup.rooms.create(fakeRoomTestGame, host);
  for (const playerId of others) {
    setup.rooms.join(fakeRoomTestGame, room, playerId);
  }
  setup.runner.startRun(fakeRoomTestGame, room, 1);
  return room;
}

function connect(setup: Setup, room: Room, playerId: string): FakeSocket {
  const socket = new FakeSocket();
  const outcome = setup.runner.connect(fakeRoomTestGame.id, room.roomId, playerId, socket);
  expect(outcome).toEqual({ accepted: true });
  return socket;
}

function stepTimes(setup: Setup, steps: number): void {
  setup.scheduler.advance(steps * STEP_MILLISECONDS);
}

function lastState(socket: FakeSocket): Record<string, unknown> {
  const reports = socket.messagesOfType('state');
  const last = reports[reports.length - 1];
  if (last === undefined || typeof last['state'] !== 'object' || last['state'] === null) {
    throw new Error('No state report was received');
  }
  return { ...last['state'] };
}

describe('RoomRunner', () => {
  let setup: Setup;

  beforeEach(() => {
    setup = setUp();
  });

  describe('connecting', () => {
    it('refuses a room that does not exist and a player who is not in the room', () => {
      const room = startRoom(setup, ['Sam']);
      const refusedRoom = setup.runner.connect('fake-room', 'nope', 'Sam', new FakeSocket());
      const refusedPlayer = setup.runner.connect('fake-room', room.roomId, 'Ana', new FakeSocket());
      const refusedGame = setup.runner.connect('other', room.roomId, 'Sam', new FakeSocket());
      for (const outcome of [refusedRoom, refusedPlayer, refusedGame]) {
        expect(outcome).toMatchObject({ accepted: false, closeCode: 4404 });
      }
    });

    it('refuses a room that is still waiting', () => {
      const room = setup.rooms.create(fakeRoomTestGame, 'Sam');
      const outcome = setup.runner.connect('fake-room', room.roomId, 'Sam', new FakeSocket());
      expect(outcome).toMatchObject({ accepted: false, closeCode: 4400 });
    });

    it('never takes over the connection of a player who is still connected', () => {
      const room = startRoom(setup, ['Sam']);
      const first = connect(setup, room, 'Sam');
      const outcome = setup.runner.connect('fake-room', room.roomId, 'Sam', new FakeSocket());
      expect(outcome).toMatchObject({ accepted: false, closeCode: 4409 });
      expect(first.closedWith).toBeNull();
    });

    it('sends the current state right after connecting', () => {
      const room = startRoom(setup, ['Sam']);
      stepTimes(setup, 3);
      const socket = connect(setup, room, 'Sam');
      expect(socket.sent).toHaveLength(1);
      expect(lastState(socket)).toMatchObject({ stepCount: 3 });
    });
  });

  describe('the step loop', () => {
    it('steps at the step rate and reports to connected players every few steps', () => {
      const room = startRoom(setup, ['Sam', 'Ana']);
      const sam = connect(setup, room, 'Sam');
      const ana = connect(setup, room, 'Ana');
      sam.sent.length = 0;
      ana.sent.length = 0;
      stepTimes(setup, 6);
      expect(sam.messagesOfType('state')).toHaveLength(6 / FAKE_ROOM_STEPS_PER_REPORT);
      expect(lastState(sam)).toMatchObject({ stepCount: 6 });
      expect(lastState(ana)).toMatchObject({ stepCount: 6 });
    });

    it('applies a message until the next one and counts it in every step', () => {
      const room = startRoom(setup, ['Sam']);
      const sam = connect(setup, room, 'Sam');
      setup.runner.receiveMessage(room.roomId, 'Sam', sam, '{"type":"hold","amount":3}');
      stepTimes(setup, 4);
      expect(lastState(sam)).toMatchObject({ score: 12, heldInLastStep: { Sam: 3 } });
      setup.runner.receiveMessage(room.roomId, 'Sam', sam, '{"type":"hold","amount":0}');
      stepTimes(setup, 2);
      expect(lastState(sam)).toMatchObject({ score: 12 });
    });

    it('answers a refused or unreadable message to that player only, and goes on', () => {
      const room = startRoom(setup, ['Sam', 'Ana']);
      const sam = connect(setup, room, 'Sam');
      const ana = connect(setup, room, 'Ana');
      setup.runner.receiveMessage(room.roomId, 'Sam', sam, '{"type":"refuse"}');
      setup.runner.receiveMessage(room.roomId, 'Sam', sam, 'not json');
      setup.runner.receiveMessage(room.roomId, 'Sam', sam, '{"type":"unknown"}');
      expect(sam.messagesOfType('message-refused').map((message) => message['reason'])).toEqual([
        'not-allowed',
        'unreadable-message',
        'unreadable-message',
      ]);
      expect(ana.messagesOfType('message-refused')).toEqual([]);
      stepTimes(setup, 2);
      expect(lastState(sam)).toMatchObject({ stepCount: 2 });
      expect(setup.logger.error).not.toHaveBeenCalled();
    });

    it('ignores messages from a socket that is not the connection of the player', () => {
      const room = startRoom(setup, ['Sam']);
      connect(setup, room, 'Sam');
      const stranger = new FakeSocket();
      setup.runner.receiveMessage(room.roomId, 'Sam', stranger, '{"type":"refuse"}');
      expect(stranger.sent).toEqual([]);
    });
  });

  describe('dropping and rejoining', () => {
    it('leaves a dropped player out of the step and clears what they held', () => {
      const room = startRoom(setup, ['Sam', 'Ana']);
      const sam = connect(setup, room, 'Sam');
      const ana = connect(setup, room, 'Ana');
      setup.runner.receiveMessage(room.roomId, 'Sam', sam, '{"type":"hold","amount":5}');
      setup.runner.receiveMessage(room.roomId, 'Ana', ana, '{"type":"hold","amount":1}');
      stepTimes(setup, 2);
      setup.runner.disconnect(room.roomId, 'Sam', sam);
      expect([...room.connections.keys()]).toEqual(['Ana']);
      stepTimes(setup, 2);
      expect(lastState(ana)).toMatchObject({ heldInLastStep: { Ana: 1 } });

      const rejoined = connect(setup, room, 'Sam');
      stepTimes(setup, 2);
      expect(lastState(rejoined)).toMatchObject({ heldInLastStep: { Sam: 0, Ana: 1 } });
    });

    it('keeps the run going while a player is dropped', () => {
      const room = startRoom(setup, ['Sam']);
      const sam = connect(setup, room, 'Sam');
      setup.runner.disconnect(room.roomId, 'Sam', sam);
      stepTimes(setup, EMPTY_RUN_STEPS - 1);
      expect(setup.rooms.find('fake-room', room.roomId)).toBe(room);
    });

    it('ignores a disconnect from a socket that was refused', () => {
      const room = startRoom(setup, ['Sam']);
      const sam = connect(setup, room, 'Sam');
      setup.runner.disconnect(room.roomId, 'Sam', new FakeSocket());
      expect(room.connections.get('Sam')).toBe(sam);
    });
  });

  describe('the empty run time', () => {
    it('ends a run that nobody was connected to for the empty run time', () => {
      const room = startRoom(setup, ['Sam', 'Ana']);
      stepTimes(setup, EMPTY_RUN_STEPS);
      expect(setup.rooms.find('fake-room', room.roomId)).toBeUndefined();
      expect(setup.scheduler.pendingTimerCount).toBe(0);
      const results = setup.highScores.listTopResults('fake-room', null, 10);
      expect(results).toMatchObject([{ playerIds: ['Sam', 'Ana'], score: 0, category: '2' }]);
    });

    it('starts counting again whenever someone connects', () => {
      const room = startRoom(setup, ['Sam']);
      stepTimes(setup, EMPTY_RUN_STEPS - 1);
      const sam = connect(setup, room, 'Sam');
      setup.runner.disconnect(room.roomId, 'Sam', sam);
      stepTimes(setup, EMPTY_RUN_STEPS - 1);
      expect(setup.rooms.find('fake-room', room.roomId)).toBe(room);
      stepTimes(setup, 1);
      expect(setup.rooms.find('fake-room', room.roomId)).toBeUndefined();
    });
  });

  describe('the end of a run', () => {
    it('stores the result for every player, tells the sockets, closes them and deletes the room', () => {
      const room = startRoom(setup, ['Sam', 'Ana']);
      const sam = connect(setup, room, 'Sam');
      setup.runner.receiveMessage(room.roomId, 'Sam', sam, '{"type":"hold","amount":2}');
      stepTimes(setup, FAKE_ROOM_FINAL_STEP);

      const [ended] = sam.messagesOfType('run-ended');
      expect(ended).toMatchObject({ reason: 'finished', score: FAKE_ROOM_FINAL_STEP * 2 });
      expect(sam.closedWith).toMatchObject({ code: CLOSE_CODES.normal });
      expect(setup.rooms.find('fake-room', room.roomId)).toBeUndefined();
      expect(setup.scheduler.pendingTimerCount).toBe(0);
      expect(setup.highScores.listTopResults('fake-room', null, 10)).toMatchObject([
        {
          playerIds: ['Sam', 'Ana'],
          score: FAKE_ROOM_FINAL_STEP * 2,
          category: '2',
          detailsJson: `{"steps":${String(FAKE_ROOM_FINAL_STEP)}}`,
          detailsVersion: 1,
        },
      ]);
    });

    it('frees the players to join another room', () => {
      const room = startRoom(setup, ['Sam']);
      connect(setup, room, 'Sam');
      stepTimes(setup, FAKE_ROOM_FINAL_STEP);
      expect(setup.rooms.create(fakeRoomTestGame, 'Sam').playerIds).toEqual(['Sam']);
    });

    it('does not report the closed socket as a dropped player', () => {
      const room = startRoom(setup, ['Sam']);
      const sam = connect(setup, room, 'Sam');
      stepTimes(setup, FAKE_ROOM_FINAL_STEP);
      expect(() => {
        setup.runner.disconnect(room.roomId, 'Sam', sam);
      }).not.toThrow();
    });
  });

  describe('a run that fails', () => {
    it('is logged, ends only that run, and leaves other runs going', () => {
      const broken = startRoom(setup, ['Sam']);
      const healthy = startRoom(setup, ['Ana']);
      const sam = connect(setup, broken, 'Sam');
      const ana = connect(setup, healthy, 'Ana');
      setup.runner.receiveMessage(broken.roomId, 'Sam', sam, '{"type":"boom"}');

      stepTimes(setup, 2);

      expect(setup.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ roomId: broken.roomId }),
        'A run failed and was ended',
      );
      expect(sam.messagesOfType('run-ended')).toMatchObject([{ reason: 'abandoned' }]);
      expect(sam.closedWith).not.toBeNull();
      expect(setup.rooms.find('fake-room', broken.roomId)).toBeUndefined();
      expect(setup.rooms.find('fake-room', healthy.roomId)).toBe(healthy);
      expect(lastState(ana)).toMatchObject({ stepCount: 2 });
      stepTimes(setup, 2);
      expect(lastState(ana)).toMatchObject({ stepCount: 4 });
      expect(setup.highScores.listTopResults('fake-room', null, 10)).toHaveLength(1);
    });

    it('still ends the run when its result cannot be stored', () => {
      const room = startRoom(setup, ['Sam']);
      const sam = connect(setup, room, 'Sam');
      vi.spyOn(setup.highScores, 'insertResult').mockImplementation(() => {
        throw new Error('disk full');
      });
      stepTimes(setup, FAKE_ROOM_FINAL_STEP);
      expect(setup.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ roomId: room.roomId }),
        'The result of a finished run could not be stored',
      );
      expect(sam.messagesOfType('run-ended')).toHaveLength(1);
      expect(setup.rooms.find('fake-room', room.roomId)).toBeUndefined();
    });
  });

  describe('shutting down', () => {
    it('stops every loop and closes every socket', () => {
      const first = startRoom(setup, ['Sam']);
      const second = startRoom(setup, ['Ana']);
      const sam = connect(setup, first, 'Sam');
      const ana = connect(setup, second, 'Ana');
      setup.runner.shutDown();
      expect(sam.closedWith).toMatchObject({ code: CLOSE_CODES.goingAway });
      expect(ana.closedWith).toMatchObject({ code: CLOSE_CODES.goingAway });
      expect(setup.scheduler.pendingTimerCount).toBe(0);
      expect(setup.highScores.listTopResults('fake-room', null, 10)).toEqual([]);
    });
  });
});
