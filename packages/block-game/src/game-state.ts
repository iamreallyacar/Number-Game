import type { RandomState } from '@local/seeded-random';
import type { BoardCell } from './board-cell.js';
import type { ShapeId } from './shape-catalogue.js';

/** The board is always this many rows and columns (BG-01). */
export const BOARD_SIZE = 10;

/** Every hand has exactly this many shapes (BG-04). */
export const SLOT_COUNT = 3;

/**
 * The shape in each slot, in slot order. A slot is null once its shape is placed, until the next
 * hand. A state always has at least one filled slot, because the next hand is dealt as soon as the
 * last shape of a hand is placed (BG-13).
 */
export type ShapeSlots = readonly [ShapeId | null, ShapeId | null, ShapeId | null];

/** Position of a cell in reading order, starting at 0 for the top-left cell. */
export type CellIndex = number;

/** A square board of BOARD_SIZE rows and columns, counted from 0 at the top-left. */
export interface BoardGrid {
  /** Every cell in reading order, BOARD_SIZE times BOARD_SIZE cells. */
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
