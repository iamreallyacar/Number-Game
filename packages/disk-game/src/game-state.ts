import type { RandomState } from '@local/seeded-random';

/** The board always has this many pegs (DK-01). */
export const PEG_COUNT = 3;

/** Position of a peg, counted from 0 at the left. */
export type PegIndex = number;

/** Size of a disk, where 1 is the smallest. No two disks in a stage share a size. */
export type DiskSize = number;

/** The disks on one peg, from the bottom to the top, so always from larger to smaller (DK-02). */
export type Peg = readonly DiskSize[];

export type Pegs = readonly [Peg, Peg, Peg];

/** Taking the top disk of one peg and putting it on top of another (DK-08). */
export interface PegMove {
  readonly fromPeg: PegIndex;
  readonly toPeg: PegIndex;
}

export const STARTING_DISK_COUNTS = [3, 4, 5] as const;
export type StartingDiskCount = (typeof STARTING_DISK_COUNTS)[number];

export function isStartingDiskCount(value: unknown): value is StartingDiskCount {
  return STARTING_DISK_COUNTS.some((diskCount) => diskCount === value);
}

/** Stages stop growing at this many disks (DK-05). */
export const MAX_DISK_COUNT = 10;

/** Each stage has one more disk than the one before, up to the maximum (DK-05). */
export function diskCountOfStage(startingDiskCount: StartingDiskCount, stage: number): number {
  return Math.min(startingDiskCount + stage - 1, MAX_DISK_COUNT);
}

/**
 * The full state of one Disk Game. It holds only plain JSON values, so
 * JSON.parse(JSON.stringify(state)) gives back an identical state.
 */
export interface GameState {
  readonly startingDiskCount: StartingDiskCount;
  /** Counted from 1. */
  readonly stage: number;
  /** Never a sorted layout, because sorting the disks starts the next stage right away. */
  readonly pegs: Pegs;
  readonly score: number;
  /** The move budget shared by every stage (DK-11, DK-16). */
  readonly movesLeft: number;
  /** Fewest moves of the layout this stage started with. */
  readonly stageFewestMoves: number;
  /** Disk moves made in this stage, counting each undo as a move, since it moves a disk back. */
  readonly stageMovesUsed: number;
  /** The moves of this stage that have not been undone, oldest first. Undo takes back the last. */
  readonly stageMoves: readonly PegMove[];
  /** True once an undo or a hint was used in this stage, which rules out a perfect stage. */
  readonly stageAssisted: boolean;
  readonly randomState: RandomState;
}
