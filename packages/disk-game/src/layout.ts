import { drawRandomItem, type RandomDraw, type RandomState } from '@local/seeded-random';
import { fewestMovesOf } from './fewest-moves.js';
import type { DiskSize, Pegs } from './game-state.js';
import { PEG_INDEXES } from './pegs.js';

// About 7 in 10 random layouts pass the reroll rule, so this many failures in a row means a bug.
const MAX_LAYOUT_ATTEMPTS = 1000;

export interface Layout {
  readonly pegs: Pegs;
  readonly fewestMoves: number;
}

/** A layout that needs fewer moves than this is thrown away as nearly sorted (DK-07). */
export function minimumFewestMoves(diskCount: number): number {
  return 2 ** (diskCount - 2);
}

/** Puts each disk on a random peg, largest first, so every peg is in order (DK-06). */
function drawAnyLayout(randomState: RandomState, diskCount: number): RandomDraw<Pegs> {
  const pegs: [DiskSize[], DiskSize[], DiskSize[]] = [[], [], []];
  let currentState = randomState;
  for (let disk = diskCount; disk >= 1; disk -= 1) {
    const pegDraw = drawRandomItem(currentState, PEG_INDEXES);
    pegs[pegDraw.value]?.push(disk);
    currentState = pegDraw.randomState;
  }
  return { value: pegs, randomState: currentState };
}

/** Draws random layouts until one is far enough from sorted (DK-06, DK-07). */
export function drawLayout(randomState: RandomState, diskCount: number): RandomDraw<Layout> {
  if (!Number.isSafeInteger(diskCount) || diskCount < 2) {
    throw new RangeError(`A layout needs 2 or more disks, got ${String(diskCount)}`);
  }
  let currentState = randomState;
  for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
    const pegsDraw = drawAnyLayout(currentState, diskCount);
    const fewestMoves = fewestMovesOf(pegsDraw.value);
    if (fewestMoves >= minimumFewestMoves(diskCount)) {
      return { value: { pegs: pegsDraw.value, fewestMoves }, randomState: pegsDraw.randomState };
    }
    currentState = pegsDraw.randomState;
  }
  throw new Error(
    `No layout of ${String(diskCount)} disks passed the reroll rule in ` +
      `${String(MAX_LAYOUT_ATTEMPTS)} attempts`,
  );
}
