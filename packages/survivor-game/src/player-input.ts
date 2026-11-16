import type { Vector } from './geometry.js';
import type { UpgradeId } from './upgrades.js';

/** A direction to walk in. Only the way it points matters, not its length (SG-11). */
export type Direction = Vector;

/** What one player sends for one step. */
export interface PlayerInput {
  /** The direction held, or null for none. A player with no input stands still (SG-44). */
  readonly direction: Direction | null;
  /** An upgrade from the player's open offer, or null for no choice. */
  readonly upgradeChoice: UpgradeId | null;
}

/** The input of every player that sent one, by player ID. A missing player has no input. */
export type StepInputs = ReadonlyMap<string, PlayerInput>;

/**
 * The largest number a direction may have in either part. A real browser sends a unit vector, so
 * this only refuses numbers whose square would overflow.
 */
export const MAX_DIRECTION_COMPONENT = 1000;

export const NO_INPUT: PlayerInput = { direction: null, upgradeChoice: null };

export class InvalidStepInputError extends Error {
  override readonly name = 'InvalidStepInputError';
}

/** The direction as a unit vector, or null when the player stands still. */
export function toUnitDirection(direction: Direction | null): Vector | null {
  if (direction === null) {
    return null;
  }
  if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y)) {
    throw new InvalidStepInputError('A direction must have finite numbers');
  }
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0) {
    return null;
  }
  return { x: direction.x / length, y: direction.y / length };
}
