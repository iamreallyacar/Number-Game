import { BOARD_SIZES, isBoardSize, type BoardSize, type GameState } from './game-state.js';

/** High scores are filtered by board size, written as text such as '8' (BG-21). */
export type BoardSizeCategory = `${BoardSize}`;

const CATEGORY_BY_BOARD_SIZE: Readonly<Record<BoardSize, BoardSizeCategory>> = {
  8: '8',
  9: '9',
  10: '10',
};

export function boardSizeCategory(size: BoardSize): BoardSizeCategory {
  return CATEGORY_BY_BOARD_SIZE[size];
}

export const BOARD_SIZE_CATEGORIES: readonly BoardSizeCategory[] =
  BOARD_SIZES.map(boardSizeCategory);

/** Shown next to a save slot or a high score (BG-21). Stored as JSON with high scores. */
// A type instead of an interface, because only a type can be passed where the server expects a
// plain record of strings and numbers.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type BlockGameSummaryDetails = {
  readonly size: BoardSize;
  readonly linesCleared: number;
};

export interface BlockGameSummary {
  readonly score: number;
  readonly category: BoardSizeCategory;
  readonly details: BlockGameSummaryDetails;
}

export class InvalidSummaryDetailsError extends Error {
  override readonly name = 'InvalidSummaryDetailsError';
}

export function summarizeGame(state: GameState): BlockGameSummary {
  return {
    score: state.score,
    category: boardSizeCategory(state.size),
    details: { size: state.size, linesCleared: state.linesCleared },
  };
}

function fail(message: string): never {
  throw new InvalidSummaryDetailsError(`Invalid Block Game summary details: ${message}`);
}

/** Checks summary details read back from storage or from the server, and returns them typed. */
export function parseSummaryDetails(value: unknown): BlockGameSummaryDetails {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail('expected an object');
  }
  const record = new Map<string, unknown>(Object.entries(value));
  const size = record.get('size');
  if (!isBoardSize(size)) {
    fail(`size must be one of ${BOARD_SIZES.join(', ')}`);
  }
  const linesCleared = record.get('linesCleared');
  if (typeof linesCleared !== 'number' || !Number.isSafeInteger(linesCleared) || linesCleared < 0) {
    fail('linesCleared must be a whole number of 0 or more');
  }
  return { size, linesCleared };
}
