import type { BoardCell } from './board-cell.js';
import { BOARD_SIZE, type BoardGrid, type CellIndex } from './game-state.js';

export function cellIndexAt(row: number, column: number): CellIndex {
  return row * BOARD_SIZE + column;
}

export function rowOf(index: CellIndex): number {
  return Math.floor(index / BOARD_SIZE);
}

export function columnOf(index: CellIndex): number {
  return index % BOARD_SIZE;
}

export function createEmptyCells(): BoardCell[] {
  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (): BoardCell => null);
}

/** The full rows and full columns of a board, each list in increasing order. */
export interface FullLines {
  readonly rows: readonly number[];
  readonly columns: readonly number[];
}

export function findFullLines(board: BoardGrid): FullLines {
  const lineNumbers = [...Array(BOARD_SIZE).keys()];
  const isFilled = (row: number, column: number): boolean =>
    board.cells[cellIndexAt(row, column)] !== null;
  return {
    rows: lineNumbers.filter((row) => lineNumbers.every((column) => isFilled(row, column))),
    columns: lineNumbers.filter((column) => lineNumbers.every((row) => isFilled(row, column))),
  };
}

export function countFullLines(lines: FullLines): number {
  return lines.rows.length + lines.columns.length;
}
