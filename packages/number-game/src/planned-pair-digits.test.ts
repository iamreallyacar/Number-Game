import { describe, expect, it } from 'vitest';
import { DIGITS } from './cell.js';
import { findAllValidPairs } from './find-pair.js';
import { isPair, pairGroupNumberOf, pairGroupsWithOddCount } from './pair.js';
import { assignPlannedPairDigits } from './planned-pair-digits.js';
import { countPlannedPairsOpenAtStart, planSolution } from './solution-plan.js';

describe('assignPlannedPairDigits', () => {
  it('gives both cells of every planned pair numbers that pair, and fills the whole board', () => {
    for (let seed = 0; seed < 20; seed++) {
      const plan = planSolution(10, 0.8, seed).value;
      const { value: cells } = assignPlannedPairDigits(10, plan, 0, seed);
      for (const { firstIndex, secondIndex } of plan) {
        const first = cells[firstIndex];
        const second = cells[secondIndex];
        expect(
          first !== null && second !== null && first !== undefined && second !== undefined,
        ).toBe(true);
        expect(
          first !== null && second !== null && first !== undefined && second !== undefined
            ? isPair(first, second)
            : false,
        ).toBe(true);
      }
      expect(cells).toHaveLength(100);
      expect(cells.every((cell) => cell !== null)).toBe(true);
      expect(pairGroupsWithOddCount(cells)).toEqual([]);
    }
  });

  it('uses every number from 1 to 9 and does not let one pair group dominate', () => {
    for (let seed = 0; seed < 20; seed++) {
      const plan = planSolution(10, 0.9, seed).value;
      const { value: cells } = assignPlannedPairDigits(10, plan, 0, seed);
      expect(new Set(cells)).toEqual(new Set(DIGITS));
      const pairsPerGroup = plan.map((pair) => {
        const digit = cells[pair.firstIndex];
        return digit === null || digit === undefined ? 0 : pairGroupNumberOf(digit);
      });
      for (const group of [1, 2, 3, 4, 5]) {
        expect(pairsPerGroup.filter((planned) => planned === group).length).toBeLessThanOrEqual(15);
      }
    }
  });

  it('keeps two planned pairs that see each other in different pair groups when it can', () => {
    const plan = [
      { firstIndex: 0, secondIndex: 3 },
      { firstIndex: 1, secondIndex: 2 },
    ];
    for (let seed = 0; seed < 20; seed++) {
      const { value: cells } = assignPlannedPairDigits(2, plan, 0, seed);
      expect(findAllValidPairs(cells, 2)).toHaveLength(2);
    }
  });

  it('leaves no more unplanned pairs than allowed, and stops searching once the allowance is met', () => {
    const countUnplannedPairs = (allowedUnplannedPairCount: number, seed: number): number => {
      const plan = planSolution(10, 1, seed).value;
      const { value: cells } = assignPlannedPairDigits(10, plan, allowedUnplannedPairCount, seed);
      return findAllValidPairs(cells, 10).length - countPlannedPairsOpenAtStart(10, plan);
    };
    const seeds = Array.from({ length: 20 }, (_, seed) => seed);
    for (const seed of seeds) {
      expect(countUnplannedPairs(6, seed)).toBeLessThanOrEqual(6);
    }
    const totalWithoutAllowance = seeds.reduce(
      (total, seed) => total + countUnplannedPairs(0, seed),
      0,
    );
    const totalWithAllowance = seeds.reduce(
      (total, seed) => total + countUnplannedPairs(10, seed),
      0,
    );
    expect(totalWithAllowance).toBeGreaterThan(totalWithoutAllowance);
  });

  it('returns the same cells from the same random state', () => {
    const plan = planSolution(10, 0.9, 3).value;
    expect(assignPlannedPairDigits(10, plan, 0, 3)).toEqual(
      assignPlannedPairDigits(10, plan, 0, 3),
    );
  });
});
