import {
  ENEMY_EXPERIENCE,
  ENEMY_RADIUS,
  ENEMY_REMOVAL_DISTANCE,
  ENEMY_SPEED,
  ENEMY_TOUCH_DAMAGE,
  ENEMY_TOUCH_INTERVAL_SECONDS,
  PLAYER_RADIUS,
} from './balance.js';
import { nearestTo, squaredDistanceBetween } from './geometry.js';
import type { Enemy, PlayerState } from './run-state.js';
import { SECONDS_PER_STEP, secondsToSteps } from './timing.js';

/** Every enemy walks straight at the nearest player and passes through everything (SG-12, SG-25). */
export function walkEnemies(
  enemies: readonly Enemy[],
  players: readonly PlayerState[],
): readonly Enemy[] {
  const distancePerStep = ENEMY_SPEED * SECONDS_PER_STEP;
  return enemies.map((enemy) => {
    const target = nearestTo(enemy, players);
    if (target === null) {
      return enemy;
    }
    const deltaX = target.x - enemy.x;
    const deltaY = target.y - enemy.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance <= distancePerStep) {
      return { ...enemy, x: target.x, y: target.y };
    }
    const scale = distancePerStep / distance;
    return { ...enemy, x: enemy.x + deltaX * scale, y: enemy.y + deltaY * scale };
  });
}

export interface TouchesApplied {
  readonly enemies: readonly Enemy[];
  readonly damage: number;
}

/** Enemies touching a player take the touch damage off the team, once per touch interval each (SG-33). */
export function applyTouchDamage(
  enemies: readonly Enemy[],
  players: readonly PlayerState[],
): TouchesApplied {
  const touchDistance = PLAYER_RADIUS + ENEMY_RADIUS;
  const squaredTouchDistance = touchDistance * touchDistance;
  let damage = 0;
  const updated = enemies.map((enemy) => {
    const cooldown = Math.max(0, enemy.touchCooldownSteps - 1);
    const touching =
      cooldown === 0 &&
      players.some((player) => squaredDistanceBetween(enemy, player) < squaredTouchDistance);
    if (!touching) {
      return { ...enemy, touchCooldownSteps: cooldown };
    }
    damage += ENEMY_TOUCH_DAMAGE;
    return { ...enemy, touchCooldownSteps: secondsToSteps(ENEMY_TOUCH_INTERVAL_SECONDS) };
  });
  return { enemies: updated, damage };
}

/** Removes enemies farther than the removal distance from every player. They give nothing (SG-31). */
export function removeFarEnemies(
  enemies: readonly Enemy[],
  players: readonly PlayerState[],
): readonly Enemy[] {
  const squaredRemovalDistance = ENEMY_REMOVAL_DISTANCE * ENEMY_REMOVAL_DISTANCE;
  return enemies.filter((enemy) =>
    players.some((player) => squaredDistanceBetween(enemy, player) <= squaredRemovalDistance),
  );
}

export interface BeatenEnemiesRemoved {
  readonly enemies: readonly Enemy[];
  readonly points: number;
  readonly experience: number;
}

/** Removes enemies with no health left and returns what the team gains from them (SG-26, SG-34). */
export function removeBeatenEnemies(enemies: readonly Enemy[]): BeatenEnemiesRemoved {
  const beaten = enemies.filter((enemy) => enemy.health <= 0);
  return {
    enemies: enemies.filter((enemy) => enemy.health > 0),
    points: beaten.reduce((total, enemy) => total + enemy.points, 0),
    experience: beaten.length * ENEMY_EXPERIENCE,
  };
}
