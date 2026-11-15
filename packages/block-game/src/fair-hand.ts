import { BOARD_SIZE, type BoardGrid } from './game-state.js';
import { placeAndClearLines } from './place-and-clear.js';
import type { ShapeId } from './shape-catalogue.js';
import { shapeFitsAnywhere, shapeFitsAt } from './shape-fit.js';

/**
 * How many placements the search may try for one hand before it gives up and calls the hand not
 * fair (BG-22). A count and not a time limit, so the browser and the server always agree.
 */
export const MAX_FAIR_HAND_SEARCH_PLACEMENTS = 1000;

interface SearchBudget {
  placementsLeft: number;
}

function canPlaceRemainingShapes(
  board: BoardGrid,
  remainingShapeIds: readonly ShapeId[],
  budget: SearchBudget,
): boolean {
  const [firstShapeId] = remainingShapeIds;
  if (firstShapeId === undefined) {
    return true;
  }
  if (remainingShapeIds.length === 1) {
    return shapeFitsAnywhere(board, firstShapeId);
  }
  const triedShapeIds = new Set<ShapeId>();
  for (const [index, shapeId] of remainingShapeIds.entries()) {
    if (triedShapeIds.has(shapeId)) {
      continue;
    }
    triedShapeIds.add(shapeId);
    const shapeIdsAfterThis = remainingShapeIds.filter((_, otherIndex) => otherIndex !== index);
    for (let topRow = 0; topRow < BOARD_SIZE; topRow++) {
      for (let leftColumn = 0; leftColumn < BOARD_SIZE; leftColumn++) {
        if (!shapeFitsAt(board, shapeId, topRow, leftColumn)) {
          continue;
        }
        if (budget.placementsLeft === 0) {
          return false;
        }
        budget.placementsLeft -= 1;
        const placed = placeAndClearLines(board, shapeId, topRow, leftColumn);
        if (canPlaceRemainingShapes({ cells: placed.cells }, shapeIdsAfterThis, budget)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Whether a way was found to place every shape of the hand on the board in some order, with each
 * placement clearing its full lines before the next shape goes down (BG-22). True always means the
 * hand can be placed. False means it cannot, or that no way was found within
 * `MAX_FAIR_HAND_SEARCH_PLACEMENTS` tried placements.
 */
export function canPlaceWholeHand(board: BoardGrid, shapeIds: readonly ShapeId[]): boolean {
  return canPlaceRemainingShapes(board, shapeIds, {
    placementsLeft: MAX_FAIR_HAND_SEARCH_PLACEMENTS,
  });
}
