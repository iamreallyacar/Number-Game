import { describe, expect, it } from 'vitest';
import { PLAYER_SPEED } from './balance.js';
import { basicShotStatsOf, playerSpeedOf } from './player-stats.js';
import {
  createIndividualUpgradeCounts,
  createTeamUpgradeCounts,
  isTeamUpgrade,
  isUpgradeId,
  UPGRADE_IDS,
  UPGRADE_LIMITS,
} from './upgrades.js';

describe('the upgrade list of SB-07', () => {
  it('has the limits of the table, and no limit for healing', () => {
    expect(UPGRADE_LIMITS).toEqual({
      'more-bullets': 4,
      damage: 10,
      piercing: 5,
      'bullet-size': 5,
      'fire-rate': 8,
      'movement-speed': 6,
      healing: null,
    });
  });

  it('tells team upgrades from individual ones', () => {
    expect(UPGRADE_IDS.filter(isTeamUpgrade)).toEqual(['movement-speed', 'healing']);
    expect(isUpgradeId('damage')).toBe(true);
    expect(isUpgradeId('nonsense')).toBe(false);
  });

  it('reaches the values at the limit of the table', () => {
    const counts = {
      'more-bullets': 4,
      damage: 10,
      piercing: 5,
      'bullet-size': 5,
      'fire-rate': 0,
    };
    expect(basicShotStatsOf(counts)).toMatchObject({
      bulletsPerShot: 5,
      damage: 60,
      hitsPerBullet: 6,
      bulletRadius: 16,
    });
    expect(playerSpeedOf({ ...createTeamUpgradeCounts(), 'movement-speed': 6 })).toBe(208);
    expect(playerSpeedOf(createTeamUpgradeCounts())).toBe(PLAYER_SPEED);
    expect(basicShotStatsOf(createIndividualUpgradeCounts()).bulletsPerShot).toBe(1);
  });
});
