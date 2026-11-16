import { describe, expect, it } from 'vitest';
import {
  ENEMY_EXPERIENCE,
  ENEMY_REMOVAL_DISTANCE,
  ENEMY_SPEED,
  ENEMY_TOUCH_DAMAGE,
  ENEMY_TOUCH_INTERVAL_SECONDS,
  PLAYER_RADIUS,
  ENEMY_RADIUS,
  STEP_RATE,
} from './balance.js';
import {
  applyTouchDamage,
  removeBeatenEnemies,
  removeFarEnemies,
  walkEnemies,
} from './enemy-behaviour.js';
import { makeEnemy, makePlayer } from './test-support.js';

describe('walkEnemies', () => {
  it('walks straight at the nearest player at the enemy speed (SG-25)', () => {
    const players = [makePlayer({ playerId: 'a', x: 0 }), makePlayer({ playerId: 'b', x: 1000 })];
    const [walked] = walkEnemies([makeEnemy({ x: 900, y: 0 })], players);
    expect(walked?.x).toBeCloseTo(900 + ENEMY_SPEED / STEP_RATE);
    expect(walked?.y).toBeCloseTo(0);
  });

  it('does not overshoot a player', () => {
    const [walked] = walkEnemies([makeEnemy({ x: 1, y: 0 })], [makePlayer()]);
    expect(walked).toMatchObject({ x: 0, y: 0 });
  });

  it('passes through other enemies', () => {
    const enemies = [makeEnemy({ id: 1, x: 100 }), makeEnemy({ id: 2, x: 100 })];
    const walked = walkEnemies(enemies, [makePlayer()]);
    expect(walked[0]?.x).toBe(walked[1]?.x);
  });
});

describe('applyTouchDamage', () => {
  const touching = makeEnemy({ x: PLAYER_RADIUS + ENEMY_RADIUS - 1 });

  it('takes the touch damage from the team when an enemy touches a player (SG-33)', () => {
    const result = applyTouchDamage([touching], [makePlayer()]);
    expect(result.damage).toBe(ENEMY_TOUCH_DAMAGE);
  });

  it('does nothing for an enemy that does not touch', () => {
    const far = makeEnemy({ x: PLAYER_RADIUS + ENEMY_RADIUS + 1 });
    expect(applyTouchDamage([far], [makePlayer()]).damage).toBe(0);
  });

  it('damages at most once per touch interval for each enemy', () => {
    let enemies = [touching];
    let total = 0;
    const steps = STEP_RATE * ENEMY_TOUCH_INTERVAL_SECONDS * 3;
    for (let step = 0; step < steps; step += 1) {
      const result = applyTouchDamage(enemies, [makePlayer()]);
      enemies = [...result.enemies];
      total += result.damage;
    }
    expect(total).toBe(3 * ENEMY_TOUCH_DAMAGE);
  });

  it('counts every touching enemy on its own', () => {
    const result = applyTouchDamage([touching, { ...touching, id: 101 }], [makePlayer()]);
    expect(result.damage).toBe(2 * ENEMY_TOUCH_DAMAGE);
  });

  it('counts one touch for an enemy that touches two players', () => {
    const players = [makePlayer({ playerId: 'a' }), makePlayer({ playerId: 'b' })];
    expect(applyTouchDamage([touching], players).damage).toBe(ENEMY_TOUCH_DAMAGE);
  });
});

describe('removeFarEnemies', () => {
  it('removes enemies farther than the removal distance from every player (SG-31)', () => {
    const players = [makePlayer({ playerId: 'a', x: 0 }), makePlayer({ playerId: 'b', x: 400 })];
    const enemies = [
      makeEnemy({ id: 1, x: -ENEMY_REMOVAL_DISTANCE - 1 }),
      makeEnemy({ id: 2, x: -ENEMY_REMOVAL_DISTANCE }),
      makeEnemy({ id: 3, x: 400 + ENEMY_REMOVAL_DISTANCE + 1 }),
      makeEnemy({ id: 4, x: 1500, y: 0 }),
    ];
    expect(removeFarEnemies(enemies, players).map((enemy) => enemy.id)).toEqual([2, 4]);
  });
});

describe('removeBeatenEnemies', () => {
  it('removes enemies with no health and returns their points and experience (SG-26)', () => {
    const enemies = [
      makeEnemy({ id: 1, health: 0, points: 10 }),
      makeEnemy({ id: 2, health: -5, points: 12 }),
      makeEnemy({ id: 3, health: 1, points: 99 }),
    ];
    const result = removeBeatenEnemies(enemies);
    expect(result.enemies.map((enemy) => enemy.id)).toEqual([3]);
    expect(result.points).toBe(22);
    expect(result.experience).toBe(2 * ENEMY_EXPERIENCE);
  });
});
