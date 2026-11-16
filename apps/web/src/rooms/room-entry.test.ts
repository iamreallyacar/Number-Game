import type { Room } from '@local/game-server-api';
import { describe, expect, it } from 'vitest';
import { chooseListedRoomAction, describeRoomPageView } from './room-entry.js';

function roomWith(overrides: Partial<Room>): Room {
  return {
    roomId: 'room-1',
    status: 'waiting',
    hostPlayerId: 'Sam',
    playerIds: ['Sam', 'Alex'],
    disconnectedPlayerIds: [],
    maxPlayers: 4,
    ...overrides,
  };
}

describe('describeRoomPageView', () => {
  it('asks for a player ID until one is known', () => {
    expect(describeRoomPageView(roomWith({}), null)).toEqual({ kind: 'pick-player' });
  });

  it('reports a room that no longer exists', () => {
    expect(describeRoomPageView(null, 'Sam')).toEqual({ kind: 'room-gone' });
  });

  it('shows the waiting room to a member, and says who is host', () => {
    expect(describeRoomPageView(roomWith({}), 'Sam')).toEqual({ kind: 'waiting', isHost: true });
    expect(describeRoomPageView(roomWith({}), 'Alex')).toEqual({ kind: 'waiting', isHost: false });
  });

  it('plays when a member finds the room running, dropped or not', () => {
    const running = roomWith({ status: 'running', disconnectedPlayerIds: ['Alex'] });
    expect(describeRoomPageView(running, 'Alex')).toEqual({ kind: 'play' });
    expect(describeRoomPageView(running, 'Sam')).toEqual({ kind: 'play' });
  });

  it('offers a waiting room to a player who is not in it, unless it is full', () => {
    expect(describeRoomPageView(roomWith({}), 'Kim')).toEqual({ kind: 'can-join' });
    expect(describeRoomPageView(roomWith({ maxPlayers: 2 }), 'Kim')).toEqual({
      kind: 'room-full',
    });
  });

  it('refuses a player who is not in a running room (SG-06)', () => {
    expect(describeRoomPageView(roomWith({ status: 'running' }), 'Kim')).toEqual({
      kind: 'already-started',
    });
  });
});

describe('chooseListedRoomAction', () => {
  it('opens a room the player is already in, and joins any other', () => {
    expect(chooseListedRoomAction(roomWith({}), 'Alex')).toBe('open');
    expect(chooseListedRoomAction(roomWith({}), 'Kim')).toBe('join');
  });
});
