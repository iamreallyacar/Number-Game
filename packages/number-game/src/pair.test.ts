import { describe, expect, it } from 'vitest';
import { isPair, pairGroupsWithOddCount, pairPartners } from './pair.js';
import { cellsFromRows } from './test-support.js';

describe('isPair', () => {
  it('accepts equal numbers', () => {
    expect(isPair(4, 4)).toBe(true);
    expect(isPair(9, 9)).toBe(true);
  });

  it('accepts numbers that add up to 10', () => {
    expect(isPair(3, 7)).toBe(true);
    expect(isPair(9, 1)).toBe(true);
  });

  it('accepts 5 and 5', () => {
    expect(isPair(5, 5)).toBe(true);
  });

  it('rejects other numbers', () => {
    expect(isPair(3, 4)).toBe(false);
    expect(isPair(5, 6)).toBe(false);
  });
});

describe('pairPartners', () => {
  it('lists the equal number and the number adding up to 10', () => {
    expect(pairPartners(3)).toEqual([3, 7]);
    expect(pairPartners(5)).toEqual([5]);
  });
});

describe('pairGroupsWithOddCount', () => {
  it('finds nothing when every number can be paired off', () => {
    expect(pairGroupsWithOddCount(cellsFromRows(['19.28.3746', '55........']))).toEqual([]);
  });

  it('lists each pair group with an odd count of numbers', () => {
    expect(pairGroupsWithOddCount(cellsFromRows(['786668....']))).toEqual([
      [3, 7],
      [4, 6],
    ]);
    expect(pairGroupsWithOddCount(cellsFromRows(['5.........']))).toEqual([[5]]);
  });
});
