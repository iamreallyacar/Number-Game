/** A row and column on the board, counted from 0. */
export interface BoardPosition {
  readonly row: number;
  readonly column: number;
}

/** What the board shows for a moment after lines are cleared (BG-17). */
export interface ClearEffect {
  /** Tells apart effects that are on screen at the same time. */
  readonly id: number;
  readonly clearedCells: readonly BoardPosition[];
  /** Where the points float up from: the middle of the placed shape. */
  readonly pointsAt: BoardPosition;
  readonly pointsEarned: number;
}
