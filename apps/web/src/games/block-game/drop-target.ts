import type { BoardSize } from '@local/block-game';

/** A point on the screen in CSS pixels, as given by pointer events. */
export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

/** Where the board cells are on the screen, measured from inside the board border. */
export interface BoardMetrics {
  readonly left: number;
  readonly top: number;
  /** Width of the cells and the grid lines between them, without the outer border. */
  readonly innerWidth: number;
  readonly size: BoardSize;
  /** Width of one grid line between two cells. */
  readonly gridLinePx: number;
}

/** The bounding box of a shape in cells. */
export interface ShapeBox {
  readonly width: number;
  readonly height: number;
}

/** The board row and column where the top-left of the shape's bounding box would go. */
export interface DropTarget {
  readonly topRow: number;
  readonly leftColumn: number;
}

/**
 * On touch, the dragged shape is held this far above the finger so the finger does not hide it,
 * or the cells it would land on.
 */
export const TOUCH_LIFT_PX = 56;

/** The distance from the start of one cell to the start of the next. */
export function cellPitchOf(metrics: BoardMetrics): number {
  return (metrics.innerWidth + metrics.gridLinePx) / metrics.size;
}

/**
 * Where the pointer holds the dragged shape, measured from the shape's top-left corner. A mouse or
 * pen holds it by the middle. A finger holds it by the bottom middle, lifted above the finger.
 */
export function grabOffsetFor(
  shape: ShapeBox,
  cellPitchPx: number,
  pointerType: string,
): ScreenPoint {
  const shapeWidthPx = shape.width * cellPitchPx;
  const shapeHeightPx = shape.height * cellPitchPx;
  if (pointerType === 'touch') {
    return { x: shapeWidthPx / 2, y: shapeHeightPx + TOUCH_LIFT_PX };
  }
  return { x: shapeWidthPx / 2, y: shapeHeightPx / 2 };
}

/**
 * The cells a dragged shape snaps to, given where its top-left corner is on the screen, or null
 * when the middle of the shape is not over the board. Near an edge the shape is pulled fully onto
 * the board, so the player does not have to line it up to the pixel.
 */
export function findDropTarget(
  metrics: BoardMetrics,
  shape: ShapeBox,
  shapeTopLeft: ScreenPoint,
): DropTarget | null {
  const cellPitchPx = cellPitchOf(metrics);
  const columnFromLeft = (shapeTopLeft.x - metrics.left) / cellPitchPx;
  const rowFromTop = (shapeTopLeft.y - metrics.top) / cellPitchPx;
  const middleColumn = columnFromLeft + shape.width / 2;
  const middleRow = rowFromTop + shape.height / 2;
  const isOverBoard = (line: number): boolean => line >= 0 && line <= metrics.size;
  if (!isOverBoard(middleColumn) || !isOverBoard(middleRow)) {
    return null;
  }
  return {
    topRow: clampToBoard(Math.round(rowFromTop), metrics.size - shape.height),
    leftColumn: clampToBoard(Math.round(columnFromLeft), metrics.size - shape.width),
  };
}

function clampToBoard(line: number, lastLine: number): number {
  return Math.min(Math.max(line, 0), lastLine);
}
