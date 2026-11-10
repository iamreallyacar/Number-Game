import { Type, type Static } from 'typebox';
import { gameSummarySchema } from './game-summary-schemas.js';
import { playerIdSchema } from './player-schemas.js';

const slotListingSchema = Type.Object({
  slotNumber: Type.Integer(),
  save: Type.Union([
    Type.Object({
      playerId: Type.String(),
      lastPlayedAt: Type.String(),
      summary: gameSummarySchema,
    }),
    Type.Null(),
  ]),
});

export const slotListResponseSchema = Type.Object({ slots: Type.Array(slotListingSchema) });

export const startGameRequestSchema = Type.Object({
  playerId: playerIdSchema,
  // Each game checks its own new game options.
  options: Type.Unknown(),
});

/** The answer to starting a game in a slot or opening a slot. */
export const openedSaveResponseSchema = Type.Object({
  slotNumber: Type.Integer(),
  playerId: Type.String(),
  lastPlayedAt: Type.String(),
  // Each game checks its own state shape before using it.
  state: Type.Unknown(),
});

export type SlotListing = Static<typeof slotListingSchema>;
export type OpenedSave = Static<typeof openedSaveResponseSchema>;
