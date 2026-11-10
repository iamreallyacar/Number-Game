import { cellIndexAt, findFullLines, type FullLines } from './board.js';
import type { BoardCell } from './board-cell.js';
import type { BoardGrid, CellIndex } from './game-state.js';
import { getShape, type ShapeId } from './shape-catalogue.js';

export type FitRefusal = 'out-of-bounds' | 'cell-occupied';

/**
 * Says why a shape cannot go with the top-left of its bounding box at the given row and column,
 * or gives null when it fits (BG-06). A block off the board is reported before an occupied cell.
 */
export function findFitProblem(
  board: BoardGrid,
  shapeId: ShapeId,
  topRow: number,
  leftColumn: number,
): FitRefusal | null {
  if (!Number.isInteger(topRow) || !Number.isInteger(leftColumn)) {
    return 'out-of-bounds';
  }
  const shape = getShape(shapeId);
  const isInside = (line: number): boolean => line >= 0 && line < board.size;
  const blockPositions = shape.cells.map((cell) => ({
    row: topRow + cell.rowOffset,
    column: leftColumn + cell.columnOffset,
  }));
  if (!blockPositions.every(({ row, column }) => isInside(row) && isInside(column))) {
    return 'out-of-bounds';
  }
  const isOccupied = blockPositions.some(
    ({ row, column }) => board.cells[cellIndexAt(board.size, row, column)] !== null,
  );
  return isOccupied ? 'cell-occupied' : null;
}

export function shapeFitsAt(
  board: BoardGrid,
  shapeId: ShapeId,
  topRow: number,
  leftColumn: number,
): boolean {
  return findFitProblem(board, shapeId, topRow, leftColumn) === null;
}

export function shapeFitsAnywhere(board: BoardGrid, shapeId: ShapeId): boolean {
  for (let topRow = 0; topRow < board.size; topRow++) {
    for (let leftColumn = 0; leftColumn < board.size; leftColumn++) {
      if (shapeFitsAt(board, shapeId, topRow, leftColumn)) {
        return true;
      }
    }
  }
  return false;
}

/** The cells a shape would cover. Throws if it does not fit, since callers check that first. */
export function coveredCellIndexes(
  board: BoardGrid,
  shapeId: ShapeId,
  topRow: number,
  leftColumn: number,
): CellIndex[] {
  const problem = findFitProblem(board, shapeId, topRow, leftColumn);
  if (problem !== null) {
    throw new RangeError(
      `Shape '${shapeId}' does not fit at row ${String(topRow)}, column ${String(leftColumn)}: ${problem}`,
    );
  }
  return getShape(shapeId).cells.map((cell) =>
    cellIndexAt(board.size, topRow + cell.rowOffset, leftColumn + cell.columnOffset),
  );
}

/** The board cells with the shape filled in, before any lines are cleared. Throws if it does not fit. */
export function fillShape(
  board: BoardGrid,
  shapeId: ShapeId,
  topRow: number,
  leftColumn: number,
): BoardCell[] {
  const covered = new Set(coveredCellIndexes(board, shapeId, topRow, leftColumn));
  const colour = getShape(shapeId).colour;
  return board.cells.map((cell, index) => (covered.has(index) ? colour : cell));
}

/**
 * The rows and columns that placing the shape would fill and clear, for a drag preview (BG-07).
 * Throws if the shape does not fit, so check `shapeFitsAt` first.
 */
export function linesClearedByPlacement(
  board: BoardGrid,
  shapeId: ShapeId,
  topRow: number,
  leftColumn: number,
): FullLines {
  return findFullLines({ size: board.size, cells: fillShape(board, shapeId, topRow, leftColumn) });
}
