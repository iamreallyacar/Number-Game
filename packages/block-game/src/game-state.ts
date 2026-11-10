import type { RandomState } from '@local/seeded-random';
import type { BoardCell } from './board-cell.js';
import type { ShapeId } from './shape-catalogue.js';

export const BOARD_SIZES = [8, 9, 10] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];

export function isBoardSize(value: unknown): value is BoardSize {
  return BOARD_SIZES.some((size) => size === value);
}

/** The player always holds exactly this many shapes (BG-04). */
export const SLOT_COUNT = 3;

/** The shape in each slot, in slot order. A slot is never empty. */
export type ShapeSlots = readonly [ShapeId, ShapeId, ShapeId];

/** Position of a cell in reading order, starting at 0 for the top-left cell. */
export type CellIndex = number;

/** A square board. Rows and columns are counted from 0 at the top-left. */
export interface BoardGrid {
  readonly size: BoardSize;
  /** Every cell in reading order, size times size cells. */
  readonly cells: readonly BoardCell[];
}

/**
 * The full state of one Block Game. It holds only plain JSON values, so
 * JSON.parse(JSON.stringify(state)) gives back an identical state.
 */
export interface GameState extends BoardGrid {
  readonly slots: ShapeSlots;
  readonly score: number;
  /** Back-to-back placements that each cleared at least one line, 0 after one that cleared none. */
  readonly streak: number;
  /** Rows and columns cleared so far, where a row and a column cleared together count as 2. */
  readonly linesCleared: number;
  readonly shapesPlaced: number;
  readonly randomState: RandomState;
}
