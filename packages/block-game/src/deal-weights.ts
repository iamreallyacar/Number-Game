import type { BlockShape } from './shape-catalogue.js';

/** Number of placed shapes after which every shape has reached its late weight (BG-10). */
export const WEIGHT_RAMP_PLACEMENTS = 200;

/**
 * The weight of a shape for dealing, moving in even steps from its starting weight to its late
 * weight. Whole number math only, so the browser and the server always agree. Weights of different
 * shapes are only comparable at the same number of placements, and the result is always a whole
 * number of 1 or more.
 */
export function dealWeightOf(
  shape: Pick<BlockShape, 'startingWeight' | 'lateWeight'>,
  shapesPlaced: number,
): number {
  const rampStep = Math.min(shapesPlaced, WEIGHT_RAMP_PLACEMENTS);
  return shape.startingWeight * (WEIGHT_RAMP_PLACEMENTS - rampStep) + shape.lateWeight * rampStep;
}
