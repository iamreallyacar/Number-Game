import { isRandomState } from '@local/seeded-random';
import { countFullLines, findFullLines } from './board.js';
import { isShapeColour, type BoardCell } from './board-cell.js';
import { BOARD_SIZE, SLOT_COUNT, type GameState, type ShapeSlots } from './game-state.js';
import { isShapeId, type ShapeId } from './shape-catalogue.js';

export class InvalidGameStateError extends Error {
  override readonly name = 'InvalidGameStateError';
}

const GAME_STATE_KEYS: readonly (keyof GameState)[] = [
  'cells',
  'slots',
  'score',
  'streak',
  'linesCleared',
  'shapesPlaced',
  'randomState',
];

function fail(message: string): never {
  throw new InvalidGameStateError(`Invalid game state: ${message}`);
}

function readWholeNumberAtLeastZero(record: ReadonlyMap<string, unknown>, key: string): number {
  const value = record.get(key);
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    fail(`${key} must be a whole number of 0 or more`);
  }
  return value;
}

function readRecord(value: unknown): ReadonlyMap<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail('expected an object');
  }
  return new Map<string, unknown>(Object.entries(value));
}

function readCells(value: unknown): BoardCell[] {
  if (!Array.isArray(value)) {
    fail('cells must be an array');
  }
  const expectedCellCount = BOARD_SIZE * BOARD_SIZE;
  if (value.length !== expectedCellCount) {
    fail(`cells must hold ${String(expectedCellCount)} cells, got ${String(value.length)}`);
  }
  const cells = value.map((cell: unknown, index): BoardCell => {
    if (cell !== null && !isShapeColour(cell)) {
      fail(`cell ${String(index)} must be null or a shape colour`);
    }
    return cell;
  });
  if (countFullLines(findFullLines({ cells })) > 0) {
    fail('a full row or column should have been cleared');
  }
  return cells;
}

function readSlots(value: unknown): ShapeSlots {
  if (!Array.isArray(value) || value.length !== SLOT_COUNT) {
    fail(`slots must be a list of ${String(SLOT_COUNT)} shape ids or nulls`);
  }
  const slotValues: readonly unknown[] = value;
  const [first, second, third] = slotValues.map((slot): ShapeId | null => {
    if (slot !== null && !isShapeId(slot)) {
      fail('every slot must hold a known shape id or null');
    }
    return slot;
  });
  if (first === undefined || second === undefined || third === undefined) {
    fail(`slots must be a list of ${String(SLOT_COUNT)} shape ids or nulls`);
  }
  if (first === null && second === null && third === null) {
    fail('at least one slot must hold a shape, because a new hand is dealt when all are used');
  }
  return [first, second, third];
}

/**
 * Checks that a stored value is a well formed game state and returns it typed. Throws an
 * InvalidGameStateError naming the first problem found, so a broken save is never loaded.
 */
export function parseGameState(value: unknown): GameState {
  const record = readRecord(value);
  for (const key of record.keys()) {
    if (!GAME_STATE_KEYS.some((knownKey) => knownKey === key)) {
      fail(`unknown field '${key}'`);
    }
  }

  const cells = readCells(record.get('cells'));
  const slots = readSlots(record.get('slots'));
  const score = readWholeNumberAtLeastZero(record, 'score');
  const streak = readWholeNumberAtLeastZero(record, 'streak');
  const linesCleared = readWholeNumberAtLeastZero(record, 'linesCleared');
  const shapesPlaced = readWholeNumberAtLeastZero(record, 'shapesPlaced');
  if (streak > shapesPlaced) {
    fail('streak cannot be longer than the number of shapes placed');
  }
  const randomState = record.get('randomState');
  if (!isRandomState(randomState)) {
    fail('randomState must be a whole number from 0 to 4294967295');
  }

  return { cells, slots, score, streak, linesCleared, shapesPlaced, randomState };
}
