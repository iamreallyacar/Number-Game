import type { BoardCell } from './board-cell.js';
import type { BoardGrid, BoardSize, CellIndex } from './game-state.js';

export function cellIndexAt(size: BoardSize, row: number, column: number): CellIndex {
  return row * size + column;
}

export function rowOf(size: BoardSize, index: CellIndex): number {
  return Math.floor(index / size);
}

export function columnOf(size: BoardSize, index: CellIndex): number {
  return index % size;
}

export function createEmptyCells(size: BoardSize): BoardCell[] {
  return Array.from({ length: size * size }, (): BoardCell => null);
}

/** The full rows and full columns of a board, each list in increasing order. */
export interface FullLines {
  readonly rows: readonly number[];
  readonly columns: readonly number[];
}

export function findFullLines(board: BoardGrid): FullLines {
  const lineNumbers = [...Array(board.size).keys()];
  const isFilled = (row: number, column: number): boolean =>
    board.cells[cellIndexAt(board.size, row, column)] !== null;
  return {
    rows: lineNumbers.filter((row) => lineNumbers.every((column) => isFilled(row, column))),
    columns: lineNumbers.filter((column) => lineNumbers.every((row) => isFilled(row, column))),
  };
}

export function countFullLines(lines: FullLines): number {
  return lines.rows.length + lines.columns.length;
}
