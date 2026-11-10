import { isDigit, type Cell } from './cell.js';
import { countNumbers } from './board.js';
import {
  DIFFICULTY_PRESETS,
  isDifficultyId,
  type DifficultyId,
  type HintAllowance,
} from './difficulty.js';
import { BOARD_WIDTHS, isBoardWidth, type BoardWidth, type GameState } from './game-state.js';
import { isRandomState } from './random.js';

export class InvalidGameStateError extends Error {
  override readonly name = 'InvalidGameStateError';
}

const GAME_STATE_KEYS: readonly (keyof GameState)[] = [
  'width',
  'cells',
  'score',
  'stage',
  'difficulty',
  'addNumbersLeft',
  'hintsLeft',
  'randomState',
];

function fail(message: string): never {
  throw new InvalidGameStateError(`Invalid game state: ${message}`);
}

function isWholeNumberAtLeast(value: unknown, minimum: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;
}

function readRecord(value: unknown): ReadonlyMap<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail('expected an object');
  }
  return new Map<string, unknown>(Object.entries(value));
}

function readWidth(value: unknown): BoardWidth {
  if (!isBoardWidth(value)) {
    fail(`width must be one of ${BOARD_WIDTHS.join(', ')}`);
  }
  return value;
}

function readCells(value: unknown, width: BoardWidth): Cell[] {
  if (!Array.isArray(value)) {
    fail('cells must be an array');
  }
  const cells = value.map((cell: unknown, index): Cell => {
    if (cell !== null && !isDigit(cell)) {
      fail(`cell ${String(index)} must be null or a whole number from 1 to 9`);
    }
    return cell;
  });
  if (cells.length === 0 || cells.length % width !== 0) {
    fail(`cells must fill whole rows of ${String(width)}, got ${String(cells.length)} cells`);
  }
  for (let rowStart = 0; rowStart < cells.length; rowStart += width) {
    if (countNumbers(cells.slice(rowStart, rowStart + width)) === 0) {
      fail(`row ${String(rowStart / width + 1)} is empty and should have been removed`);
    }
  }
  return cells;
}

function readDifficulty(value: unknown): DifficultyId {
  if (!isDifficultyId(value)) {
    fail(`difficulty must be one of ${Object.keys(DIFFICULTY_PRESETS).join(', ')}`);
  }
  return value;
}

function readAddNumbersLeft(value: unknown, difficulty: DifficultyId): number {
  const maximum = DIFFICULTY_PRESETS[difficulty].addNumbersUsesPerStage;
  if (!isWholeNumberAtLeast(value, 0) || value > maximum) {
    fail(`addNumbersLeft must be a whole number from 0 to ${String(maximum)}`);
  }
  return value;
}

function readHintsLeft(value: unknown, difficulty: DifficultyId): HintAllowance {
  const hintsPerStage = DIFFICULTY_PRESETS[difficulty].hintsPerStage;
  if (hintsPerStage === 'unlimited') {
    if (value !== 'unlimited') {
      fail(`hintsLeft must be 'unlimited' on ${difficulty}`);
    }
    return value;
  }
  if (!isWholeNumberAtLeast(value, 0) || value > hintsPerStage) {
    fail(`hintsLeft must be a whole number from 0 to ${String(hintsPerStage)}`);
  }
  return value;
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

  const width = readWidth(record.get('width'));
  const cells = readCells(record.get('cells'), width);
  const score = record.get('score');
  if (!isWholeNumberAtLeast(score, 0)) {
    fail('score must be a whole number of 0 or more');
  }
  const stage = record.get('stage');
  if (!isWholeNumberAtLeast(stage, 1)) {
    fail('stage must be a whole number of 1 or more');
  }
  const difficulty = readDifficulty(record.get('difficulty'));
  const randomState = record.get('randomState');
  if (!isRandomState(randomState)) {
    fail('randomState must be a whole number from 0 to 4294967295');
  }

  return {
    width,
    cells,
    score,
    stage,
    difficulty,
    addNumbersLeft: readAddNumbersLeft(record.get('addNumbersLeft'), difficulty),
    hintsLeft: readHintsLeft(record.get('hintsLeft'), difficulty),
    randomState,
  };
}
