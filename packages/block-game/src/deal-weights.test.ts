import { describe, expect, it } from 'vitest';
import { dealWeightOf, WEIGHT_RAMP_PLACEMENTS } from './deal-weights.js';
import { getShape, SHAPE_CATALOGUE } from './shape-catalogue.js';

const SQUARE_3 = getShape('square-3');
const SINGLE = getShape('single');

describe('deal weights', () => {
  it('ramps over 200 placements', () => {
    expect(WEIGHT_RAMP_PLACEMENTS).toBe(200);
  });

  it('is the starting weights in exact proportion at 0 placements', () => {
    for (const shape of SHAPE_CATALOGUE) {
      expect(dealWeightOf(shape, 0)).toBe(shape.startingWeight * WEIGHT_RAMP_PLACEMENTS);
    }
  });

  it('is the late weights in exact proportion at 200 placements and beyond', () => {
    for (const shapesPlaced of [200, 201, 1000]) {
      for (const shape of SHAPE_CATALOGUE) {
        expect(dealWeightOf(shape, shapesPlaced)).toBe(shape.lateWeight * WEIGHT_RAMP_PLACEMENTS);
      }
    }
  });

  it('moves halfway at 100 placements', () => {
    // The 3 x 3 square goes from 1 to 4: 1 * 100 + 4 * 100. The single goes from 4 to 1: 4 * 100 + 1 * 100.
    expect(dealWeightOf(SQUARE_3, 100)).toBe(500);
    expect(dealWeightOf(SINGLE, 100)).toBe(500);
  });

  it('works out a quarter way value by hand', () => {
    // 50 placements: 1 * 150 + 4 * 50 = 350
    expect(dealWeightOf(SQUARE_3, 50)).toBe(350);
  });

  it('is always a whole number of 1 or more', () => {
    for (const shapesPlaced of [0, 1, 7, 99, 100, 150, 199, 200, 500]) {
      for (const shape of SHAPE_CATALOGUE) {
        const weight = dealWeightOf(shape, shapesPlaced);
        expect(Number.isInteger(weight)).toBe(true);
        expect(weight).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
