import { Type, type Static } from 'typebox';
import { playerIdSchema } from './player-schemas.js';

const roomStatusSchema = Type.Union([Type.Literal('waiting'), Type.Literal('running')]);

/** A room of a room game, as every room route answers with it. */
export const roomSchema = Type.Object({
  roomId: Type.String(),
  status: roomStatusSchema,
  hostPlayerId: Type.String(),
  /** Every player ID in the room, in the order they joined. */
  playerIds: Type.Array(Type.String()),
  /** Players of a running room whose character has no connection. Always empty while waiting. */
  disconnectedPlayerIds: Type.Array(Type.String()),
  maxPlayers: Type.Integer(),
});

export const roomResponseSchema = Type.Object({ room: roomSchema });

/**
 * Query of the read of one room. The player who asks is noted as seen, so a member of a waiting
 * room whose page was closed can be told from one who is still there. The room page sends it, and
 * the page that has no player ID yet leaves it out.
 */
export const roomReadQuerySchema = Type.Object({ playerId: Type.Optional(playerIdSchema) });

export const roomListResponseSchema = Type.Object({ rooms: Type.Array(roomSchema) });

/** Body of create, join, leave, and start. The routes trust the player ID (PS-02). */
export const roomPlayerRequestSchema = Type.Object({ playerId: playerIdSchema });

export const leaveRoomResponseSchema = Type.Object({ closed: Type.Boolean() });

export type Room = Static<typeof roomSchema>;
export type RoomStatus = Static<typeof roomStatusSchema>;
