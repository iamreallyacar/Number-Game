import { drawWeightedItem, type RandomDraw, type RandomState } from '@local/seeded-random';
import { dealWeightOf } from './deal-weights.js';
import { canPlaceWholeHand } from './fair-hand.js';
import type { BoardGrid, ShapeSlots } from './game-state.js';
import { SHAPE_CATALOGUE, type ShapeId } from './shape-catalogue.js';

export const MAX_FAIR_HAND_TRIES = 30;

/** Draws one shape by its deal weight at this point of the game. It never looks at the board (BG-10). */
export function drawShapeId(randomState: RandomState, shapesPlaced: number): RandomDraw<ShapeId> {
  const draw = drawWeightedItem(randomState, SHAPE_CATALOGUE, (shape) =>
    dealWeightOf(shape, shapesPlaced),
  );
  return { value: draw.value.id, randomState: draw.randomState };
}

type DrawnHand = readonly [ShapeId, ShapeId, ShapeId];

function drawHand(randomState: RandomState, shapesPlaced: number): RandomDraw<DrawnHand> {
  const first = drawShapeId(randomState, shapesPlaced);
  const second = drawShapeId(first.randomState, shapesPlaced);
  const third = drawShapeId(second.randomState, shapesPlaced);
  return { value: [first.value, second.value, third.value], randomState: third.randomState };
}

/**
 * Deals a whole hand of weighted shapes, for the first hand and for every later one (BG-04). The
 * board is the one after the last placement and its line clears. A hand that cannot be placed in
 * full is redrawn, up to `MAX_FAIR_HAND_TRIES` hands in total, and then three single cells are dealt
 * (BG-22, BG-23). The random state moves on through every draw.
 */
export function dealHand(
  randomState: RandomState,
  shapesPlaced: number,
  board: BoardGrid,
): RandomDraw<ShapeSlots> {
  let currentState = randomState;
  for (let attempt = 0; attempt < MAX_FAIR_HAND_TRIES; attempt++) {
    const hand = drawHand(currentState, shapesPlaced);
    currentState = hand.randomState;
    if (canPlaceWholeHand(board, hand.value)) {
      return hand;
    }
  }
  // Always fair: a board with no full line has an empty cell in every row, so at least 10 empty cells.
  return { value: ['single', 'single', 'single'], randomState: currentState };
}
