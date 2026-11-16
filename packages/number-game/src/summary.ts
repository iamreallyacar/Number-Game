import { isWholeNumberAtLeast, readStoredFields } from '@local/stored-values';
import { DIFFICULTY_IDS, isDifficultyId, type DifficultyId } from './difficulty.js';
import type { GameState } from './game-state.js';

/** Shown next to a save slot or a high score (PS-09, PS-13). Stored as JSON with high scores. */
// A type instead of an interface, because only a type can be passed where the server expects a
// plain record of strings and numbers.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NumberGameSummaryDetails = {
  readonly stage: number;
  readonly difficulty: DifficultyId;
};

export interface NumberGameSummary {
  readonly score: number;
  /** High scores are filtered by difficulty. */
  readonly category: DifficultyId;
  readonly details: NumberGameSummaryDetails;
}

export class InvalidSummaryDetailsError extends Error {
  override readonly name = 'InvalidSummaryDetailsError';
}

export function summarizeGame(state: GameState): NumberGameSummary {
  return {
    score: state.score,
    category: state.difficulty,
    details: { stage: state.stage, difficulty: state.difficulty },
  };
}

function fail(message: string): never {
  throw new InvalidSummaryDetailsError(`Invalid Number Game summary details: ${message}`);
}

/** Checks summary details read back from storage or from the server, and returns them typed. */
export function parseSummaryDetails(value: unknown): NumberGameSummaryDetails {
  const record = readStoredFields(value) ?? fail('expected an object');
  const stage = record.get('stage');
  if (!isWholeNumberAtLeast(stage, 1)) {
    fail('stage must be a whole number of 1 or more');
  }
  const difficulty = record.get('difficulty');
  if (!isDifficultyId(difficulty)) {
    fail(`difficulty must be one of ${DIFFICULTY_IDS.join(', ')}`);
  }
  return { stage, difficulty };
}
