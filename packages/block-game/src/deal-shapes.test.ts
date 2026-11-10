import { createRandomState, type RandomState } from '@local/seeded-random';
import { describe, expect, it } from 'vitest';
import { dealStartingSlots, drawShapeId } from './deal-shapes.js';
import { SHAPE_IDS, type ShapeId } from './shape-catalogue.js';

function drawManyShapeIds(randomState: RandomState, count: number): ShapeId[] {
  const shapeIds: ShapeId[] = [];
  let currentState = randomState;
  for (let drawn = 0; drawn < count; drawn++) {
    const draw = drawShapeId(currentState);
    shapeIds.push(draw.value);
    currentState = draw.randomState;
  }
  return shapeIds;
}

describe('dealing shapes', () => {
  it('deals the same shapes from the same state', () => {
    const state = createRandomState(21);
    expect(drawManyShapeIds(state, 30)).toEqual(drawManyShapeIds(state, 30));
    expect(dealStartingSlots(state)).toEqual(dealStartingSlots(state));
  });

  it('deals three slots and moves the random state on', () => {
    const state = createRandomState(4);
    const deal = dealStartingSlots(state);
    expect(deal.value).toHaveLength(3);
    expect(deal.randomState).not.toBe(state);
  });

  it('can deal every shape, and deals common shapes more often than awkward ones', () => {
    const shapeIds = drawManyShapeIds(createRandomState(99), 20000);
    expect(new Set(shapeIds)).toEqual(new Set(SHAPE_IDS));
    const countOf = (shapeId: ShapeId): number => shapeIds.filter((id) => id === shapeId).length;
    expect(countOf('square-2')).toBeGreaterThan(countOf('square-3') * 3);
    expect(countOf('single')).toBeGreaterThan(countOf('diagonal-3-down') * 2);
  });
});
