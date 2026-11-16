import { SECONDS_PER_STEP } from './timing.js';
import type { Vector } from './geometry.js';
import type { PlayerState } from './run-state.js';

/** Moves every player with a direction by one step. The arena has no walls (SG-10). */
export function movePlayers(
  players: readonly PlayerState[],
  unitDirections: ReadonlyMap<string, Vector>,
  speed: number,
): PlayerState[] {
  const distancePerStep = speed * SECONDS_PER_STEP;
  return players.map((player) => {
    const direction = unitDirections.get(player.playerId);
    if (direction === undefined) {
      return player;
    }
    return {
      ...player,
      x: player.x + direction.x * distancePerStep,
      y: player.y + direction.y * distancePerStep,
    };
  });
}
