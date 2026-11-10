/** A row and column on the board, counted from 0. */
export interface BoardPosition {
  readonly row: number;
  readonly column: number;
}

/**
 * What the board shows for a moment after a pair is cleared (NG-30). Positions are taken from the
 * board before the match, so a burst still shows where a removed row used to be.
 */
export interface MatchEffect {
  /** Tells apart effects that are on screen at the same time. */
  readonly id: number;
  readonly firstCell: BoardPosition;
  readonly secondCell: BoardPosition;
  readonly pointsEarned: number;
}
