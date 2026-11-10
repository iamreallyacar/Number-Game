import { Type, type Static } from 'typebox';
import { summaryDetailsSchema } from './game-summary-schemas.js';

export const gameResultSchema = Type.Object({
  playerId: Type.String(),
  score: Type.Number(),
  category: Type.String(),
  details: summaryDetailsSchema,
  finishedAt: Type.String(),
});

export const highScoresResponseSchema = Type.Object({ highScores: Type.Array(gameResultSchema) });

export const personalBestsResponseSchema = Type.Object({
  personalBests: Type.Array(gameResultSchema),
});

export type GameResult = Static<typeof gameResultSchema>;
