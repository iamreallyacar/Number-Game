import { isWholeNumberAtLeast, readStoredFields } from '@local/stored-values';
import type { GameState } from './game-state.js';

/** The one high score category, since every game uses the same board (BG-21). */
export const BLOCK_GAME_CATEGORY = 'standard';

export const BLOCK_GAME_CATEGORIES: readonly string[] = [BLOCK_GAME_CATEGORY];

/** Shown next to a save slot or a high score (BG-21). Stored as JSON with high scores. */
// A type instead of an interface, because only a type can be passed where the server expects a
// plain record of strings and numbers.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type BlockGameSummaryDetails = {
  readonly linesCleared: number;
};

export interface BlockGameSummary {
  readonly score: number;
  readonly category: string;
  readonly details: BlockGameSummaryDetails;
}

export class InvalidSummaryDetailsError extends Error {
  override readonly name = 'InvalidSummaryDetailsError';
}

export function summarizeGame(state: GameState): BlockGameSummary {
  return {
    score: state.score,
    category: BLOCK_GAME_CATEGORY,
    details: { linesCleared: state.linesCleared },
  };
}

function fail(message: string): never {
  throw new InvalidSummaryDetailsError(`Invalid Block Game summary details: ${message}`);
}

/** Checks summary details read back from storage or from the server, and returns them typed. */
export function parseSummaryDetails(value: unknown): BlockGameSummaryDetails {
  const record = readStoredFields(value) ?? fail('expected an object');
  for (const key of record.keys()) {
    if (key !== 'linesCleared') {
      fail(`unknown field '${key}'`);
    }
  }
  const linesCleared = record.get('linesCleared');
  if (!isWholeNumberAtLeast(linesCleared, 0)) {
    fail('linesCleared must be a whole number of 0 or more');
  }
  return { linesCleared };
}
