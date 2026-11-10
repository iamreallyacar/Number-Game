import { Type } from 'typebox';

// Letters, digits, and _ . - in any language, with single spaces between words.
const PLAYER_ID_PATTERN = '^[\\p{L}\\p{N}_.-]+( [\\p{L}\\p{N}_.-]+)*$';

export const playerIdSchema = Type.String({
  minLength: 1,
  maxLength: 24,
  pattern: PLAYER_ID_PATTERN,
});

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
