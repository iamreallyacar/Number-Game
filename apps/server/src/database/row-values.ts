import type { SQLOutputValue } from 'node:sqlite';

type Row = Record<string, SQLOutputValue>;

// node:sqlite returns loosely typed rows. These readers check each column so a schema mismatch
// fails loudly instead of passing a wrong type further into the server.

export function readTextColumn(row: Row, column: string): string {
  const value = row[column];
  if (typeof value !== 'string') {
    throw new TypeError(`Expected column '${column}' to hold text, got ${typeof value}`);
  }
  return value;
}

export function readIntegerColumn(row: Row, column: string): number {
  const value = row[column];
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new TypeError(`Expected column '${column}' to hold a whole number, got ${typeof value}`);
  }
  return value;
}

export function readChangedRowCount(result: { changes: number | bigint }): number {
  return Number(result.changes);
}
