import {
  applyDiskMove,
  pegAt,
  type DiskMoveRefusal,
  type DiskMoveResult,
  type GameState,
  type PegIndex,
  type PegMove,
} from '@local/disk-game';

export type PegTapOutcome =
  | { readonly kind: 'ignored' }
  | { readonly kind: 'picked-up'; readonly heldPeg: PegIndex }
  | { readonly kind: 'put-back' }
  | {
      readonly kind: 'moved';
      readonly move: PegMove;
      readonly result: Extract<DiskMoveResult, { accepted: true }>;
    }
  | { readonly kind: 'refused'; readonly move: PegMove; readonly reason: DiskMoveRefusal };

/**
 * What tapping a peg does (DK-09, DK-10): the first tap picks up the top disk, tapping the same
 * peg again puts it back, and tapping another peg tries to drop it there.
 */
export function tapPeg(
  state: GameState,
  heldPeg: PegIndex | null,
  tappedPeg: PegIndex,
): PegTapOutcome {
  if (heldPeg === null) {
    return pegAt(state.pegs, tappedPeg).length === 0
      ? { kind: 'ignored' }
      : { kind: 'picked-up', heldPeg: tappedPeg };
  }
  if (heldPeg === tappedPeg) {
    return { kind: 'put-back' };
  }
  const move: PegMove = { fromPeg: heldPeg, toPeg: tappedPeg };
  const result = applyDiskMove(state, move);
  return result.accepted
    ? { kind: 'moved', move, result }
    : { kind: 'refused', move, reason: result.reason };
}
