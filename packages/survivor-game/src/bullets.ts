import { BULLET_SPEED, ENEMY_RADIUS } from './balance.js';
import type { Bullet, Enemy } from './run-state.js';
import { SECONDS_PER_STEP } from './timing.js';

export interface BulletsMoved {
  readonly bullets: readonly Bullet[];
  /** Every enemy, with the damage of this step taken off its health. Beaten ones are still in. */
  readonly enemies: readonly Enemy[];
}

function touchesEnemy(bullet: Bullet, enemy: Enemy): boolean {
  const reach = bullet.radius + ENEMY_RADIUS;
  const deltaX = enemy.x - bullet.x;
  const deltaY = enemy.y - bullet.y;
  return deltaX * deltaX + deltaY * deltaY < reach * reach;
}

/**
 * Flies every bullet one step and damages the enemies it touches, each enemy once per bullet
 * (SG-21). A bullet disappears when it has used up its hits or flown its range (SG-22).
 */
export function moveBullets(bullets: readonly Bullet[], enemies: readonly Enemy[]): BulletsMoved {
  const healthByEnemyIndex = enemies.map((enemy) => enemy.health);
  const survivingBullets: Bullet[] = [];
  for (const bullet of bullets) {
    const travelled = Math.min(BULLET_SPEED * SECONDS_PER_STEP, bullet.distanceLeft);
    const flown: Bullet = {
      ...bullet,
      x: bullet.x + bullet.directionX * travelled,
      y: bullet.y + bullet.directionY * travelled,
      distanceLeft: bullet.distanceLeft - travelled,
    };
    const hitEnemyIds = [...bullet.hitEnemyIds];
    let hitsLeft = bullet.hitsLeft;
    enemies.forEach((enemy, enemyIndex) => {
      if (hitsLeft > 0 && !hitEnemyIds.includes(enemy.id) && touchesEnemy(flown, enemy)) {
        healthByEnemyIndex[enemyIndex] = (healthByEnemyIndex[enemyIndex] ?? 0) - bullet.damage;
        hitEnemyIds.push(enemy.id);
        hitsLeft -= 1;
      }
    });
    if (hitsLeft > 0 && flown.distanceLeft > 0) {
      survivingBullets.push({ ...flown, hitsLeft, hitEnemyIds });
    }
  }
  return {
    bullets: survivingBullets,
    enemies: enemies.map((enemy, index) => ({
      ...enemy,
      health: healthByEnemyIndex[index] ?? enemy.health,
    })),
  };
}
