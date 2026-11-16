import { BULLET_FAN_ANGLE_DEGREES, BULLET_RANGE } from './balance.js';
import { distanceBetween, nearestTo } from './geometry.js';
import { basicShotStatsOf } from './player-stats.js';
import type { Bullet, Enemy, PlayerState } from './run-state.js';

export interface ShotsFired {
  readonly players: readonly PlayerState[];
  readonly bullets: readonly Bullet[];
  readonly nextEntityId: number;
}

const FAN_ANGLE_RADIANS = (BULLET_FAN_ANGLE_DEGREES * Math.PI) / 180;

/** The bullets of one shot in a fan centred on the nearest enemy (SG-24). */
function fanOfBullets(
  player: PlayerState,
  target: Enemy,
  firstBulletId: number,
): readonly Bullet[] {
  const stats = basicShotStatsOf(player.upgradeCounts);
  const aimAngle = Math.atan2(target.y - player.y, target.x - player.x);
  return Array.from({ length: stats.bulletsPerShot }, (_, index) => {
    const angle = aimAngle + (index - (stats.bulletsPerShot - 1) / 2) * FAN_ANGLE_RADIANS;
    return {
      id: firstBulletId + index,
      ownerPlayerId: player.playerId,
      x: player.x,
      y: player.y,
      directionX: Math.cos(angle),
      directionY: Math.sin(angle),
      radius: stats.bulletRadius,
      damage: stats.damage,
      hitsLeft: stats.hitsPerBullet,
      distanceLeft: BULLET_RANGE,
      hitEnemyIds: [],
    };
  });
}

/**
 * Counts every player's shot timer down and fires the shots that are due at the nearest enemy
 * in range (SG-20). A shot that is due with no enemy in range waits, and fires as soon as one
 * comes into range (SG-23).
 */
export function fireBasicShots(
  players: readonly PlayerState[],
  enemies: readonly Enemy[],
  bullets: readonly Bullet[],
  nextEntityId: number,
): ShotsFired {
  const newBullets: Bullet[] = [];
  let nextId = nextEntityId;
  const updatedPlayers = players.map((player) => {
    const cooldown = Math.max(0, player.shotCooldownSteps - 1);
    if (cooldown > 0) {
      return { ...player, shotCooldownSteps: cooldown };
    }
    const target = nearestTo(player, enemies);
    if (target === null || distanceBetween(player, target) > BULLET_RANGE) {
      return { ...player, shotCooldownSteps: 0 };
    }
    const fan = fanOfBullets(player, target, nextId);
    newBullets.push(...fan);
    nextId += fan.length;
    return {
      ...player,
      shotCooldownSteps: basicShotStatsOf(player.upgradeCounts).shotIntervalSteps,
    };
  });
  return {
    players: updatedPlayers,
    bullets: [...bullets, ...newBullets],
    nextEntityId: nextId,
  };
}
