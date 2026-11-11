/** Points for clearing a stage, for each move of the fewest moves of its starting layout (DK-17). */
export const CLEAR_POINTS_PER_FEWEST_MOVE = 10;
/** Extra points for a perfect stage, for each move of the fewest moves (DK-17). */
export const PERFECT_POINTS_PER_FEWEST_MOVE = 5;

export function stageClearPoints(stageFewestMoves: number, perfect: boolean): number {
  const pointsPerFewestMove =
    CLEAR_POINTS_PER_FEWEST_MOVE + (perfect ? PERFECT_POINTS_PER_FEWEST_MOVE : 0);
  return pointsPerFewestMove * stageFewestMoves;
}
