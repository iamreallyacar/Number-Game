import { ROPE_LENGTH } from './balance.js';
import { itemAt, distanceBetween } from './geometry.js';
import type { PlayerState } from './run-state.js';

// A pull on one pair can stretch another pair, so the pairs are settled a few times per step.
// Two players are always settled exactly, and more players end up very close to the rope length.
const ROPE_SETTLING_PASSES = 4;

interface RopeEnd {
  x: number;
  y: number;
  readonly moving: boolean;
}

function pullPairBack(first: RopeEnd, second: RopeEnd): void {
  const distance = distanceBetween(first, second);
  if (distance <= ROPE_LENGTH) {
    return;
  }
  const excess = distance - ROPE_LENGTH;
  const towardSecondX = (second.x - first.x) / distance;
  const towardSecondY = (second.y - first.y) / distance;
  // A moving player holds their ground and a still one gives way. Two of a kind share the pull (SG-16).
  const firstShare = first.moving === second.moving ? 0.5 : first.moving ? 0 : 1;
  const secondShare = 1 - firstShare;
  first.x += towardSecondX * excess * firstShare;
  first.y += towardSecondY * excess * firstShare;
  second.x -= towardSecondX * excess * secondShare;
  second.y -= towardSecondY * excess * secondShare;
}

/**
 * Pulls every pair that is too far apart back to the rope length (SG-14, SG-15). A player counts
 * as moving when they have a direction this step, so a dropped player and a player who let go of
 * the joystick behave the same (SG-17), and a player who drags another is not slowed (SG-18).
 */
export function pullPlayersBackToRope(
  players: readonly PlayerState[],
  movingPlayerIds: ReadonlySet<string>,
): PlayerState[] {
  const ends: RopeEnd[] = players.map((player) => ({
    x: player.x,
    y: player.y,
    moving: movingPlayerIds.has(player.playerId),
  }));
  for (let pass = 0; pass < ROPE_SETTLING_PASSES; pass += 1) {
    for (let first = 0; first < ends.length; first += 1) {
      for (let second = first + 1; second < ends.length; second += 1) {
        pullPairBack(itemAt(ends, first), itemAt(ends, second));
      }
    }
  }
  return players.map((player, index) => {
    const end = itemAt(ends, index);
    return { ...player, x: end.x, y: end.y };
  });
}
