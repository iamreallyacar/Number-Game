import { cellIndexAt, findFullLines, type FullLines } from './board.js';
import type { BoardCell } from './board-cell.js';
import { BOARD_SIZE, type BoardGrid, type CellIndex } from './game-state.js';
import type { ShapeId } from './shape-catalogue.js';
import { fillShape } from './shape-fit.js';

export interface PlacedAndCleared {
  /** The board cells after the shape was filled in and every full row and column was emptied. */
  readonly cells: BoardCell[];
  readonly fullLines: FullLines;
  /** Every cell emptied by the cleared lines, once each, in increasing order. */
  readonly clearedCellIndexes: readonly CellIndex[];
}

/** Fills the shape in and clears every full row and column (BG-11). Throws if the shape does not fit. */
export function placeAndClearLines(
  board: BoardGrid,
  shapeId: ShapeId,
  topRow: number,
  leftColumn: number,
): PlacedAndCleared {
  const filledCells = fillShape(board, shapeId, topRow, leftColumn);
  const fullLines = findFullLines({ cells: filledCells });
  const clearedCellIndexSet = new Set<CellIndex>();
  for (let line = 0; line < BOARD_SIZE; line++) {
    for (const row of fullLines.rows) {
      clearedCellIndexSet.add(cellIndexAt(row, line));
    }
    for (const column of fullLines.columns) {
      clearedCellIndexSet.add(cellIndexAt(line, column));
    }
  }
  return {
    cells: filledCells.map((cell, index): BoardCell =>
      clearedCellIndexSet.has(index) ? null : cell,
    ),
    fullLines,
    clearedCellIndexes: [...clearedCellIndexSet].sort((first, second) => first - second),
  };
}
