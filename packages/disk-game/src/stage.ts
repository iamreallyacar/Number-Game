import type { RandomState } from '@local/seeded-random';
import { diskCountOfStage, type GameState, type StartingDiskCount } from './game-state.js';
import { drawLayout } from './layout.js';

/** A new stage adds this many moves for each move of its layout's fewest moves (DK-16). */
export const MOVE_BUDGET_FACTOR = 2;

export interface StageStart {
  readonly startingDiskCount: StartingDiskCount;
  readonly stage: number;
  readonly score: number;
  /** Moves not used in earlier stages, which carry over (DK-16). */
  readonly movesCarriedOver: number;
  readonly randomState: RandomState;
}

/** Deals the layout of a stage and tops up the move budget (DK-05, DK-06, DK-16). */
export function startStage(start: StageStart): GameState {
  const layout = drawLayout(
    start.randomState,
    diskCountOfStage(start.startingDiskCount, start.stage),
  );
  return {
    startingDiskCount: start.startingDiskCount,
    stage: start.stage,
    pegs: layout.value.pegs,
    score: start.score,
    movesLeft: start.movesCarriedOver + MOVE_BUDGET_FACTOR * layout.value.fewestMoves,
    stageFewestMoves: layout.value.fewestMoves,
    stageMovesUsed: 0,
    stageMoves: [],
    stageAssisted: false,
    randomState: layout.randomState,
  };
}
