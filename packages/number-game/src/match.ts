import { countNumbers, removeEmptyRows } from './board.js';
import type { CellIndex, GameState } from './game-state.js';
import { hasLineOfSight } from './line-of-sight.js';
import { isPair } from './pair.js';
import { EMPTY_ROW_POINTS, MATCH_POINTS } from './scoring.js';
import { advanceStage } from './stage-clear.js';

export type MatchRefusal =
  'cell-out-of-range' | 'same-cell' | 'empty-cell' | 'not-a-pair' | 'no-line-of-sight';

export type MatchResult =
  | {
      readonly accepted: true;
      readonly state: GameState;
      readonly removedRowCount: number;
      readonly stageCleared: boolean;
    }
  | { readonly accepted: false; readonly reason: MatchRefusal };

/**
 * Clears two cells that form a pair with line of sight, removes rows that became empty, and adds
 * the points. Clearing the last number moves straight on to the next stage.
 */
export function applyMatch(
  state: GameState,
  firstIndex: CellIndex,
  secondIndex: CellIndex,
): MatchResult {
  if (!Number.isInteger(firstIndex) || !Number.isInteger(secondIndex)) {
    return { accepted: false, reason: 'cell-out-of-range' };
  }
  if (firstIndex === secondIndex) {
    return { accepted: false, reason: 'same-cell' };
  }
  const firstCell = state.cells[firstIndex];
  const secondCell = state.cells[secondIndex];
  if (firstCell === undefined || secondCell === undefined) {
    return { accepted: false, reason: 'cell-out-of-range' };
  }
  if (firstCell === null || secondCell === null) {
    return { accepted: false, reason: 'empty-cell' };
  }
  if (!isPair(firstCell, secondCell)) {
    return { accepted: false, reason: 'not-a-pair' };
  }
  if (!hasLineOfSight(state.cells, state.width, firstIndex, secondIndex)) {
    return { accepted: false, reason: 'no-line-of-sight' };
  }

  const clearedCells = state.cells.map((cell, index) =>
    index === firstIndex || index === secondIndex ? null : cell,
  );
  const rowRemoval = removeEmptyRows(clearedCells, state.width);
  const matchedState: GameState = {
    ...state,
    cells: rowRemoval.cells,
    score: state.score + MATCH_POINTS + rowRemoval.removedRowCount * EMPTY_ROW_POINTS,
  };
  const stageCleared = countNumbers(matchedState.cells) === 0;
  return {
    accepted: true,
    state: stageCleared ? advanceStage(matchedState) : matchedState,
    removedRowCount: rowRemoval.removedRowCount,
    stageCleared,
  };
}
