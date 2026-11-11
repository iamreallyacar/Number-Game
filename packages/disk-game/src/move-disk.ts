import { isGameOver } from './game-over.js';
import type { GameState, PegIndex, PegMove, Pegs } from './game-state.js';
import { findPegMoveProblem, findSortedPeg, moveTopDisk, type PegMoveProblem } from './pegs.js';
import { stageClearPoints } from './scoring.js';
import { startStage } from './stage.js';

/** Each move takes this much from moves left (DK-11). */
export const MOVE_COST = 1;

export type DiskMoveRefusal = 'game-over' | PegMoveProblem;

/** What the browser shows when a move sorts the disks, before the next stage appears. */
export interface StageClear {
  readonly sortedPegIndex: PegIndex;
  /** The sorted layout, which the new state no longer holds. */
  readonly sortedPegs: Pegs;
  readonly pointsEarned: number;
  readonly perfect: boolean;
}

export type DiskMoveResult =
  | {
      readonly accepted: true;
      readonly state: GameState;
      /** Null unless this move cleared the stage. */
      readonly stageClear: StageClear | null;
    }
  | { readonly accepted: false; readonly reason: DiskMoveRefusal };

/**
 * Moves the top disk of one peg onto another (DK-08, DK-10, DK-11). A move that puts every disk
 * on one peg clears the stage, adds its points, and starts the next stage (DK-15 to DK-17).
 */
export function applyDiskMove(state: GameState, move: PegMove): DiskMoveResult {
  if (isGameOver(state)) {
    return { accepted: false, reason: 'game-over' };
  }
  const problem = findPegMoveProblem(state.pegs, move);
  if (problem !== null) {
    return { accepted: false, reason: problem };
  }
  const pegs = moveTopDisk(state.pegs, move);
  const movesLeft = state.movesLeft - MOVE_COST;
  const stageMovesUsed = state.stageMovesUsed + 1;
  const sortedPegIndex = findSortedPeg(pegs);
  if (sortedPegIndex === null) {
    return {
      accepted: true,
      state: {
        ...state,
        pegs,
        movesLeft,
        stageMovesUsed,
        stageMoves: [...state.stageMoves, { fromPeg: move.fromPeg, toPeg: move.toPeg }],
      },
      stageClear: null,
    };
  }
  const perfect = !state.stageAssisted && stageMovesUsed === state.stageFewestMoves;
  const pointsEarned = stageClearPoints(state.stageFewestMoves, perfect);
  return {
    accepted: true,
    state: startStage({
      startingDiskCount: state.startingDiskCount,
      stage: state.stage + 1,
      score: state.score + pointsEarned,
      movesCarriedOver: movesLeft,
      randomState: state.randomState,
    }),
    stageClear: { sortedPegIndex, sortedPegs: pegs, pointsEarned, perfect },
  };
}
