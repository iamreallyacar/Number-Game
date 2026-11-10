import { cellIndexAt, countFullLines, findFullLines } from './board.js';
import type { BoardCell } from './board-cell.js';
import { drawShapeId } from './deal-shapes.js';
import { isGameOver } from './game-over.js';
import type { CellIndex, GameState, ShapeSlots } from './game-state.js';
import { lineClearPoints, placementPoints } from './scoring.js';
import type { ShapeId } from './shape-catalogue.js';
import { coveredCellIndexes, fillShape, findFitProblem, type FitRefusal } from './shape-fit.js';

export type PlacementRefusal = 'game-over' | 'slot-out-of-range' | FitRefusal;

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

function replaceSlot(slots: ShapeSlots, slotIndex: number, shapeId: ShapeId): ShapeSlots {
  const [first, second, third] = slots;
  return [
    slotIndex === 0 ? shapeId : first,
    slotIndex === 1 ? shapeId : second,
    slotIndex === 2 ? shapeId : third,
  ];
}

/**
 * Places the shape from one slot with the top-left of its bounding box at the given row and
 * column, clears every full row and column, adds the points, and refills the slot (BG-05, BG-06,
 * BG-11 to BG-16).
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
  const fitProblem = findFitProblem(state, shapeId, topRow, leftColumn);
  if (fitProblem !== null) {
    return { accepted: false, reason: fitProblem };
  }

  const placedCellIndexes = coveredCellIndexes(state, shapeId, topRow, leftColumn);
  const filledCells = fillShape(state, shapeId, topRow, leftColumn);
  const fullLines = findFullLines({ size: state.size, cells: filledCells });
  const clearedLineCount = countFullLines(fullLines);
  const clearedCellIndexSet = new Set<CellIndex>();
  for (let line = 0; line < state.size; line++) {
    for (const row of fullLines.rows) {
      clearedCellIndexSet.add(cellIndexAt(state.size, row, line));
    }
    for (const column of fullLines.columns) {
      clearedCellIndexSet.add(cellIndexAt(state.size, line, column));
    }
  }
  const clearedCells = filledCells.map((cell, index): BoardCell =>
    clearedCellIndexSet.has(index) ? null : cell,
  );

  const streak = clearedLineCount > 0 ? state.streak + 1 : 0;
  const pointsEarned =
    placementPoints(placedCellIndexes.length) + lineClearPoints(clearedLineCount, streak);
  const refill = drawShapeId(state.randomState);
  return {
    accepted: true,
    state: {
      ...state,
      cells: clearedCells,
      slots: replaceSlot(state.slots, slotIndex, refill.value),
      score: state.score + pointsEarned,
      streak,
      linesCleared: state.linesCleared + clearedLineCount,
      shapesPlaced: state.shapesPlaced + 1,
      randomState: refill.randomState,
    },
    placedCellIndexes,
    clearedRows: fullLines.rows,
    clearedColumns: fullLines.columns,
    clearedCellIndexes: [...clearedCellIndexSet].sort((first, second) => first - second),
    pointsEarned,
  };
}
