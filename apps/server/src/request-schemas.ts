import { saveIdSchema } from '@local/game-server-api';
import { Type } from 'typebox';

// Request parts that only the server reads. The request bodies and the answers are shared with
// the browser app in @local/game-server-api.

/**
 * Each browser makes up a random device ID once and sends it with every request that opens or
 * changes a save. It is how the server knows which device holds the lock on a save (PS-18).
 */
export const deviceHeadersSchema = Type.Object({
  'x-device-id': Type.String({ minLength: 8, maxLength: 64, pattern: '^[A-Za-z0-9-]+$' }),
});

export const gameParamsSchema = Type.Object({ gameId: Type.String() });

export const slotParamsSchema = Type.Object({
  gameId: Type.String(),
  slotNumber: Type.Integer({ minimum: 1 }),
});

/** Names one save, so a request made for an older game in the slot cannot reach a newer one. */
export const saveParamsSchema = Type.Object({
  gameId: Type.String(),
  slotNumber: Type.Integer({ minimum: 1 }),
  saveId: saveIdSchema,
});
