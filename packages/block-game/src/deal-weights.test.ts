import { describe, expect, it } from 'vitest';
import { dealWeightOf, WEIGHT_RAMP_PLACEMENTS } from './deal-weights.js';
import { getShape, SHAPE_CATALOGUE } from './shape-catalogue.js';

const SQUARE_3 = getShape('square-3');
const SINGLE = getShape('single');

// Copied from the BG-09 table, one row per orientation, so a changed weight fails here.
const BG_09_WEIGHTS: readonly (readonly [string, number, number])[] = [
  ['single', 4, 1],
  ['line-2-horizontal', 5, 1],
  ['line-2-vertical', 5, 1],
  ['line-3-horizontal', 5, 2],
  ['line-3-vertical', 5, 2],
  ['line-4-horizontal', 2, 3],
  ['line-4-vertical', 2, 3],
  ['line-5-horizontal', 1, 4],
  ['line-5-vertical', 1, 4],
  ['square-2', 6, 2],
  ['square-3', 1, 4],
  ['square-4', 1, 3],
  ['rectangle-3-wide', 2, 4],
  ['rectangle-3-tall', 2, 4],
  ['corner-small-top-left', 4, 1],
  ['corner-small-top-right', 4, 1],
  ['corner-small-bottom-left', 4, 1],
  ['corner-small-bottom-right', 4, 1],
  ['corner-big-top-left', 1, 4],
  ['corner-big-top-right', 1, 4],
  ['corner-big-bottom-left', 1, 4],
  ['corner-big-bottom-right', 1, 4],
  ['l-tall-left-foot-right', 2, 2],
  ['l-tall-right-foot-left', 2, 2],
  ['l-tall-left-top-right', 2, 2],
  ['l-tall-right-top-left', 2, 2],
  ['l-wide-top-foot-left', 2, 2],
  ['l-wide-top-foot-right', 2, 2],
  ['l-wide-bottom-foot-left', 2, 2],
  ['l-wide-bottom-foot-right', 2, 2],
  ['t-up', 2, 2],
  ['t-down', 2, 2],
  ['t-left', 2, 2],
  ['t-right', 2, 2],
  ['t-big-down', 1, 3],
  ['t-big-up', 1, 3],
  ['t-big-right', 1, 3],
  ['t-big-left', 1, 3],
  ['u-open-up', 1, 3],
  ['u-open-down', 1, 3],
  ['u-open-right', 1, 3],
  ['u-open-left', 1, 3],
  ['s-wide', 2, 3],
  ['s-tall', 2, 3],
  ['z-wide', 2, 3],
  ['z-tall', 2, 3],
  ['diagonal-2-down', 1, 2],
  ['diagonal-2-up', 1, 2],
  ['diagonal-3-down', 1, 4],
  ['diagonal-3-up', 1, 4],
  ['plus', 1, 4],
];

describe('deal weights', () => {
  it('lists every catalogue shape in the BG-09 table', () => {
    expect(BG_09_WEIGHTS.map(([id]) => id).sort()).toEqual(SHAPE_CATALOGUE.map((s) => s.id).sort());
  });

  it.each(BG_09_WEIGHTS)(
    'shape %s has starting weight %i and late weight %i',
    (id, starting, late) => {
      const shape = SHAPE_CATALOGUE.find((candidate) => candidate.id === id);
      expect(shape?.startingWeight).toBe(starting);
      expect(shape?.lateWeight).toBe(late);
    },
  );

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
