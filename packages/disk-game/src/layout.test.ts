import { createRandomState } from '@local/seeded-random';
import { describe, expect, it } from 'vitest';
import { fewestMovesOf } from './fewest-moves.js';
import { drawLayout, minimumFewestMoves } from './layout.js';

describe('minimumFewestMoves', () => {
  it('is 2 to the power of n - 2 (DK-07)', () => {
    expect(minimumFewestMoves(3)).toBe(2);
    expect(minimumFewestMoves(10)).toBe(256);
  });
});

describe('drawLayout', () => {
  it.each([3, 4, 5, 6, 7, 8, 9, 10])(
    'deals %i disks in order on the pegs and far enough from sorted (DK-02, DK-06, DK-07)',
    (diskCount) => {
      for (let seed = 0; seed < 100; seed += 1) {
        const { pegs, fewestMoves } = drawLayout(createRandomState(seed), diskCount).value;
        const everyDisk = Array.from({ length: diskCount }, (_, index) => index + 1);
        expect(pegs.flat().sort((first, second) => first - second)).toEqual(everyDisk);
        for (const peg of pegs) {
          expect(peg).toEqual([...peg].sort((first, second) => second - first));
        }
        expect(fewestMoves).toBe(fewestMovesOf(pegs));
        expect(fewestMoves).toBeGreaterThanOrEqual(minimumFewestMoves(diskCount));
      }
    },
  );

  it('deals the same layout from the same random state', () => {
    expect(drawLayout(createRandomState(7), 6)).toEqual(drawLayout(createRandomState(7), 6));
  });

  it('moves the random state on, so the next stage gets another layout', () => {
    const first = drawLayout(createRandomState(7), 6);
    expect(first.randomState).not.toBe(createRandomState(7));
  });

  it('refuses a disk count that cannot make a layout', () => {
    expect(() => drawLayout(createRandomState(1), 1)).toThrow('2 or more disks');
  });
});
