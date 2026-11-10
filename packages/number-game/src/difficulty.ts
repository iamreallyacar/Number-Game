export const DIFFICULTY_IDS = ['easy', 'normal', 'hard'] as const;
export type DifficultyId = (typeof DIFFICULTY_IDS)[number];

/** Hints left in the current stage. Easy never runs out, so it uses 'unlimited' instead of a count. */
export type HintAllowance = number | 'unlimited';

export interface DifficultyPreset {
  readonly addNumbersUsesPerStage: number;
  readonly hintsPerStage: HintAllowance;
  /**
   * Chance that each starting cell is made to pair with the cell before it in reading order,
   * which guarantees that pair can see each other. 0 gives a fully random board.
   */
  readonly startingPairChance: number;
}

// Starting values from REQUIREMENTS/number-game/difficulty.md, to be tuned after playtesting (T-41).
export const DIFFICULTY_PRESETS: Readonly<Record<DifficultyId, DifficultyPreset>> = {
  easy: { addNumbersUsesPerStage: 8, hintsPerStage: 'unlimited', startingPairChance: 0.4 },
  normal: { addNumbersUsesPerStage: 5, hintsPerStage: 3, startingPairChance: 0 },
  hard: { addNumbersUsesPerStage: 3, hintsPerStage: 0, startingPairChance: 0 },
};

export function isDifficultyId(value: unknown): value is DifficultyId {
  return DIFFICULTY_IDS.some((difficultyId) => difficultyId === value);
}
