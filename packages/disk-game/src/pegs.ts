import {
  PEG_COUNT,
  type DiskSize,
  type Peg,
  type PegIndex,
  type PegMove,
  type Pegs,
} from './game-state.js';

export const PEG_INDEXES: readonly PegIndex[] = Array.from(
  { length: PEG_COUNT },
  (_, pegIndex) => pegIndex,
);

export function isPegIndex(value: unknown): value is PegIndex {
  return PEG_INDEXES.some((pegIndex) => pegIndex === value);
}

export function pegAt(pegs: Pegs, pegIndex: PegIndex): Peg {
  const peg = pegs[pegIndex];
  if (peg === undefined) {
    throw new RangeError(`There is no peg ${String(pegIndex)}`);
  }
  return peg;
}

/** The only disk of a peg that can be moved, or null for an empty peg. */
export function topDiskOf(peg: Peg): DiskSize | null {
  return peg.at(-1) ?? null;
}

export function countDisks(pegs: Pegs): number {
  return pegs.reduce((diskCount, peg) => diskCount + peg.length, 0);
}

/** The peg that holds every disk, or null while the disks are spread out (DK-15). */
export function findSortedPeg(pegs: Pegs): PegIndex | null {
  const sortedPegIndex = pegs.findIndex((peg) => peg.length === countDisks(pegs));
  return sortedPegIndex === -1 ? null : sortedPegIndex;
}

/** Which peg each disk is on. Entry 0 is disk 1, the smallest. */
export function pegOfEachDisk(pegs: Pegs): PegIndex[] {
  const pegByDisk: PegIndex[] = [];
  pegs.forEach((peg, pegIndex) => {
    for (const disk of peg) {
      pegByDisk[disk - 1] = pegIndex;
    }
  });
  return pegByDisk;
}

export type PegMoveProblem = 'no-such-peg' | 'same-peg' | 'empty-peg' | 'onto-smaller-disk';

/** Why a move is not allowed on these pegs, or null when it is (DK-08, DK-10). */
export function findPegMoveProblem(pegs: Pegs, move: PegMove): PegMoveProblem | null {
  if (!isPegIndex(move.fromPeg) || !isPegIndex(move.toPeg)) {
    return 'no-such-peg';
  }
  if (move.fromPeg === move.toPeg) {
    return 'same-peg';
  }
  const movedDisk = topDiskOf(pegAt(pegs, move.fromPeg));
  if (movedDisk === null) {
    return 'empty-peg';
  }
  const coveredDisk = topDiskOf(pegAt(pegs, move.toPeg));
  if (coveredDisk !== null && coveredDisk < movedDisk) {
    return 'onto-smaller-disk';
  }
  return null;
}

/** The pegs after an allowed move. Throws for a move that `findPegMoveProblem` would refuse. */
export function moveTopDisk(pegs: Pegs, move: PegMove): Pegs {
  const problem = findPegMoveProblem(pegs, move);
  if (problem !== null) {
    throw new Error(
      `Cannot move a disk from peg ${String(move.fromPeg)} to peg ${String(move.toPeg)}: ${problem}`,
    );
  }
  const movedDisk = topDiskOf(pegAt(pegs, move.fromPeg));
  if (movedDisk === null) {
    throw new Error('An allowed move always has a disk to move');
  }
  const pegAfterMove = (pegIndex: PegIndex): Peg => {
    const peg = pegAt(pegs, pegIndex);
    if (pegIndex === move.fromPeg) {
      return peg.slice(0, -1);
    }
    return pegIndex === move.toPeg ? [...peg, movedDisk] : peg;
  };
  return [pegAfterMove(0), pegAfterMove(1), pegAfterMove(2)];
}
