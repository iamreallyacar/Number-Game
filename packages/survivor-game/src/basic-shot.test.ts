import { describe, expect, it } from 'vitest';
import {
  BULLET_DAMAGE,
  BULLET_FAN_ANGLE_DEGREES,
  BULLET_HITS,
  BULLET_RADIUS,
  BULLET_RANGE,
  BULLET_SPEED,
  ENEMY_RADIUS,
  SHOT_INTERVAL_SECONDS,
  STEP_RATE,
} from './balance.js';
import { fireBasicShots } from './basic-shot.js';
import { moveBullets } from './bullets.js';
import { basicShotStatsOf } from './player-stats.js';
import type { Bullet } from './run-state.js';
import { makeEnemy, makePlayer } from './test-support.js';
import { createIndividualUpgradeCounts } from './upgrades.js';

function makeBullet(overrides: Partial<Bullet> = {}): Bullet {
  return {
    id: 1,
    ownerPlayerId: 'amy',
    x: 0,
    y: 0,
    directionX: 1,
    directionY: 0,
    radius: BULLET_RADIUS,
    damage: BULLET_DAMAGE,
    hitsLeft: BULLET_HITS,
    distanceLeft: BULLET_RANGE,
    hitEnemyIds: [],
    ...overrides,
  };
}

const manyBullets = (count: number) => ({
  ...createIndividualUpgradeCounts(),
  'more-bullets': count - 1,
});

describe('fireBasicShots', () => {
  it('fires at the nearest enemy with the starting values', () => {
    const far = makeEnemy({ id: 1, x: 300, y: 0 });
    const near = makeEnemy({ id: 2, x: 0, y: 200 });
    const fired = fireBasicShots([makePlayer()], [far, near], [], 10);
    expect(fired.bullets).toHaveLength(1);
    const [bullet] = fired.bullets;
    expect(bullet).toMatchObject({
      id: 10,
      ownerPlayerId: 'amy',
      damage: BULLET_DAMAGE,
      radius: BULLET_RADIUS,
      hitsLeft: BULLET_HITS,
      distanceLeft: BULLET_RANGE,
    });
    expect(bullet?.directionX).toBeCloseTo(0);
    expect(bullet?.directionY).toBeCloseTo(1);
    expect(fired.nextEntityId).toBe(11);
  });

  it('waits one shot interval between shots', () => {
    const enemies = [makeEnemy()];
    let players = [makePlayer()];
    let shots = 0;
    const steps = STEP_RATE * SHOT_INTERVAL_SECONDS * 3;
    for (let step = 0; step < steps; step += 1) {
      const fired = fireBasicShots(players, enemies, [], 1);
      players = [...fired.players];
      shots += fired.bullets.length;
    }
    expect(shots).toBe(3);
  });

  it('waits with no enemy in range and fires as soon as one comes into range (SG-23)', () => {
    const outOfRange = makeEnemy({ x: BULLET_RANGE + 1 });
    const waiting = fireBasicShots([makePlayer()], [outOfRange], [], 1);
    expect(waiting.bullets).toHaveLength(0);
    expect(waiting.players[0]?.shotCooldownSteps).toBe(0);
    const fired = fireBasicShots(waiting.players, [makeEnemy({ x: BULLET_RANGE })], [], 1);
    expect(fired.bullets).toHaveLength(1);
  });

  it('fires a fan centred on the nearest enemy (SG-24)', () => {
    const player = makePlayer({ upgradeCounts: manyBullets(3) });
    const { bullets } = fireBasicShots([player], [makeEnemy({ x: 100, y: 0 })], [], 1);
    const angles = bullets.map((bullet) => Math.atan2(bullet.directionY, bullet.directionX));
    const gap = (BULLET_FAN_ANGLE_DEGREES * Math.PI) / 180;
    expect(angles[0]).toBeCloseTo(-gap);
    expect(angles[1]).toBeCloseTo(0);
    expect(angles[2]).toBeCloseTo(gap);
    expect(new Set(bullets.map((bullet) => bullet.id)).size).toBe(3);
  });

  it('centres a fan of an even number of bullets on the enemy too', () => {
    const player = makePlayer({ upgradeCounts: manyBullets(2) });
    const { bullets } = fireBasicShots([player], [makeEnemy({ x: 100, y: 0 })], [], 1);
    const angles = bullets.map((bullet) => Math.atan2(bullet.directionY, bullet.directionX));
    const halfGap = ((BULLET_FAN_ANGLE_DEGREES / 2) * Math.PI) / 180;
    expect(BULLET_FAN_ANGLE_DEGREES).toBe(10);
    expect(angles[0]).toBeCloseTo(-halfGap);
    expect(angles[1]).toBeCloseTo(halfGap);
  });

  it('gives every bullet the upgrades chosen at the moment of firing', () => {
    const counts = { ...createIndividualUpgradeCounts(), damage: 2, piercing: 1, 'bullet-size': 1 };
    const { bullets } = fireBasicShots(
      [makePlayer({ upgradeCounts: counts })],
      [makeEnemy()],
      [],
      1,
    );
    expect(bullets[0]).toMatchObject({ damage: 20, hitsLeft: 2, radius: BULLET_RADIUS + 2 });
  });
});

