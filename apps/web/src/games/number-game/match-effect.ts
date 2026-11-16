import type { BoardPosition } from '../board-position.js';

/**
 * What the board shows for a moment after a pair is cleared (NG-30). Positions are taken from the
 * board before the match, so a burst still shows where a removed row used to be.
 */
export interface MatchEffect {
  /** Tells apart effects that are on screen at the same time. */
  readonly id: number;
  readonly firstCell: BoardPosition;
  readonly secondCell: BoardPosition;
  readonly pointsEarned: number;
  /** The Chinese words of the cheer that plays with the match, or null when no cheer plays. */
  readonly cheerWords: string | null;
}
