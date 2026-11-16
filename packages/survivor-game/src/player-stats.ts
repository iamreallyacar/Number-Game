import {
  BULLET_DAMAGE,
  BULLET_HITS,
  BULLET_RADIUS,
  BULLETS_PER_SHOT,
  DAMAGE_PER_CHOICE,
  FIRE_RATE_REDUCTION_PER_CHOICE,
  MORE_BULLETS_PER_CHOICE,
  MOVEMENT_SPEED_PER_CHOICE,
  PIERCING_PER_CHOICE,
  PLAYER_SPEED,
  BULLET_SIZE_PER_CHOICE,
  SHOT_INTERVAL_SECONDS,
} from './balance.js';
import { secondsToSteps } from './timing.js';
import type { IndividualUpgradeCounts, TeamUpgradeCounts } from './upgrades.js';

export interface BasicShotStats {
  readonly bulletsPerShot: number;
  readonly damage: number;
  readonly hitsPerBullet: number;
  readonly bulletRadius: number;
  readonly shotIntervalSteps: number;
}

/** The basic shot of a player after the upgrades they chose. */
export function basicShotStatsOf(counts: IndividualUpgradeCounts): BasicShotStats {
  const shotIntervalSeconds =
    SHOT_INTERVAL_SECONDS * (1 - FIRE_RATE_REDUCTION_PER_CHOICE) ** counts['fire-rate'];
  return {
    bulletsPerShot: BULLETS_PER_SHOT + MORE_BULLETS_PER_CHOICE * counts['more-bullets'],
    damage: BULLET_DAMAGE + DAMAGE_PER_CHOICE * counts.damage,
    hitsPerBullet: BULLET_HITS + PIERCING_PER_CHOICE * counts.piercing,
    bulletRadius: BULLET_RADIUS + BULLET_SIZE_PER_CHOICE * counts['bullet-size'],
    shotIntervalSteps: secondsToSteps(shotIntervalSeconds),
  };
}

/** Every player moves at the same speed, since movement speed is a team upgrade (SG-40). */
export function playerSpeedOf(teamCounts: TeamUpgradeCounts): number {
  return PLAYER_SPEED + MOVEMENT_SPEED_PER_CHOICE * teamCounts['movement-speed'];
}
