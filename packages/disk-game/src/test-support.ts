import { fewestMovesOf } from './fewest-moves.js';
import type { GameState, Pegs } from './game-state.js';

/** Disk 3 alone on the left peg and disks 2 and 1 in the middle. Sorting it takes 3 moves. */
const THREE_MOVE_PEGS: Pegs = [[3], [2, 1], []];

/**
 * A first stage of 3 disks that has just started. The fewest moves and the move budget follow
 * from the pegs unless they are given.
 */
export function makeTestState(overrides: Partial<GameState> = {}): GameState {
  const pegs = overrides.pegs ?? THREE_MOVE_PEGS;
  const stageFewestMoves = fewestMovesOf(pegs);
  return {
    startingDiskCount: 3,
    stage: 1,
    pegs,
    score: 0,
    movesLeft: 2 * stageFewestMoves,
    stageFewestMoves,
    stageMovesUsed: 0,
    stageMoves: [],
    stageAssisted: false,
    randomState: 12345,
    ...overrides,
  };
}

type MoveOutcome =
  { readonly accepted: true } | { readonly accepted: false; readonly reason: string };

/** Unwraps a result that the test expects to be accepted. */
export function expectAccepted<Outcome extends MoveOutcome>(
  outcome: Outcome,
): Extract<Outcome, { readonly accepted: true }> {
  if (!outcome.accepted) {
    throw new Error(`Expected the move to be accepted, got ${outcome.reason}`);
  }
  // Narrowing a generic union by its `accepted` field is beyond the compiler, so it is told.
  return outcome as Extract<Outcome, { readonly accepted: true }>;
}
