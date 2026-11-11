import { describe, expect, it } from 'vitest';
import { fewestMovesOf, findShortestPath } from './fewest-moves.js';
import type { PegIndex, PegMove, Pegs } from './game-state.js';
import { findPegMoveProblem, findSortedPeg, moveTopDisk, PEG_INDEXES } from './pegs.js';

function pegsFromPegOfEachDisk(pegByDisk: readonly PegIndex[]): Pegs {
  const pegs: [number[], number[], number[]] = [[], [], []];
  for (let disk = pegByDisk.length; disk >= 1; disk -= 1) {
    const pegIndex = pegByDisk[disk - 1];
    if (pegIndex !== undefined) {
      pegs[pegIndex]?.push(disk);
    }
  }
  return pegs;
}

function everyLayout(diskCount: number): Pegs[] {
  let pegChoices: PegIndex[][] = [[]];
  for (let disk = 0; disk < diskCount; disk += 1) {
    pegChoices = pegChoices.flatMap((choice) => PEG_INDEXES.map((peg) => [...choice, peg]));
  }
  return pegChoices.map(pegsFromPegOfEachDisk);
}

const EVERY_MOVE: readonly PegMove[] = PEG_INDEXES.flatMap((fromPeg) =>
  PEG_INDEXES.filter((toPeg) => toPeg !== fromPeg).map((toPeg) => ({ fromPeg, toPeg })),
);

/** Fewest moves of every layout, found by trying every move outwards from the sorted layouts. */
function searchFewestMoves(diskCount: number): Map<string, number> {
  const layouts = everyLayout(diskCount);
  let frontier = layouts.filter((pegs) => findSortedPeg(pegs) !== null);
  const fewestMovesByLayout = new Map(frontier.map((pegs) => [JSON.stringify(pegs), 0]));
  for (let distance = 1; frontier.length > 0; distance += 1) {
    const nextFrontier: Pegs[] = [];
    for (const pegs of frontier) {
      for (const move of EVERY_MOVE) {
        if (findPegMoveProblem(pegs, move) !== null) {
          continue;
        }
        const neighbour = moveTopDisk(pegs, move);
        const key = JSON.stringify(neighbour);
        if (!fewestMovesByLayout.has(key)) {
          fewestMovesByLayout.set(key, distance);
          nextFrontier.push(neighbour);
        }
      }
    }
    frontier = nextFrontier;
  }
  expect(fewestMovesByLayout.size).toBe(layouts.length);
  return fewestMovesByLayout;
}

describe('fewestMovesOf', () => {
  it('is 0 for a sorted layout on any peg', () => {
    expect(fewestMovesOf([[3, 2, 1], [], []])).toBe(0);
    expect(fewestMovesOf([[], [], [4, 3, 2, 1]])).toBe(0);
  });

  it('uses the closest peg', () => {
    // Gathering on the left peg takes 3 moves. The middle peg would take 5.
    expect(fewestMovesOf([[3], [2, 1], []])).toBe(3);
  });

  it('is at most 2^n - 1', () => {
    expect(Math.max(...everyLayout(5).map(fewestMovesOf))).toBeLessThanOrEqual(31);
  });

  it.each([1, 2, 3, 4, 5, 6])('matches a full search for every layout of %i disks', (diskCount) => {
    const searched = searchFewestMoves(diskCount);
    for (const pegs of everyLayout(diskCount)) {
      expect(fewestMovesOf(pegs), JSON.stringify(pegs)).toBe(searched.get(JSON.stringify(pegs)));
    }
  });
});

describe('findShortestPath', () => {
  it('has no next move for a sorted layout', () => {
    expect(findShortestPath([[], [2, 1], []])).toEqual({ fewestMoves: 0, nextMove: null });
  });

  it('gives the first move of the shortest path', () => {
    expect(findShortestPath([[3], [2, 1], []]).nextMove).toEqual({ fromPeg: 1, toPeg: 2 });
  });

  it.each([3, 4, 5])(
    'sorts every layout of %i disks in exactly the fewest moves when its moves are followed',
    (diskCount) => {
      for (const startPegs of everyLayout(diskCount)) {
        let pegs = startPegs;
        let movesMade = 0;
        for (let path = findShortestPath(pegs); path.nextMove !== null; movesMade += 1) {
          pegs = moveTopDisk(pegs, path.nextMove);
          const nextPath = findShortestPath(pegs);
          expect(nextPath.fewestMoves).toBe(path.fewestMoves - 1);
          path = nextPath;
        }
        expect(findSortedPeg(pegs)).not.toBeNull();
        expect(movesMade).toBe(fewestMovesOf(startPegs));
      }
    },
  );
});
