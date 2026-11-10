import type { Cell } from './cell.js';
import type { DifficultyId, HintAllowance } from './difficulty.js';
import type { RandomState } from '@local/seeded-random';

export const BOARD_WIDTHS = [10, 11, 12] as const;
export type BoardWidth = (typeof BOARD_WIDTHS)[number];

export function isBoardWidth(value: unknown): value is BoardWidth {
  return BOARD_WIDTHS.some((width) => width === value);
}

/** Position of a cell in reading order, starting at 0 for row 1 column 1. */
export type CellIndex = number;

/**
 * The full state of one Number Game. It holds only plain JSON values, so
 * JSON.parse(JSON.stringify(state)) gives back an identical state.
 */
export interface GameState {
  readonly width: BoardWidth;
  /**
   * Every cell in reading order. The length is always a whole number of rows, so the last row is
   * padded with empty cells after Add Numbers. The board always holds at least one number.
   */
  readonly cells: readonly Cell[];
  readonly score: number;
  /** Current stage, starting at 1. */
  readonly stage: number;
  readonly difficulty: DifficultyId;
  readonly addNumbersLeft: number;
  readonly hintsLeft: HintAllowance;
  readonly randomState: RandomState;
}
