import { describe, expect, it } from 'vitest';
import { fakeRoomTestGame } from '../fake-room-test-game.js';
import { HttpError } from '../http-error.js';
import { hostOf, RoomStore } from './room-store.js';

function expectHttpError(work: () => unknown, statusCode: number, errorCode: string): void {
  try {
    work();
  } catch (error) {
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ statusCode, errorCode });
    return;
  }
  throw new Error('Expected an HttpError');
}

describe('RoomStore', () => {
  it('makes the creator the host and the only player of a waiting room', () => {
    const rooms = new RoomStore(4, () => 0);
    const room = rooms.create(fakeRoomTestGame, 'Sam');
    expect(room).toMatchObject({ status: 'waiting', playerIds: ['Sam'] });
    expect(hostOf(room)).toBe('Sam');
    expect(rooms.find(fakeRoomTestGame.id, room.roomId)).toBe(room);
  });

  it('does not find a room under another game id', () => {
    const rooms = new RoomStore(4, () => 0);
    const room = rooms.create(fakeRoomTestGame, 'Sam');
    expect(rooms.find('other-game', room.roomId)).toBeUndefined();
    expectHttpError(
      () => {
        rooms.require('other-game', room.roomId);
      },
      404,
      'room-not-found',
    );
  });

  it('keeps a player in at most one room', () => {
    const rooms = new RoomStore(4, () => 0);
    const room = rooms.create(fakeRoomTestGame, 'Sam');
    expectHttpError(
      () => {
        rooms.create(fakeRoomTestGame, 'Sam');
      },
      409,
      'player-in-room',
    );
    expectHttpError(
      () => {
        rooms.join(fakeRoomTestGame, room, 'Sam');
      },
      409,
      'player-in-room',
    );
    const other = rooms.create(fakeRoomTestGame, 'Ana');
    expectHttpError(
      () => {
        rooms.join(fakeRoomTestGame, other, 'Sam');
      },
      409,
      'player-in-room',
    );
  });

  it('refuses a room beyond the limit, counting waiting rooms', () => {
    const rooms = new RoomStore(2, () => 0);
    rooms.create(fakeRoomTestGame, 'Sam');
    rooms.create(fakeRoomTestGame, 'Ana');
    expectHttpError(
      () => {
        rooms.create(fakeRoomTestGame, 'Lee');
      },
      409,
      'too-many-runs',
    );
    expect(() => rooms.create(fakeRoomTestGame, 'Lee')).toThrow('2 of 2 rooms are open');
  });

  it('refuses a join to a full room and to a started room', () => {
    const rooms = new RoomStore(4, () => 0);
    const room = rooms.create(fakeRoomTestGame, 'Sam');
    rooms.join(fakeRoomTestGame, room, 'Ana');
    expectHttpError(
      () => {
        rooms.join(fakeRoomTestGame, room, 'Lee');
      },
      409,
      'room-full',
    );
    room.status = 'running';
    expectHttpError(
      () => {
        rooms.join(fakeRoomTestGame, room, 'Lee');
      },
      409,
      'room-started',
    );
  });

  it('hands the room to the next player when the host leaves, and deletes an empty room', () => {
    const rooms = new RoomStore(4, () => 0);
    const room = rooms.create(fakeRoomTestGame, 'Sam');
    rooms.join(fakeRoomTestGame, room, 'Ana');
    expect(rooms.leave(room, 'Sam')).toBe(false);
    expect(hostOf(room)).toBe('Ana');
    expect(rooms.leave(room, 'Ana')).toBe(true);
    expect(rooms.find(fakeRoomTestGame.id, room.roomId)).toBeUndefined();
    expect(rooms.create(fakeRoomTestGame, 'Sam').playerIds).toEqual(['Sam']);
  });

  it('refuses to leave a room the player is not in, and to leave a started room', () => {
    const rooms = new RoomStore(4, () => 0);
    const room = rooms.create(fakeRoomTestGame, 'Sam');
    expectHttpError(
      () => {
        rooms.leave(room, 'Ana');
      },
      404,
      'not-in-room',
    );
    room.status = 'running';
    expectHttpError(
      () => {
        rooms.leave(room, 'Sam');
      },
      409,
      'room-started',
    );
  });

  it('only lets the host start a waiting room', () => {
    const rooms = new RoomStore(4, () => 0);
    const room = rooms.create(fakeRoomTestGame, 'Sam');
    rooms.join(fakeRoomTestGame, room, 'Ana');
    expectHttpError(
      () => {
        rooms.requireStartable(fakeRoomTestGame, room, 'Ana');
      },
      403,
      'not-host',
    );
    rooms.requireStartable(fakeRoomTestGame, room, 'Sam');
    room.status = 'running';
    expectHttpError(
      () => {
        rooms.requireStartable(fakeRoomTestGame, room, 'Sam');
      },
      409,
      'room-started',
    );
  });

  it('frees the room and the player when a room is deleted', () => {
    const rooms = new RoomStore(1, () => 0);
    const room = rooms.create(fakeRoomTestGame, 'Sam');
    rooms.delete(room);
    expect(rooms.list(fakeRoomTestGame.id)).toEqual([]);
    expect(rooms.create(fakeRoomTestGame, 'Sam').playerIds).toEqual(['Sam']);
  });

  describe('removing members who were not seen', () => {
    const EXPIRY = 30_000;

    function storeWithClock() {
      const clock = { now: 0 };
      return { clock, rooms: new RoomStore(4, () => clock.now) };
    }

    it('keeps a member who is seen again, and removes one who is not', () => {
      const { clock, rooms } = storeWithClock();
      const room = rooms.create(fakeRoomTestGame, 'Sam');
      rooms.join(fakeRoomTestGame, room, 'Ana');
      clock.now = 20_000;
      rooms.markSeen(room, 'Ana');
      clock.now = EXPIRY + 1;
      rooms.removeUnseenMembers(EXPIRY);
      expect(room.playerIds).toEqual(['Ana']);
    });

    it('keeps a member who was unseen for exactly the expiry time', () => {
      const { clock, rooms } = storeWithClock();
      const room = rooms.create(fakeRoomTestGame, 'Sam');
      clock.now = EXPIRY;
      rooms.removeUnseenMembers(EXPIRY);
      expect(room.playerIds).toEqual(['Sam']);
    });

    it('hands the room to the next player when the host expires', () => {
      const { clock, rooms } = storeWithClock();
      const room = rooms.create(fakeRoomTestGame, 'Sam');
      clock.now = 10_000;
      rooms.join(fakeRoomTestGame, room, 'Ana');
      clock.now = EXPIRY + 1;
      rooms.removeUnseenMembers(EXPIRY);
      expect(room.playerIds).toEqual(['Ana']);
      expect(hostOf(room)).toBe('Ana');
    });

    it('closes a room whose members all expired, and frees their player IDs', () => {
      const { clock, rooms } = storeWithClock();
      const room = rooms.create(fakeRoomTestGame, 'Sam');
      rooms.join(fakeRoomTestGame, room, 'Ana');
      clock.now = EXPIRY + 1;
      rooms.removeUnseenMembers(EXPIRY);
      expect(rooms.find(fakeRoomTestGame.id, room.roomId)).toBeUndefined();
      expect(rooms.list(fakeRoomTestGame.id)).toEqual([]);
      expect(rooms.create(fakeRoomTestGame, 'Sam').playerIds).toEqual(['Sam']);
    });

    it('does not note a player who is not in the room, and leaves running rooms alone', () => {
      const { clock, rooms } = storeWithClock();
      const room = rooms.create(fakeRoomTestGame, 'Sam');
      rooms.markSeen(room, 'Stranger');
      expect(room.lastSeenAt.has('Stranger')).toBe(false);
      room.status = 'running';
      clock.now = EXPIRY * 10;
      rooms.removeUnseenMembers(EXPIRY);
      expect(room.playerIds).toEqual(['Sam']);
    });
  });
});
