import { countFullLines } from './board.js';
import { dealHand } from './deal-shapes.js';
import { isGameOver } from './game-over.js';
import type { CellIndex, GameState, ShapeSlots } from './game-state.js';
import { lineClearPoints, placementPoints } from './scoring.js';
import { placeAndClearLines } from './place-and-clear.js';
import { coveredCellIndexes, findFitProblem, type FitRefusal } from './shape-fit.js';

export type PlacementRefusal = 'game-over' | 'slot-out-of-range' | 'slot-empty' | FitRefusal;

export type PlacementResult =
  | {
      readonly accepted: true;
      readonly state: GameState;
      /** Cells the shape filled, before any lines were cleared. */
      readonly placedCellIndexes: readonly CellIndex[];
      /** Full rows that were cleared, in increasing order. */
      readonly clearedRows: readonly number[];
      /** Full columns that were cleared, in increasing order. */
      readonly clearedColumns: readonly number[];
      /** Every cell emptied by the cleared lines, once each, in increasing order. */
      readonly clearedCellIndexes: readonly CellIndex[];
      /** Placement points plus line points. */
      readonly pointsEarned: number;
    }
  | { readonly accepted: false; readonly reason: PlacementRefusal };

function emptySlot(slots: ShapeSlots, slotIndex: number): ShapeSlots {
  const [first, second, third] = slots;
  return [
    slotIndex === 0 ? null : first,
    slotIndex === 1 ? null : second,
    slotIndex === 2 ? null : third,
  ];
}

function isHandUsedUp(slots: ShapeSlots): boolean {
  return slots.every((shapeId) => shapeId === null);
}

/**
 * Places the shape from one slot with the top-left of its bounding box at the given row and
 * column, clears every full row and column, and adds the points. The slot is left empty, and a new
 * hand is dealt once all three are empty (BG-04, BG-05, BG-06, BG-11 to BG-16).
 */
export function applyPlacement(
  state: GameState,
  slotIndex: number,
  topRow: number,
  leftColumn: number,
): PlacementResult {
  if (isGameOver(state)) {
    return { accepted: false, reason: 'game-over' };
  }
  const shapeId = Number.isInteger(slotIndex) ? state.slots[slotIndex] : undefined;
  if (shapeId === undefined) {
    return { accepted: false, reason: 'slot-out-of-range' };
  }
  if (shapeId === null) {
    return { accepted: false, reason: 'slot-empty' };
  }
  const fitProblem = findFitProblem(state, shapeId, topRow, leftColumn);
  if (fitProblem !== null) {
    return { accepted: false, reason: fitProblem };
  }

  const placedCellIndexes = coveredCellIndexes(state, shapeId, topRow, leftColumn);
  const { cells, fullLines, clearedCellIndexes } = placeAndClearLines(
    state,
    shapeId,
    topRow,
    leftColumn,
  );
  const clearedLineCount = countFullLines(fullLines);

  const streak = clearedLineCount > 0 ? state.streak + 1 : 0;
  const pointsEarned =
    placementPoints(placedCellIndexes.length) + lineClearPoints(clearedLineCount, streak);
  const slotsAfterPlacement = emptySlot(state.slots, slotIndex);
  const shapesPlaced = state.shapesPlaced + 1;
  const nextHand = isHandUsedUp(slotsAfterPlacement)
    ? dealHand(state.randomState, shapesPlaced, { cells })
    : null;
  return {
    accepted: true,
    state: {
      ...state,
      cells,
      slots: nextHand === null ? slotsAfterPlacement : nextHand.value,
      score: state.score + pointsEarned,
      streak,
      linesCleared: state.linesCleared + clearedLineCount,
      shapesPlaced,
      randomState: nextHand === null ? state.randomState : nextHand.randomState,
    },
    placedCellIndexes,
    clearedRows: fullLines.rows,
    clearedColumns: fullLines.columns,
    clearedCellIndexes,
    pointsEarned,
  };
}
