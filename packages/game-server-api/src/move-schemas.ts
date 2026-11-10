import { Type, type Static } from 'typebox';
import { gameResultSchema } from './high-score-schemas.js';

export const moveRequestSchema = Type.Object({
  // Each game checks its own move shape.
  move: Type.Unknown(),
});

/** A game over answer carries the result that went into the high scores. */
export const moveResponseSchema = Type.Union([
  Type.Object({ gameOver: Type.Literal(false) }),
  Type.Object({ gameOver: Type.Literal(true), result: gameResultSchema }),
]);

export type MoveResponse = Static<typeof moveResponseSchema>;
