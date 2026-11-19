import { Type, type Static } from 'typebox';
import { gameResultSchema } from './high-score-schemas.js';

export const moveRequestSchema = Type.Object({
  // Each game checks its own move shape.
  move: Type.Unknown(),
  /**
   * Counts the moves already applied to this save, so the first move of a save is 0. The browser
   * sends the same number again when an answer was lost, and the server then knows not to apply
   * the move twice.
   */
  moveNumber: Type.Integer({ minimum: 0 }),
});

/** A game over answer carries the result that went into the high scores. */
export const moveResponseSchema = Type.Union([
  Type.Object({ gameOver: Type.Literal(false) }),
  Type.Object({ gameOver: Type.Literal(true), result: gameResultSchema }),
]);

export type MoveResponse = Static<typeof moveResponseSchema>;
