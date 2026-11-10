import { describe, expect, it } from 'vitest';
import { isPair, pairPartners } from './pair.js';

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
