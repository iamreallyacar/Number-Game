import type { Room } from '@local/game-server-api';

/** What a player does with a room on the room page, decided from the room and the player ID. */
export type RoomPageView =
  | { readonly kind: 'pick-player' }
  | { readonly kind: 'room-gone' }
  /** The player is in the room and the run has not started. */
  | { readonly kind: 'waiting'; readonly isHost: boolean }
  /** The player is in the room and the run has started, so the play screen takes over. */
  | { readonly kind: 'play' }
  | { readonly kind: 'can-join' }
  | { readonly kind: 'room-full' }
  | { readonly kind: 'already-started' };

/**
 * A member of a running room goes straight to the play screen, even one the room still lists as
 * connected, since a reload can come before the server has noticed the old page closing. The
 * socket then retries until the server lets the character go.
 */
export function describeRoomPageView(room: Room | null, playerId: string | null): RoomPageView {
  if (playerId === null) {
    return { kind: 'pick-player' };
  }
  if (room === null) {
    return { kind: 'room-gone' };
  }
  if (room.playerIds.includes(playerId)) {
    return room.status === 'running'
      ? { kind: 'play' }
      : { kind: 'waiting', isHost: room.hostPlayerId === playerId };
  }
  if (room.status === 'running') {
    return { kind: 'already-started' };
  }
  return room.playerIds.length >= room.maxPlayers ? { kind: 'room-full' } : { kind: 'can-join' };
}

/** What happens when a player picks a listed room on the game page. */
export type ListedRoomChoice = 'join' | 'open';

/** A player who is already in a waiting room just opens it again, for example after a reload. */
export function chooseListedRoomAction(room: Room, playerId: string): ListedRoomChoice {
  return room.playerIds.includes(playerId) ? 'open' : 'join';
}
