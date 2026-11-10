import { DIGITS, type Cell, type Digit } from './cell.js';
import type { CellIndex } from './game-state.js';

export function rowOf(index: CellIndex, width: number): number {
  return Math.floor(index / width);
}

export function columnOf(index: CellIndex, width: number): number {
  return index % width;
}

export function countNumbers(cells: readonly Cell[]): number {
  return cells.filter((cell) => cell !== null).length;
}

/** The numbers from 1 to 9 that are on the board at least once, from smallest to largest. */
export function digitsOnBoard(cells: readonly Cell[]): Digit[] {
  return DIGITS.filter((digit) => cells.includes(digit));
}

/** Adds empty cells to the end so the board is a whole number of rows. */
export function padToFullRows(cells: readonly Cell[], width: number): Cell[] {
  const missingCells = (width - (cells.length % width)) % width;
  return [...cells, ...Array<Cell>(missingCells).fill(null)];
}

export interface RowRemovalResult {
  readonly cells: Cell[];
  readonly removedRowCount: number;
}

/** Removes every fully empty row. Rows below move up, and cells never slide sideways. */
export function removeEmptyRows(cells: readonly Cell[], width: number): RowRemovalResult {
  const keptCells: Cell[] = [];
  let removedRowCount = 0;
  for (let rowStart = 0; rowStart < cells.length; rowStart += width) {
    const row = cells.slice(rowStart, rowStart + width);
    if (row.every((cell) => cell === null)) {
      removedRowCount++;
    } else {
      keptCells.push(...row);
    }
  }
  return { cells: keptCells, removedRowCount };
}
