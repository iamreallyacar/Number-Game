export interface RoomSocketUrlParts {
  /** The protocol of the page, `http:` or `https:`, so the socket is secure exactly when the page is. */
  readonly pageProtocol: string;
  /** The host and port of the page, such as `192.168.1.20:3000`. */
  readonly pageHost: string;
  readonly gameId: string;
  readonly roomId: string;
  readonly playerId: string;
  /** The name of the query parameter that holds the player ID, from the game's rules package. */
  readonly playerIdParameter: string;
}

/** The address of the WebSocket of a running room (PL-22). */
export function buildRoomSocketUrl(parts: RoomSocketUrlParts): string {
  const socketProtocol = parts.pageProtocol === 'https:' ? 'wss:' : 'ws:';
  const path = `/api/games/${encodeURIComponent(parts.gameId)}/rooms/${encodeURIComponent(parts.roomId)}/socket`;
  const query = `${encodeURIComponent(parts.playerIdParameter)}=${encodeURIComponent(parts.playerId)}`;
  return `${socketProtocol}//${parts.pageHost}${path}?${query}`;
}
