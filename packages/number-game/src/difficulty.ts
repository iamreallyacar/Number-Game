export const DIFFICULTY_IDS = ['easy', 'normal', 'hard'] as const;
export type DifficultyId = (typeof DIFFICULTY_IDS)[number];

/** Hints left in the current stage. Easy never runs out, so it uses 'unlimited' instead of a count. */
export type HintAllowance = number | 'unlimited';

export interface DifficultyPreset {
  readonly addNumbersUsesPerStage: number;
  readonly hintsPerStage: HintAllowance;
  /** The count of pairs with line of sight a starting board aims for (NG-35, DF-04). */
  readonly startingOpenPairsRange: { readonly min: number; readonly max: number };
  /**
   * Chance that each step of a planned solution prefers a match that is blocked on the starting
   * board. A higher chance gives fewer opening pairs and longer chains.
   */
  readonly startingBoardChainChance: number;
}

// The values from REQUIREMENTS/number-game/difficulty.md. Lowering one needs a stored state upgrade,
// see Changing the Stored Format in the package README.
export const DIFFICULTY_PRESETS: Readonly<Record<DifficultyId, DifficultyPreset>> = {
  easy: {
    addNumbersUsesPerStage: 8,
    hintsPerStage: 'unlimited',
    startingOpenPairsRange: { min: 5, max: 6 },
    startingBoardChainChance: 0.92,
  },
  normal: {
    addNumbersUsesPerStage: 5,
    hintsPerStage: 3,
    startingOpenPairsRange: { min: 3, max: 4 },
    startingBoardChainChance: 0.97,
  },
  hard: {
    addNumbersUsesPerStage: 3,
    hintsPerStage: 0,
    startingOpenPairsRange: { min: 1, max: 2 },
    startingBoardChainChance: 1,
  },
};

export function isDifficultyId(value: unknown): value is DifficultyId {
  return DIFFICULTY_IDS.some((difficultyId) => difficultyId === value);
}