describe('basicShotStatsOf', () => {
  // The interval is rounded to whole steps. 0.9 s is exactly 27 steps, so rounding does not matter
  // there. Eight choices give 12.91 steps, which only the rounding to nearest turns into 13.
  it('shortens the interval by 10 percent of the last one for each fire rate choice (SB-07)', () => {
    const withChoices = (count: number) => ({
      ...createIndividualUpgradeCounts(),
      'fire-rate': count,
    });
    expect(basicShotStatsOf(withChoices(0)).shotIntervalSteps).toBe(30);
    expect(basicShotStatsOf(withChoices(1)).shotIntervalSteps).toBe(27);
    expect(basicShotStatsOf(withChoices(8)).shotIntervalSteps).toBe(13);
  });
});

describe('moveBullets', () => {
  it('flies straight at the bullet speed without following enemies', () => {
    const moved = moveBullets(
      [makeBullet({ directionX: 0, directionY: 1 })],
      [makeEnemy({ x: 1000, y: 0 })],
    );
    expect(moved.bullets[0]?.x).toBe(0);
    expect(moved.bullets[0]?.y).toBeCloseTo(BULLET_SPEED / STEP_RATE);
  });

  it('damages an enemy it touches and disappears after its last hit (SG-22)', () => {
    const moved = moveBullets([makeBullet()], [makeEnemy({ x: 20 })]);
    expect(moved.enemies[0]?.health).toBe(20 - BULLET_DAMAGE);
    expect(moved.bullets).toHaveLength(0);
  });

  it('does not touch an enemy just out of reach', () => {
    const reach = BULLET_RADIUS + ENEMY_RADIUS;
    const moved = moveBullets(
      [makeBullet()],
      [makeEnemy({ x: BULLET_SPEED / STEP_RATE + reach + 1 })],
    );
    expect(moved.enemies[0]?.health).toBe(20);
    expect(moved.bullets).toHaveLength(1);
  });

  it('damages each enemy once and goes on while it has hits left', () => {
    const bullet = makeBullet({ hitsLeft: 3 });
    const enemies = [makeEnemy({ id: 1, x: 10 }), makeEnemy({ id: 2, x: 12 })];
    const first = moveBullets([bullet], enemies);
    expect(first.enemies.map((enemy) => enemy.health)).toEqual([10, 10]);
    expect(first.bullets[0]).toMatchObject({ hitsLeft: 1, hitEnemyIds: [1, 2] });
    const second = moveBullets(first.bullets, first.enemies);
    expect(second.enemies.map((enemy) => enemy.health)).toEqual([10, 10]);
  });

  it('stops at the number of hits it can make when enemies overlap', () => {
    const enemies = [makeEnemy({ id: 1, x: 10 }), makeEnemy({ id: 2, x: 12 })];
    const moved = moveBullets([makeBullet({ hitsLeft: 1 })], enemies);
    expect(moved.enemies.map((enemy) => enemy.health)).toEqual([10, 20]);
  });

  it('disappears when it has flown its range', () => {
    const last = moveBullets([makeBullet({ distanceLeft: 5 })], []);
    expect(last.bullets).toHaveLength(0);
    const flying = moveBullets([makeBullet({ distanceLeft: 100 })], []);
    expect(flying.bullets[0]?.distanceLeft).toBeCloseTo(100 - BULLET_SPEED / STEP_RATE);
  });
});
