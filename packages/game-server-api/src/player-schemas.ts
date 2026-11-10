import { Type } from 'typebox';

// Letters, digits, and _ . - in any language, with single spaces between words.
const PLAYER_ID_PATTERN = '^[\\p{L}\\p{N}_.-]+( [\\p{L}\\p{N}_.-]+)*$';

export const playerIdSchema = Type.String({
  minLength: 1,
  maxLength: 24,
  pattern: PLAYER_ID_PATTERN,
});

export const playerListResponseSchema = Type.Object({ playerIds: Type.Array(Type.String()) });

export const createPlayerRequestSchema = Type.Object({ playerId: playerIdSchema });

/** The player ID as the server stored it. */
export const createPlayerResponseSchema = Type.Object({ playerId: Type.String() });
