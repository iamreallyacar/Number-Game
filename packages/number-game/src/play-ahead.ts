import { clearPair } from './board.js';
import type { Cell } from './cell.js';
import { findValidPair } from './find-pair.js';

// Boards can grow past 1000 numbers, so a played-ahead check stops after this many matches.
export const PLAY_AHEAD_MATCH_BUDGET = 40;

/**
 * Plays ahead with simple matching: repeatedly clears the first pair with line of sight in reading
 * order, up to the match budget. Returns how many numbers that cleared. Scoring and stage changes
 * are ignored, since only the count matters.
 */
export function countNumbersClearedByPlayAhead(cells: readonly Cell[], width: number): number {
  let currentCells = cells;
  let matchCount = 0;
  while (matchCount < PLAY_AHEAD_MATCH_BUDGET) {
    const pair = findValidPair(currentCells, width);
    if (pair === null) {
      break;
    }
    currentCells = clearPair(currentCells, width, pair.firstIndex, pair.secondIndex).cells;
    matchCount++;
  }
  return matchCount * 2;
}
