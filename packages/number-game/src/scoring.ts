// The values from NG-23.
export const MATCH_POINTS = 10;
export const EMPTY_ROW_POINTS = 50;
export const STAGE_CLEAR_POINTS_PER_STAGE = 500;

export function stageClearBonus(clearedStage: number): number {
  return STAGE_CLEAR_POINTS_PER_STAGE * clearedStage;
}
