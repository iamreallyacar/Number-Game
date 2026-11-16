import { randomUUID } from 'node:crypto';
import type { RoomStatus } from '@local/game-server-api';
import type { RegisteredRoomGame } from '../games/room-game.js';
import { HttpError } from '../http-error.js';
import type { RoomSocket } from './room-socket.js';

export interface Room {
  readonly roomId: string;
  readonly gameId: string;
  status: RoomStatus;
  /** In the order they joined. The first one is the host (SG-07). */
  readonly playerIds: string[];
  /** When each player of a waiting room was last seen, by the clock of the store. Unused once running. */
  readonly lastSeenAt: Map<string, number>;
  /** The open connection of each connected player of a running room. */
  readonly connections: Map<string, RoomSocket>;
}

export function hostOf(room: Room): string {
  const [host] = room.playerIds;
  if (host === undefined) {
    throw new Error('A room always has a host while it exists');
  }
  return host;
}

/** The rooms of every room game, kept in memory, so a restart of the server loses them. */
export class RoomStore {
  private readonly rooms = new Map<string, Room>();

  /** `now` is a monotonic clock in milliseconds. Tests give one they move by hand. */
  constructor(
    private readonly maxRooms: number,
    private readonly now: () => number,
  ) {}

  list(gameId: string): Room[] {
    return [...this.rooms.values()].filter((room) => room.gameId === gameId);
  }

  find(gameId: string, roomId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    return room?.gameId === gameId ? room : undefined;
  }

  require(gameId: string, roomId: string): Room {
    const room = this.find(gameId, roomId);
    if (room === undefined) {
      throw new HttpError(404, 'room-not-found', `There is no room '${roomId}'`);
    }
    return room;
  }

  /** A player ID is in at most one room at a time, of any room game (SG-05). */
  private findRoomOfPlayer(playerId: string): Room | undefined {
    return [...this.rooms.values()].find((room) => room.playerIds.includes(playerId));
  }

  private requireNotInAnyRoom(playerId: string): void {
    if (this.findRoomOfPlayer(playerId) !== undefined) {
      throw new HttpError(409, 'player-in-room', `${playerId} is already in a room`);
    }
  }

  create(game: RegisteredRoomGame, hostPlayerId: string): Room {
    this.requireNotInAnyRoom(hostPlayerId);
    if (this.rooms.size >= this.maxRooms) {
      throw new HttpError(
        409,
        'too-many-runs',
        `${String(this.rooms.size)} of ${String(this.maxRooms)} rooms are open, so no room can be made now`,
      );
    }
    const room: Room = {
      roomId: randomUUID(),
      gameId: game.id,
      status: 'waiting',
      playerIds: [hostPlayerId],
      lastSeenAt: new Map([[hostPlayerId, this.now()]]),
      connections: new Map(),
    };
    this.rooms.set(room.roomId, room);
    return room;
  }

  join(game: RegisteredRoomGame, room: Room, playerId: string): void {
    if (room.status !== 'waiting') {
      throw new HttpError(409, 'room-started', 'This run has already started');
    }
    this.requireNotInAnyRoom(playerId);
    if (room.playerIds.length >= game.maxPlayers) {
      throw new HttpError(
        409,
        'room-full',
        `This room already has ${String(game.maxPlayers)} players`,
      );
    }
    room.playerIds.push(playerId);
    room.lastSeenAt.set(playerId, this.now());
  }

  /** Notes that a member of a waiting room is still there. Anyone else is ignored. */
  markSeen(room: Room, playerId: string): void {
    if (room.status === 'waiting' && room.playerIds.includes(playerId)) {
      room.lastSeenAt.set(playerId, this.now());
    }
  }

  /** Returns true when the room was deleted because nobody is left. The next player becomes host. */
  leave(room: Room, playerId: string): boolean {
    if (!room.playerIds.includes(playerId)) {
      throw new HttpError(404, 'not-in-room', `${playerId} is not in this room`);
    }
    if (room.status !== 'waiting') {
      throw new HttpError(409, 'room-started', 'A player leaves a run by closing the page');
    }
    room.playerIds.splice(room.playerIds.indexOf(playerId), 1);
    room.lastSeenAt.delete(playerId);
    if (room.playerIds.length === 0) {
      this.rooms.delete(room.roomId);
      return true;
    }
    return false;
  }

  /**
   * Removes the members of waiting rooms who were not seen for `expiryMilliseconds`, the same way
   * as if they left: the host passes to the next player, and an empty room is closed. A page that
   * was closed cannot tell the server, so this is how its player leaves.
   */
  removeUnseenMembers(expiryMilliseconds: number): void {
    const now = this.now();
    for (const room of [...this.rooms.values()]) {
      if (room.status !== 'waiting') {
        continue;
      }
      for (const playerId of [...room.playerIds]) {
        const seenAt = room.lastSeenAt.get(playerId);
        if (seenAt === undefined) {
          throw new Error(`Player '${playerId}' of a waiting room has no time last seen`);
        }
        if (now - seenAt > expiryMilliseconds) {
          this.leave(room, playerId);
        }
      }
    }
  }

  /** Checks that the player may start the room, and what the room needs to start. */
  requireStartable(game: RegisteredRoomGame, room: Room, playerId: string): void {
    if (hostOf(room) !== playerId) {
      throw new HttpError(403, 'not-host', 'Only the host can start the run');
    }
    if (room.status !== 'waiting') {
      throw new HttpError(409, 'room-started', 'This run has already started');
    }
    if (room.playerIds.length < game.minPlayers) {
      throw new HttpError(
        409,
        'not-enough-players',
        `This game needs at least ${String(game.minPlayers)} players`,
      );
    }
  }

  delete(room: Room): void {
    this.rooms.delete(room.roomId);
  }
}
