import { describe, expect, it } from 'vitest';
import type { Pegs } from './game-state.js';
import {
  findPegMoveProblem,
  findSortedPeg,
  moveTopDisk,
  pegOfEachDisk,
  topDiskOf,
} from './pegs.js';

const PEGS: Pegs = [[4, 1], [3], []];

describe('pegs', () => {
  it('finds the top disk of a peg', () => {
    expect(topDiskOf([4, 1])).toBe(1);
    expect(topDiskOf([])).toBeNull();
  });

  it('finds which peg each disk is on', () => {
    expect(pegOfEachDisk([[4, 1], [3], [2]])).toEqual([0, 2, 1, 0]);
  });

  it('finds the sorted peg only when one peg holds every disk (DK-15)', () => {
    expect(findSortedPeg(PEGS)).toBeNull();
    expect(findSortedPeg([[], [3, 2, 1], []])).toBe(1);
    expect(findSortedPeg([[], [], [2, 1]])).toBe(2);
  });

  it('moves the top disk onto a larger disk or an empty peg (DK-08)', () => {
    expect(moveTopDisk(PEGS, { fromPeg: 0, toPeg: 1 })).toEqual([[4], [3, 1], []]);
    expect(moveTopDisk(PEGS, { fromPeg: 1, toPeg: 2 })).toEqual([[4, 1], [], [3]]);
    expect(PEGS).toEqual([[4, 1], [3], []]);
  });

  it.each([
    { move: { fromPeg: 1, toPeg: 0 }, problem: 'onto-smaller-disk' },
    { move: { fromPeg: 2, toPeg: 0 }, problem: 'empty-peg' },
    { move: { fromPeg: 0, toPeg: 0 }, problem: 'same-peg' },
    { move: { fromPeg: 0, toPeg: 3 }, problem: 'no-such-peg' },
    { move: { fromPeg: -1, toPeg: 1 }, problem: 'no-such-peg' },
    { move: { fromPeg: 0.5, toPeg: 1 }, problem: 'no-such-peg' },
  ])('refuses a move with the problem $problem (DK-10)', ({ move, problem }) => {
    expect(findPegMoveProblem(PEGS, move)).toBe(problem);
    expect(() => moveTopDisk(PEGS, move)).toThrow(problem);
  });
});
