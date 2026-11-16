import { describe, expect, it } from 'vitest';
import { buildRoomSocketUrl } from './room-socket-url.js';

const PARTS = {
  pageProtocol: 'http:',
  pageHost: '192.168.1.20:3000',
  gameId: 'survivor-game',
  roomId: 'room-1',
  playerId: 'Sam & Co',
  playerIdParameter: 'playerId',
};

describe('buildRoomSocketUrl', () => {
  it('uses ws for a plain page and wss for a secure page', () => {
    expect(buildRoomSocketUrl(PARTS)).toBe(
      'ws://192.168.1.20:3000/api/games/survivor-game/rooms/room-1/socket?playerId=Sam%20%26%20Co',
    );
    expect(buildRoomSocketUrl({ ...PARTS, pageProtocol: 'https:' })).toMatch(/^wss:\/\//);
  });

  it('encodes the room id', () => {
    expect(buildRoomSocketUrl({ ...PARTS, roomId: 'a/b' })).toContain('/rooms/a%2Fb/socket');
  });
});
