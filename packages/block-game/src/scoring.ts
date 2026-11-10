// Starting values from BG-14 and BG-15, to be tuned after playtesting.
export const PLACED_CELL_POINTS = 1;
export const LINE_CLEAR_POINTS = 10;

/** Points for the blocks of one placed shape. */
export function placementPoints(placedCellCount: number): number {
  return PLACED_CELL_POINTS * placedCellCount;
}

/**
 * Points for clearing lines in one placement. Clearing several lines at once grows with the square
 * of the count, and the streak multiplies it, so the streak must already count this placement.
 */
export function lineClearPoints(clearedLineCount: number, streak: number): number {
  return LINE_CLEAR_POINTS * clearedLineCount * clearedLineCount * streak;
}
