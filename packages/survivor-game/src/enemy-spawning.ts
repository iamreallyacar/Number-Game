import {
  drawRandomFraction,
  drawRandomItem,
  type RandomDraw,
  type RandomState,
} from '@local/seeded-random';
import {
  ENEMY_APPEAR_MAX_DISTANCE,
  ENEMY_APPEAR_MIN_DISTANCE,
  ENEMY_HEALTH_GROWTH,
  ENEMY_HEALTH_GROWTH_INTERVAL_SECONDS,
  ENEMY_LIMIT_PER_PLAYER,
  ENEMY_POINTS_GROWTH,
  ENEMY_POINTS_GROWTH_INTERVAL_SECONDS,
  ENEMY_SPAWN_RATE_GROWTH,
  ENEMY_SPAWN_RATE_GROWTH_INTERVAL_SECONDS,
  ENEMY_SPAWN_RATE_PER_PLAYER_AT_START,
  ENEMY_START_HEALTH,
  ENEMY_START_POINTS,
} from './balance.js';
import { distanceBetween, nearestTo, type Vector } from './geometry.js';
import type { Enemy, PlayerState } from './run-state.js';
import { completedIntervals, SECONDS_PER_STEP } from './timing.js';

// Several players spread along the rope can leave few angles that are far enough from all of
// them, so a point is searched for a few times. If every try fails, no enemy appears this time.
const APPEAR_POINT_ATTEMPTS = 50;

export interface EnemiesSpawned {
  readonly enemies: readonly Enemy[];
  readonly nextEntityId: number;
  readonly randomState: RandomState;
  readonly spawnCarry: number;
}

export function enemyLimitFor(playerCount: number): number {
  return ENEMY_LIMIT_PER_PLAYER * playerCount;
}

/** Enemies that appear per second in total (SG-28). */
export function enemySpawnRateFor(playerCount: number, stepCount: number): number {
  const growthSteps = completedIntervals(stepCount, ENEMY_SPAWN_RATE_GROWTH_INTERVAL_SECONDS);
  return (
    playerCount * (ENEMY_SPAWN_RATE_PER_PLAYER_AT_START + ENEMY_SPAWN_RATE_GROWTH * growthSteps)
  );
}

/** The health of an enemy that appears at this step, which has no upper limit (SG-29). */
export function enemyHealthAt(stepCount: number): number {
  return (
    ENEMY_START_HEALTH +
    ENEMY_HEALTH_GROWTH * completedIntervals(stepCount, ENEMY_HEALTH_GROWTH_INTERVAL_SECONDS)
  );
}

export function enemyPointsAt(stepCount: number): number {
  return (
    ENEMY_START_POINTS +
    ENEMY_POINTS_GROWTH * completedIntervals(stepCount, ENEMY_POINTS_GROWTH_INTERVAL_SECONDS)
  );
}

function drawAppearPoint(
  players: readonly PlayerState[],
  randomState: RandomState,
): RandomDraw<Vector | null> {
  let currentState = randomState;
  for (let attempt = 0; attempt < APPEAR_POINT_ATTEMPTS; attempt += 1) {
    const anchor = drawRandomItem(currentState, players);
    const angle = drawRandomFraction(anchor.randomState);
    const distance = drawRandomFraction(angle.randomState);
    currentState = distance.randomState;
    const appearDistance =
      ENEMY_APPEAR_MIN_DISTANCE +
      distance.value * (ENEMY_APPEAR_MAX_DISTANCE - ENEMY_APPEAR_MIN_DISTANCE);
    const point: Vector = {
      x: anchor.value.x + Math.cos(angle.value * 2 * Math.PI) * appearDistance,
      y: anchor.value.y + Math.sin(angle.value * 2 * Math.PI) * appearDistance,
    };
    const nearestPlayer = nearestTo(point, players);
    const nearestDistance = nearestPlayer === null ? 0 : distanceBetween(point, nearestPlayer);
    if (
      nearestDistance >= ENEMY_APPEAR_MIN_DISTANCE &&
      nearestDistance <= ENEMY_APPEAR_MAX_DISTANCE
    ) {
      return { value: point, randomState: currentState };
    }
  }
  return { value: null, randomState: currentState };
}

/**
 * Adds the enemies that are due this step. While the limit of enemies alive is reached, no new
 * enemy appears and the unused part of the rate is dropped (SG-30).
 */
export function spawnEnemies(
  players: readonly PlayerState[],
  enemies: readonly Enemy[],
  stepCount: number,
  spawnCarry: number,
  nextEntityId: number,
  randomState: RandomState,
): EnemiesSpawned {
  const limit = enemyLimitFor(players.length);
  const spawned: Enemy[] = [];
  let carry = spawnCarry + enemySpawnRateFor(players.length, stepCount) * SECONDS_PER_STEP;
  let currentState = randomState;
  let nextId = nextEntityId;
  while (carry >= 1) {
    carry -= 1;
    if (enemies.length + spawned.length >= limit) {
      continue;
    }
    const point = drawAppearPoint(players, currentState);
    currentState = point.randomState;
    if (point.value === null) {
      continue;
    }
    spawned.push({
      id: nextId,
      x: point.value.x,
      y: point.value.y,
      health: enemyHealthAt(stepCount),
      points: enemyPointsAt(stepCount),
      touchCooldownSteps: 0,
    });
    nextId += 1;
  }
  return {
    enemies: [...enemies, ...spawned],
    nextEntityId: nextId,
    randomState: currentState,
    spawnCarry: carry,
  };
}
