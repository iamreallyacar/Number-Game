import { isRandomState } from '@local/seeded-random';
import { fewestMovesOf } from './fewest-moves.js';
import {
  diskCountOfStage,
  isStartingDiskCount,
  PEG_COUNT,
  STARTING_DISK_COUNTS,
  type DiskSize,
  type GameState,
  type Peg,
  type PegMove,
  type Pegs,
} from './game-state.js';
import { minimumFewestMoves } from './layout.js';
import { findPegMoveProblem, findSortedPeg, isPegIndex, moveTopDisk } from './pegs.js';

export class InvalidGameStateError extends Error {
  override readonly name = 'InvalidGameStateError';
}

const GAME_STATE_KEYS: readonly (keyof GameState)[] = [
  'startingDiskCount',
  'stage',
  'pegs',
  'score',
  'movesLeft',
  'stageFewestMoves',
  'stageMovesUsed',
  'stageMoves',
  'stageAssisted',
  'randomState',
];

function fail(message: string): never {
  throw new InvalidGameStateError(`Invalid game state: ${message}`);
}

function readRecord(value: unknown): ReadonlyMap<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail('expected an object');
  }
  return new Map<string, unknown>(Object.entries(value));
}

function readWholeNumberAtLeast(
  record: ReadonlyMap<string, unknown>,
  key: string,
  minimum: number,
): number {
  const value = record.get(key);
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) {
    fail(`${key} must be a whole number of ${String(minimum)} or more`);
  }
  return value;
}

function readPeg(value: unknown, pegIndex: number, diskCount: number): Peg {
  if (!Array.isArray(value)) {
    fail(`peg ${String(pegIndex)} must be a list of disks`);
  }
  const disks = value.map((disk: unknown): DiskSize => {
    if (typeof disk !== 'number' || !Number.isSafeInteger(disk) || disk < 1 || disk > diskCount) {
      fail(`peg ${String(pegIndex)} must hold disk sizes from 1 to ${String(diskCount)}`);
    }
    return disk;
  });
  disks.forEach((disk, height) => {
    const diskBelow = disks[height - 1];
    if (diskBelow !== undefined && diskBelow <= disk) {
      fail(`peg ${String(pegIndex)} has a disk on top of a smaller or equal disk`);
    }
  });
  return disks;
}

function readPegs(value: unknown, diskCount: number): Pegs {
  if (!Array.isArray(value) || value.length !== PEG_COUNT) {
    fail(`pegs must be a list of ${String(PEG_COUNT)} pegs`);
  }
  const pegValues: readonly unknown[] = value;
  const [first, second, third] = pegValues;
  const pegs: Pegs = [
    readPeg(first, 0, diskCount),
    readPeg(second, 1, diskCount),
    readPeg(third, 2, diskCount),
  ];
  // Each peg is strictly ordered, so the right number of disks with no repeats means every size
  // from 1 to the disk count is there exactly once.
  const disks = pegs.flat();
  if (disks.length !== diskCount || new Set(disks).size !== diskCount) {
    fail(`pegs must hold each disk from 1 to ${String(diskCount)} exactly once`);
  }
  if (findSortedPeg(pegs) !== null) {
    fail('a sorted layout should have started the next stage');
  }
  return pegs;
}

function readStageMoves(value: unknown): PegMove[] {
  if (!Array.isArray(value)) {
    fail('stageMoves must be a list of moves');
  }
  return value.map((move: unknown, index): PegMove => {
    const record = readRecord(move);
    const fromPeg = record.get('fromPeg');
    const toPeg = record.get('toPeg');
    if (record.size !== 2 || !isPegIndex(fromPeg) || !isPegIndex(toPeg)) {
      fail(`stage move ${String(index)} must have only a fromPeg and a toPeg from 0 to 2`);
    }
    return { fromPeg, toPeg };
  });
}

/** Takes the stage moves back one by one, which fails if they could not have led to these pegs. */
function findStageStartPegs(pegs: Pegs, stageMoves: readonly PegMove[]): Pegs {
  return stageMoves.reduceRight((pegsAfterMove, move, index) => {
    const reversedMove = { fromPeg: move.toPeg, toPeg: move.fromPeg };
    if (findPegMoveProblem(pegsAfterMove, reversedMove) !== null) {
      fail(`stage move ${String(index)} could not have been made`);
    }
    return moveTopDisk(pegsAfterMove, reversedMove);
  }, pegs);
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

  const startingDiskCount = record.get('startingDiskCount');
  if (!isStartingDiskCount(startingDiskCount)) {
    fail(`startingDiskCount must be one of ${STARTING_DISK_COUNTS.join(', ')}`);
  }
  const stage = readWholeNumberAtLeast(record, 'stage', 1);
  const diskCount = diskCountOfStage(startingDiskCount, stage);
  const pegs = readPegs(record.get('pegs'), diskCount);
  const score = readWholeNumberAtLeast(record, 'score', 0);
  const movesLeft = readWholeNumberAtLeast(record, 'movesLeft', 0);
  const stageFewestMoves = readWholeNumberAtLeast(
    record,
    'stageFewestMoves',
    minimumFewestMoves(diskCount),
  );
  const stageMovesUsed = readWholeNumberAtLeast(record, 'stageMovesUsed', 0);
  const stageMoves = readStageMoves(record.get('stageMoves'));
  const stageAssisted = record.get('stageAssisted');
  if (typeof stageAssisted !== 'boolean') {
    fail('stageAssisted must be true or false');
  }
  // Each undo adds 1 to the moves used and takes 1 move off the list, so the gap is 2 per undo.
  const undoCount = (stageMovesUsed - stageMoves.length) / 2;
  if (!Number.isSafeInteger(undoCount) || undoCount < 0) {
    fail('stageMovesUsed does not fit the number of stage moves');
  }
  if (undoCount > 0 && !stageAssisted) {
    fail('stageAssisted must be true after an undo');
  }
  if (fewestMovesOf(findStageStartPegs(pegs, stageMoves)) !== stageFewestMoves) {
    fail('stageFewestMoves does not match the layout the stage started with');
  }
  const randomState = record.get('randomState');
  if (!isRandomState(randomState)) {
    fail('randomState must be a whole number from 0 to 4294967295');
  }

  return {
    startingDiskCount,
    stage,
    pegs,
    score,
    movesLeft,
    stageFewestMoves,
    stageMovesUsed,
    stageMoves,
    stageAssisted,
    randomState,
  };
}
