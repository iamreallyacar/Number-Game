import { columnOf, rowOf } from './board.js';
import type { Cell } from './cell.js';
import type { CellIndex } from './game-state.js';

interface GridDirection {
  readonly rowStep: number;
  readonly columnStep: number;
}

// Forward directions that stop at the board edge: vertical, and the two diagonals going down.
// Horizontal has no entry because a row is a stretch of reading order, so the reading order
// search below already covers it.
const FORWARD_GRID_DIRECTIONS: readonly GridDirection[] = [
  { rowStep: 1, columnStep: 0 },
  { rowStep: 1, columnStep: 1 },
  { rowStep: 1, columnStep: -1 },
];

function firstNumberInReadingOrder(cells: readonly Cell[], index: CellIndex): CellIndex | null {
  for (let candidate = index + 1; candidate < cells.length; candidate++) {
    if (cells[candidate] !== null) {
      return candidate;
    }
  }
  return null;
}

function firstNumberInGridDirection(
  cells: readonly Cell[],
  width: number,
  index: CellIndex,
  direction: GridDirection,
): CellIndex | null {
  let row = rowOf(index, width) + direction.rowStep;
  let column = columnOf(index, width) + direction.columnStep;
  while (column >= 0 && column < width) {
    const candidate = row * width + column;
    if (candidate >= cells.length) {
      return null;
    }
    if (cells[candidate] !== null) {
      return candidate;
    }
    row += direction.rowStep;
    column += direction.columnStep;
  }
  return null;
}

/**
 * The numbers this cell can see looking forward (right, down, and down the diagonals). Any cell
 * it can see looking backward also sees it looking forward, so forward is enough to find every
 * visible pair once.
 */
export function findForwardVisibleCells(
  cells: readonly Cell[],
  width: number,
  index: CellIndex,
): CellIndex[] {
  const visibleCells = [
    firstNumberInReadingOrder(cells, index),
    ...FORWARD_GRID_DIRECTIONS.map((direction) =>
      firstNumberInGridDirection(cells, width, index, direction),
    ),
  ];
  return visibleCells.filter((visibleCell) => visibleCell !== null);
}

/**
 * Two cells have line of sight when only empty cells lie between them horizontally, vertically,
 * diagonally, or in reading order.
 */
export function hasLineOfSight(
  cells: readonly Cell[],
  width: number,
  firstIndex: CellIndex,
  secondIndex: CellIndex,
): boolean {
  if (firstIndex === secondIndex) {
    throw new RangeError(
      `Line of sight needs two different cells, got ${String(firstIndex)} twice`,
    );
  }
  const earlierIndex = Math.min(firstIndex, secondIndex);
  const laterIndex = Math.max(firstIndex, secondIndex);
  return findForwardVisibleCells(cells, width, earlierIndex).includes(laterIndex);
}
