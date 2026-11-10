import { DIFFICULTY_IDS, isDifficultyId, type DifficultyId } from './difficulty.js';
import { BOARD_WIDTHS, isBoardWidth, type BoardWidth, type GameState } from './game-state.js';

/** Shown next to a save slot or a high score (PS-09, PS-13). Stored as JSON with high scores. */
// A type instead of an interface, because only a type can be passed where the server expects a
// plain record of strings and numbers.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NumberGameSummaryDetails = {
  readonly stage: number;
  readonly width: BoardWidth;
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
    details: { stage: state.stage, width: state.width, difficulty: state.difficulty },
  };
}

function fail(message: string): never {
  throw new InvalidSummaryDetailsError(`Invalid Number Game summary details: ${message}`);
}

/** Checks summary details read back from storage or from the server, and returns them typed. */
export function parseSummaryDetails(value: unknown): NumberGameSummaryDetails {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail('expected an object');
  }
  const record = new Map<string, unknown>(Object.entries(value));
  const stage = record.get('stage');
  if (typeof stage !== 'number' || !Number.isSafeInteger(stage) || stage < 1) {
    fail('stage must be a whole number of 1 or more');
  }
  const width = record.get('width');
  if (!isBoardWidth(width)) {
    fail(`width must be one of ${BOARD_WIDTHS.join(', ')}`);
  }
  const difficulty = record.get('difficulty');
  if (!isDifficultyId(difficulty)) {
    fail(`difficulty must be one of ${DIFFICULTY_IDS.join(', ')}`);
  }
  return { stage, width, difficulty };
}
