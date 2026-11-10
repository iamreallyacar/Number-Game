import { describe, expect, it } from 'vitest';
import { currentFormatVersion, upgradeStoredValue } from './stored-format.js';

const UPGRADES = [
  (stored: unknown) => ({ upgradedFrom1: stored }),
  (stored: unknown) => ({ upgradedFrom2: stored }),
];

describe('upgradeStoredValue', () => {
  it('counts the newest version from the upgrade list', () => {
    expect(currentFormatVersion([])).toBe(1);
    expect(currentFormatVersion(UPGRADES)).toBe(3);
  });

  it('runs every upgrade after the stored version, in order', () => {
    expect(upgradeStoredValue('old', 1, UPGRADES)).toEqual({
      upgradedFrom2: { upgradedFrom1: 'old' },
    });
    expect(upgradeStoredValue('middle', 2, UPGRADES)).toEqual({ upgradedFrom2: 'middle' });
    expect(upgradeStoredValue('newest', 3, UPGRADES)).toBe('newest');
  });

  it('refuses a version that is newer than the server knows', () => {
    expect(() => upgradeStoredValue('future', 4, UPGRADES)).toThrow('version 4 is unknown');
    expect(() => upgradeStoredValue('broken', 0, UPGRADES)).toThrow('version 0 is unknown');
  });
});
