import { Type, type Static } from 'typebox';

/** Body of every error answer, so the browser can react to `error` and show `message`. */
export const apiErrorBodySchema = Type.Object({
  error: Type.String(),
  message: Type.String(),
  /** Set when a game refused a move, such as 'not-a-pair'. */
  reason: Type.Optional(Type.String()),
});

export type ApiErrorBody = Static<typeof apiErrorBodySchema>;
