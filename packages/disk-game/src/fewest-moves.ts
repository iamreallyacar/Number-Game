import type { PegIndex, PegMove, Pegs } from './game-state.js';
import { PEG_INDEXES, pegOfEachDisk } from './pegs.js';

// The three peg indexes add up to this, so the third peg is this minus the other two.
const PEG_INDEX_TOTAL = PEG_INDEXES.reduce((total, pegIndex) => total + pegIndex, 0);

export interface ShortestPath {
  /** The smallest number of moves that gets every disk onto one peg. 0 for a sorted layout. */
  readonly fewestMoves: number;
  /** The first move of that path, or null for a sorted layout. */
  readonly nextMove: PegMove | null;
}

/**
 * The shortest way to gather every disk on one given peg. It works from the largest disk down. A
 * disk already on its goal peg stays. Any other disk must move there once, which first needs
 * every smaller disk out of the way on the third peg, and that becomes the goal of the smaller
 * disks. Moving disk k and then stacking the k - 1 smaller disks back on it takes 2^(k-1) moves.
 */
function findShortestPathToPeg(pegByDisk: readonly PegIndex[], targetPeg: PegIndex): ShortestPath {
  let goalPeg = targetPeg;
  let fewestMoves = 0;
  let nextMove: PegMove | null = null;
  for (let disk = pegByDisk.length; disk >= 1; disk -= 1) {
    const pegOfDisk = pegByDisk[disk - 1];
    if (pegOfDisk === undefined) {
      throw new Error(`Disk ${String(disk)} is missing from the pegs`);
    }
    if (pegOfDisk !== goalPeg) {
      fewestMoves += 2 ** (disk - 1);
      // The smallest disk that is out of place is the one that can and must move first.
      nextMove = { fromPeg: pegOfDisk, toPeg: goalPeg };
      goalPeg = PEG_INDEX_TOTAL - pegOfDisk - goalPeg;
    }
  }
  return { fewestMoves, nextMove };
}

/** The shortest path to a sorted layout, using whichever peg is quickest. Ties go to the left. */
export function findShortestPath(pegs: Pegs): ShortestPath {
  const pegByDisk = pegOfEachDisk(pegs);
  return PEG_INDEXES.map((targetPeg) => findShortestPathToPeg(pegByDisk, targetPeg)).reduce(
    (shortest, path) => (path.fewestMoves < shortest.fewestMoves ? path : shortest),
  );
}

export function fewestMovesOf(pegs: Pegs): number {
  return findShortestPath(pegs).fewestMoves;
}
