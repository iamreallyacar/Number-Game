import { describe, expect, it } from 'vitest';
import { DIGITS } from './cell.js';
import {
  createRandomState,
  drawRandomDigits,
  drawRandomFraction,
  isRandomState,
} from './random.js';

describe('seeded random numbers', () => {
  it('draws the same numbers from the same state', () => {
    const state = createRandomState(42);
    expect(drawRandomDigits(state, 50, DIGITS)).toEqual(drawRandomDigits(state, 50, DIGITS));
  });

  it('draws different numbers from different seeds', () => {
    const first = drawRandomDigits(createRandomState(1), 50, DIGITS).value;
    const second = drawRandomDigits(createRandomState(2), 50, DIGITS).value;
    expect(first).not.toEqual(second);
  });

  it('continues the same sequence when resumed from a stored state', () => {
    const allAtOnce = drawRandomDigits(createRandomState(7), 20, DIGITS).value;
    const firstHalf = drawRandomDigits(createRandomState(7), 10, DIGITS);
    const secondHalf = drawRandomDigits(firstHalf.randomState, 10, DIGITS);
    expect([...firstHalf.value, ...secondHalf.value]).toEqual(allAtOnce);
  });

  it('draws every number from 1 to 9 and nothing else', () => {
    const digits = drawRandomDigits(createRandomState(3), 2000, DIGITS).value;
    expect(new Set(digits)).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  });

  it('keeps fractions in [0, 1) and states valid', () => {
    let state = createRandomState(-5);
    for (let drawCount = 0; drawCount < 1000; drawCount++) {
      const draw = drawRandomFraction(state);
      expect(draw.value).toBeGreaterThanOrEqual(0);
      expect(draw.value).toBeLessThan(1);
      expect(isRandomState(draw.randomState)).toBe(true);
      state = draw.randomState;
    }
  });

  it('rejects a seed that is not a whole number', () => {
    expect(() => createRandomState(1.5)).toThrow(RangeError);
    expect(() => createRandomState(Number.NaN)).toThrow(RangeError);
  });

  it('draws only the allowed numbers', () => {
    const digits = drawRandomDigits(createRandomState(3), 500, [2, 8]).value;
    expect(new Set(digits)).toEqual(new Set([2, 8]));
  });
});
