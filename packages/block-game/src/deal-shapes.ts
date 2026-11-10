import { drawWeightedItem, type RandomDraw, type RandomState } from '@local/seeded-random';
import type { ShapeSlots } from './game-state.js';
import { SHAPE_CATALOGUE, type ShapeId } from './shape-catalogue.js';

/** Draws one shape by its catalogue weight. It never looks at the board (BG-10). */
export function drawShapeId(randomState: RandomState): RandomDraw<ShapeId> {
  const draw = drawWeightedItem(randomState, SHAPE_CATALOGUE, (shape) => shape.weight);
  return { value: draw.value.id, randomState: draw.randomState };
}

export function dealStartingSlots(randomState: RandomState): RandomDraw<ShapeSlots> {
  const first = drawShapeId(randomState);
  const second = drawShapeId(first.randomState);
  const third = drawShapeId(second.randomState);
  return { value: [first.value, second.value, third.value], randomState: third.randomState };
}
