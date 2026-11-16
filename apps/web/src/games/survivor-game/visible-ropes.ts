import { balance } from '@local/survivor-game';
import type { WorldPoint } from './view-transform.js';

export interface VisibleRope {
  readonly from: WorldPoint;
  readonly to: WorldPoint;
  /** 0 at the warning distance and 1 at the full rope length, so the drawing can show the pull. */
  readonly strain: number;
}

const WARNING_DISTANCE = balance.ROPE_WARNING_SHARE * balance.ROPE_LENGTH;

/** The rope between each pair of players, only for the pairs farther apart than the warning share (SG-19). */
export function findVisibleRopes(positions: readonly WorldPoint[]): readonly VisibleRope[] {
  const ropes: VisibleRope[] = [];
  for (const [index, from] of positions.entries()) {
    for (const to of positions.slice(index + 1)) {
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      if (distance > WARNING_DISTANCE) {
        const strain = Math.min(
          1,
          (distance - WARNING_DISTANCE) / (balance.ROPE_LENGTH - WARNING_DISTANCE),
        );
        ropes.push({ from, to, strain });
      }
    }
  }
  return ropes;
}
