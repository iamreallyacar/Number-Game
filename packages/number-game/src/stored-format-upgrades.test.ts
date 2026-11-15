import { describe, expect, it } from 'vitest';
import { GAME_STATE_UPGRADES, SUMMARY_DETAILS_UPGRADES } from './stored-format-upgrades.js';

const [upgradeGameState] = GAME_STATE_UPGRADES;
const [upgradeSummaryDetails] = SUMMARY_DETAILS_UPGRADES;

describe('removing the stored width', () => {
  it('moves both formats to version 2', () => {
    expect(GAME_STATE_UPGRADES).toHaveLength(1);
    expect(SUMMARY_DETAILS_UPGRADES).toHaveLength(1);
  });

  it('drops the width of a width 10 game state and keeps every other field', () => {
    const stored = { width: 10, cells: [1, 9], score: 4, stage: 2 };
    expect(upgradeGameState?.(stored)).toEqual({ cells: [1, 9], score: 4, stage: 2 });
  });

  it('drops the width of width 10 summary details and keeps every other field', () => {
    const stored = { stage: 3, width: 10, difficulty: 'hard' };
    expect(upgradeSummaryDetails?.(stored)).toEqual({ stage: 3, difficulty: 'hard' });
  });

  it.each([
    { name: 'width 11', stored: { width: 11 } },
    { name: 'width 12', stored: { width: 12 } },
    { name: 'a missing width', stored: { stage: 1 } },
    { name: 'a text width', stored: { width: '10' } },
  ])('throws on $name', ({ stored }) => {
    expect(() => upgradeGameState?.(stored)).toThrow('width must be 10');
    expect(() => upgradeSummaryDetails?.(stored)).toThrow('width must be 10');
  });

  it.each([null, 'text', [10]])('throws on %j, which is not an object', (stored) => {
    expect(() => upgradeGameState?.(stored)).toThrow('expected an object');
    expect(() => upgradeSummaryDetails?.(stored)).toThrow('expected an object');
  });
});
