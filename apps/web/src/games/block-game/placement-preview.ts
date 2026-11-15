import {
  BOARD_SIZE,
  cellIndexAt,
  getShape,
  linesClearedByPlacement,
  shapeFitsAt,
  type BoardGrid,
  type CellIndex,
  type ShapeId,
} from '@local/block-game';
import type { DropTarget } from './drop-target.js';

/** What the board shows while a shape is dragged over it (BG-07). */
export interface PlacementPreview {
  /** The cells the shape's blocks would land on. */
  readonly coveredCellIndexes: readonly CellIndex[];
  readonly fits: boolean;
  /** Every cell in the rows and columns the placement would clear. Empty when it does not fit. */
  readonly clearingCellIndexes: readonly CellIndex[];
}

/** Builds the preview for a drop target, which must keep the whole shape on the board. */
export function buildPlacementPreview(
  board: BoardGrid,
  shapeId: ShapeId,
  target: DropTarget,
): PlacementPreview {
  const shape = getShape(shapeId);
  const coveredCellIndexes = shape.cells.map((cell) => {
    const row = target.topRow + cell.rowOffset;
    const column = target.leftColumn + cell.columnOffset;
    if (row < 0 || row >= BOARD_SIZE || column < 0 || column >= BOARD_SIZE) {
      throw new RangeError(
        `Shape '${shapeId}' at row ${String(target.topRow)}, column ${String(target.leftColumn)} sticks out of the board`,
      );
    }
    return cellIndexAt(row, column);
  });
  if (!shapeFitsAt(board, shapeId, target.topRow, target.leftColumn)) {
    return { coveredCellIndexes, fits: false, clearingCellIndexes: [] };
  }
  const lines = linesClearedByPlacement(board, shapeId, target.topRow, target.leftColumn);
  const clearingCellIndexes = new Set<CellIndex>();
  for (let line = 0; line < BOARD_SIZE; line++) {
    for (const row of lines.rows) {
      clearingCellIndexes.add(cellIndexAt(row, line));
    }
    for (const column of lines.columns) {
      clearingCellIndexes.add(cellIndexAt(line, column));
    }
  }
  return { coveredCellIndexes, fits: true, clearingCellIndexes: [...clearingCellIndexes] };
}
