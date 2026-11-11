import { isGameOver } from './game-over.js';
import {
  isStartingDiskCount,
  STARTING_DISK_COUNTS,
  type GameState,
  type StartingDiskCount,
} from './game-state.js';

/** High scores are filtered by starting disk count, written as text such as '3' (DK-21). */
export type StartingDiskCountCategory = `${StartingDiskCount}`;

const CATEGORY_BY_STARTING_DISK_COUNT: Readonly<
  Record<StartingDiskCount, StartingDiskCountCategory>
> = { 3: '3', 4: '4', 5: '5' };

export function startingDiskCountCategory(
  startingDiskCount: StartingDiskCount,
): StartingDiskCountCategory {
  return CATEGORY_BY_STARTING_DISK_COUNT[startingDiskCount];
}

export const STARTING_DISK_COUNT_CATEGORIES: readonly StartingDiskCountCategory[] =
  STARTING_DISK_COUNTS.map(startingDiskCountCategory);

/** Shown next to a save slot or a high score (DK-21). Stored as JSON with high scores. */
// A type instead of an interface, because only a type can be passed where the server expects a
// plain record of strings and numbers.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DiskGameSummaryDetails = {
  readonly stage: number;
  readonly startingDiskCount: StartingDiskCount;
  /** Left out once the game is over, because a high score does not show moves left (DK-21). */
  readonly movesLeft?: number;
};

export interface DiskGameSummary {
  readonly score: number;
  readonly category: StartingDiskCountCategory;
  readonly details: DiskGameSummaryDetails;
}

export class InvalidSummaryDetailsError extends Error {
  override readonly name = 'InvalidSummaryDetailsError';
}

export function summarizeGame(state: GameState): DiskGameSummary {
  const { stage, startingDiskCount } = state;
  return {
    score: state.score,
    category: startingDiskCountCategory(startingDiskCount),
    details: isGameOver(state)
      ? { stage, startingDiskCount }
      : { stage, startingDiskCount, movesLeft: state.movesLeft },
  };
}

function fail(message: string): never {
  throw new InvalidSummaryDetailsError(`Invalid Disk Game summary details: ${message}`);
}

function isWholeNumberAtLeast(value: unknown, minimum: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;
}

/** Checks summary details read back from storage or from the server, and returns them typed. */
export function parseSummaryDetails(value: unknown): DiskGameSummaryDetails {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail('expected an object');
  }
  const record = new Map<string, unknown>(Object.entries(value));
  const stage = record.get('stage');
  if (!isWholeNumberAtLeast(stage, 1)) {
    fail('stage must be a whole number of 1 or more');
  }
  const startingDiskCount = record.get('startingDiskCount');
  if (!isStartingDiskCount(startingDiskCount)) {
    fail(`startingDiskCount must be one of ${STARTING_DISK_COUNTS.join(', ')}`);
  }
  const movesLeft = record.get('movesLeft');
  if (movesLeft === undefined) {
    return { stage, startingDiskCount };
  }
  if (!isWholeNumberAtLeast(movesLeft, 0)) {
    fail('movesLeft must be a whole number of 0 or more');
  }
  return { stage, startingDiskCount, movesLeft };
}
