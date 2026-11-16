import { describe, expect, it } from 'vitest';
import { parseRunStateReport } from './parse-state-report.js';
import { buildRunStateReport } from './state-report.js';
import { makeEnemy, makePlayer, makeRun, withPlayers } from './test-support.js';
import type { Bullet } from './run-state.js';

const bullet: Bullet = {
  id: 7,
  ownerPlayerId: 'amy',
  x: 10.123456,
  y: -3.987654,
  directionX: 0.6000001,
  directionY: 0.7999999,
  radius: 6,
  damage: 10,
  hitsLeft: 1,
  distanceLeft: 400.5,
  hitEnemyIds: [3, 4],
};

describe('buildRunStateReport', () => {
  const run = {
    ...withPlayers(makeRun(['amy']), [makePlayer({ x: 1.2345678, y: -9.87654321 })]),
    bullets: [bullet],
    enemies: [makeEnemy({ id: 3, x: 100.04999, y: 55.55 })],
  };

  it('rounds positions to one decimal', () => {
    expect(buildRunStateReport(run)).toMatchObject({
      players: [{ x: 1.2, y: -9.9 }],
      bullets: [{ id: 7, x: 10.1, y: -4 }],
      enemies: [{ id: 3, x: 100, y: 55.6 }],
    });
  });

  it('leaves out what a browser never reads', () => {
    const report = buildRunStateReport(run);
    expect(Object.keys(report)).not.toContain('randomState');
    expect(report.bullets[0]).toEqual({ id: 7, x: 10.1, y: -4, radius: 6 });
    expect(report.enemies[0]).toEqual({ id: 3, x: 100, y: 55.6 });
    expect(report.players[0]).not.toHaveProperty('shotCooldownSteps');
  });

  it('does not change the run it reports from', () => {
    buildRunStateReport(run);
    expect(run.players[0]?.x).toBe(1.2345678);
    expect(run.bullets[0]?.x).toBe(10.123456);
  });

  it('is read back by its parser after going through JSON', () => {
    const report = buildRunStateReport(run);
    expect(parseRunStateReport(JSON.parse(JSON.stringify(report)))).toEqual(report);
  });
});
