import { describe, expect, it } from 'vitest';
import { PLAYER_RADIUS, TEAM_HEALTH } from './balance.js';
import { distanceBetween } from './geometry.js';
import { createRun } from './new-run.js';

describe('createRun', () => {
  it('starts with full health, level 1, no score, and nothing in the arena', () => {
    const state = createRun({ playerIds: ['amy'], seed: 7 });
    expect(state).toMatchObject({
      stepCount: 0,
      score: 0,
      teamHealth: TEAM_HEALTH,
      teamLevel: 1,
      teamExperience: 0,
      bullets: [],
      enemies: [],
      endReason: null,
    });
  });

  it('puts every player at the same spot, spread slightly apart (SG-13)', () => {
    const { players } = createRun({ playerIds: ['a', 'b', 'c', 'd'], seed: 1 });
    expect(players).toHaveLength(4);
    for (const first of players) {
      for (const second of players) {
        if (first !== second) {
          expect(distanceBetween(first, second)).toBeGreaterThan(2 * PLAYER_RADIUS);
          expect(distanceBetween(first, second)).toBeLessThan(100);
        }
      }
    }
  });

  it('gives every player no upgrades and no offers', () => {
    const [player] = createRun({ playerIds: ['amy'], seed: 1 }).players;
    expect(player?.openOffer).toBeNull();
    expect(player?.waitingOfferCount).toBe(0);
    expect(Object.values(player?.upgradeCounts ?? {}).every((count) => count === 0)).toBe(true);
  });

  it('keeps the state plain data that survives JSON', () => {
    const state = createRun({ playerIds: ['a', 'b'], seed: 3 });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it.each([
    { problem: 'no players', playerIds: [] },
    { problem: 'five players', playerIds: ['a', 'b', 'c', 'd', 'e'] },
    { problem: 'a repeated player', playerIds: ['a', 'a'] },
  ])('refuses $problem', ({ playerIds }) => {
    expect(() => createRun({ playerIds, seed: 1 })).toThrow(RangeError);
  });
});
