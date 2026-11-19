import { describe, expect, it } from 'vitest';
import { DIFFICULTY_PRESETS, type DifficultyId, type HintAllowance } from './difficulty.js';

// Copied from the table in REQUIREMENTS/number-game/difficulty.md (DF-01), so a changed value fails here.
const DF_01_TABLE: readonly (readonly [DifficultyId, number, HintAllowance, number, number])[] = [
  ['easy', 8, 'unlimited', 5, 6],
  ['normal', 5, 3, 3, 4],
  ['hard', 3, 0, 1, 2],
];

describe('DIFFICULTY_PRESETS', () => {
  it.each(DF_01_TABLE)(
    '%s has %i uses, hints %s and %i to %i opening pairs',
    (difficulty, uses, hints, minPairs, maxPairs) => {
      const preset = DIFFICULTY_PRESETS[difficulty];
      expect(preset.addNumbersUsesPerStage).toBe(uses);
      expect(preset.hintsPerStage).toBe(hints);
      expect(preset.startingOpenPairsRange).toEqual({ min: minPairs, max: maxPairs });
    },
  );
});
