import {
  applyMatch,
  type CellIndex,
  type GameState,
  type MatchRefusal,
  type MatchResult,
} from '@local/number-game';

export type TapOutcome =
  | { readonly kind: 'ignored' }
  | { readonly kind: 'selected'; readonly selectedIndex: CellIndex }
  | { readonly kind: 'deselected' }
  | {
      readonly kind: 'matched';
      readonly firstIndex: CellIndex;
      readonly secondIndex: CellIndex;
      readonly match: Extract<MatchResult, { accepted: true }>;
    }
  | {
      readonly kind: 'refused';
      readonly firstIndex: CellIndex;
      readonly secondIndex: CellIndex;
      readonly reason: MatchRefusal;
    };

/**
 * What tapping a cell does (NG-04 to NG-07): the first number is selected, tapping it again
 * deselects it, and a second number tries a match with the first.
 */
export function tapCell(
  state: GameState,
  selectedIndex: CellIndex | null,
  tappedIndex: CellIndex,
): TapOutcome {
  const tappedCell = state.cells[tappedIndex];
  if (tappedCell === null || tappedCell === undefined) {
    return { kind: 'ignored' };
  }
  if (selectedIndex === null) {
    return { kind: 'selected', selectedIndex: tappedIndex };
  }
  if (selectedIndex === tappedIndex) {
    return { kind: 'deselected' };
  }
  const match = applyMatch(state, selectedIndex, tappedIndex);
  if (!match.accepted) {
    return {
      kind: 'refused',
      firstIndex: selectedIndex,
      secondIndex: tappedIndex,
      reason: match.reason,
    };
  }
  return { kind: 'matched', firstIndex: selectedIndex, secondIndex: tappedIndex, match };
}
