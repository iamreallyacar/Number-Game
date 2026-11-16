import { describe, expect, it } from 'vitest';
import {
  ENEMY_APPEAR_MAX_DISTANCE,
  ENEMY_APPEAR_MIN_DISTANCE,
  ENEMY_HEALTH_GROWTH,
  ENEMY_LIMIT_PER_PLAYER,
  ENEMY_POINTS_GROWTH,
  ENEMY_START_HEALTH,
  ENEMY_START_POINTS,
  STEP_RATE,
} from './balance.js';
import {
  enemyHealthAt,
  enemyLimitFor,
  enemyPointsAt,
  enemySpawnRateFor,
  spawnEnemies,
} from './enemy-spawning.js';
import { nearestTo, distanceBetween } from './geometry.js';
import { makeEnemy, makePlayer } from './test-support.js';

const thirtySeconds = 30 * STEP_RATE;

describe('enemy numbers', () => {
  it('starts at one enemy per second for each player and adds 0.1 every 30 seconds (SG-28)', () => {
    expect(enemySpawnRateFor(1, 0)).toBeCloseTo(1);
    expect(enemySpawnRateFor(4, 0)).toBeCloseTo(4);
    expect(enemySpawnRateFor(1, thirtySeconds - 1)).toBeCloseTo(1);
    expect(enemySpawnRateFor(1, thirtySeconds)).toBeCloseTo(1.1);
    expect(enemySpawnRateFor(2, 3 * thirtySeconds)).toBeCloseTo(2.6);
  });

  it('gives later enemies more health and points, without a limit (SG-29)', () => {
    expect(enemyHealthAt(0)).toBe(ENEMY_START_HEALTH);
    expect(enemyPointsAt(0)).toBe(ENEMY_START_POINTS);
    expect(enemyHealthAt(thirtySeconds)).toBe(ENEMY_START_HEALTH + ENEMY_HEALTH_GROWTH);
    expect(enemyPointsAt(thirtySeconds)).toBe(ENEMY_START_POINTS + ENEMY_POINTS_GROWTH);
    expect(enemyHealthAt(1000 * thirtySeconds)).toBe(
      ENEMY_START_HEALTH + 1000 * ENEMY_HEALTH_GROWTH,
    );
  });

  it('allows more enemies alive with more players (SG-30)', () => {
    expect(enemyLimitFor(1)).toBe(ENEMY_LIMIT_PER_PLAYER);
    expect(enemyLimitFor(4)).toBe(200);
  });
});

describe('spawnEnemies', () => {
  const players = [makePlayer({ playerId: 'a', x: 0 }), makePlayer({ playerId: 'b', x: 400 })];

  it('adds about the rate of enemies over time, and keeps the part left over', () => {
    let enemies: ReturnType<typeof makeEnemy>[] = [];
    let carry = 0;
    let nextId = 1;
    let randomState = 5;
    for (let step = 0; step < 3 * STEP_RATE; step += 1) {
      const spawned = spawnEnemies(players, enemies, 0, carry, nextId, randomState);
      enemies = [...spawned.enemies];
      carry = spawned.spawnCarry;
      nextId = spawned.nextEntityId;
      randomState = spawned.randomState;
    }
    // Adding a third of a number many times can end a hair under the whole number.
    expect(enemies.length).toBeGreaterThanOrEqual(5);
    expect(enemies.length).toBeLessThanOrEqual(6);
  });

  it('puts new enemies outside every view, inside the appear distance range of the nearest player (SG-27)', () => {
    const { enemies } = spawnEnemies(players, [], 0, 60, 1, 9);
    expect(enemies).toHaveLength(60);
    for (const enemy of enemies) {
      const nearest = nearestTo(enemy, players);
      expect(nearest).not.toBeNull();
      const distance = distanceBetween(enemy, nearest ?? enemy);
      expect(distance).toBeGreaterThanOrEqual(ENEMY_APPEAR_MIN_DISTANCE - 1e-9);
      expect(distance).toBeLessThanOrEqual(ENEMY_APPEAR_MAX_DISTANCE + 1e-9);
    }
  });

  it('stamps health and points of the step the enemy appears', () => {
    const spawned = spawnEnemies(players, [], thirtySeconds, 1, 7, 1);
    expect(spawned.enemies[0]).toMatchObject({
      id: 7,
      health: enemyHealthAt(thirtySeconds),
      points: enemyPointsAt(thirtySeconds),
      touchCooldownSteps: 0,
    });
    expect(spawned.nextEntityId).toBe(8);
  });

  it('adds no enemy while the limit is reached, and drops the unused rate', () => {
    const alive = Array.from({ length: enemyLimitFor(2) }, (_, index) => makeEnemy({ id: index }));
    const spawned = spawnEnemies(players, alive, 0, 5, 1000, 1);
    expect(spawned.enemies).toHaveLength(enemyLimitFor(2));
    expect(spawned.spawnCarry).toBeLessThan(1);
  });

  it('uses the random state, so the same state gives the same enemies', () => {
    const first = spawnEnemies(players, [], 0, 1, 1, 77);
    expect(spawnEnemies(players, [], 0, 1, 1, 77)).toEqual(first);
    expect(spawnEnemies(players, [], 0, 1, 1, 78)).not.toEqual(first);
    expect(first.randomState).not.toBe(77);
  });
});
