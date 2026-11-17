/** What the rooms need from a connection, so the run code does not depend on a WebSocket library. */
export interface RoomSocket {
  send(text: string): void;
  close(code: number, reason: string): void;
}

/** Close codes of the WebSocket connection of a room (see API.md). */
export const CLOSE_CODES = {
  normal: 1000,
  goingAway: 1001,
  /** The client sent more frames than a real player can. */
  tooManyMessages: 1008,
  serverError: 1011,
  roomNotStarted: 4400,
  roomOrPlayerNotFound: 4404,
  alreadyConnected: 4409,
} as const;
