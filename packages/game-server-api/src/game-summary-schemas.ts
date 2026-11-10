import { Type, type Static } from 'typebox';

/** Facts a game wants shown next to a save slot or a high score. Each game reads its own. */
export const summaryDetailsSchema = Type.Record(
  Type.String(),
  Type.Union([Type.String(), Type.Number()]),
);

/** What shared code knows about a game state, for save slot lists and high scores. */
export const gameSummarySchema = Type.Object({
  score: Type.Number(),
  /** The value high scores are filtered by, such as a difficulty. */
  category: Type.String(),
  details: summaryDetailsSchema,
});

export type SummaryDetails = Static<typeof summaryDetailsSchema>;
export type GameSummary = Static<typeof gameSummarySchema>;
