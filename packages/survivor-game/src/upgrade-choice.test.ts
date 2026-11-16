import { describe, expect, it } from 'vitest';
import { HEALING_PER_CHOICE, TEAM_HEALTH } from './balance.js';
import {
  applyUpgradeChoice,
  findUpgradeChoiceRefusal,
  UpgradeChoiceRefusedError,
} from './upgrade-choice.js';
import { makePlayer, makeRun, withPlayers } from './test-support.js';
import { UPGRADE_LIMITS } from './upgrades.js';

const offer = ['damage', 'movement-speed', 'healing'] as const;

function runWithOffers() {
  return withPlayers(makeRun(['a', 'b']), [
    makePlayer({ playerId: 'a', openOffer: offer }),
    makePlayer({ playerId: 'b', openOffer: ['movement-speed', 'piercing', 'fire-rate'] }),
  ]);
}

function player(state: ReturnType<typeof makeRun>, playerId: string) {
  const found = state.players.find((candidate) => candidate.playerId === playerId);
  if (found === undefined) {
    throw new Error('missing player');
  }
  return found;
}

describe('findUpgradeChoiceRefusal', () => {
  it('accepts an upgrade from the open offer', () => {
    expect(findUpgradeChoiceRefusal(runWithOffers(), 'a', 'damage')).toBeNull();
  });

  it('refuses an upgrade that is not in the open offer', () => {
    expect(findUpgradeChoiceRefusal(runWithOffers(), 'a', 'piercing')).toBe('not-in-offer');
  });

  it('refuses a choice with no open offer', () => {
    expect(findUpgradeChoiceRefusal(makeRun(), 'amy', 'damage')).toBe('no-open-offer');
  });

  it('refuses an unknown player', () => {
    expect(findUpgradeChoiceRefusal(makeRun(), 'zed', 'damage')).toBe('unknown-player');
  });
});

describe('applyUpgradeChoice', () => {
  it('changes only the chooser for an individual upgrade (SG-39)', () => {
    const next = applyUpgradeChoice(runWithOffers(), 'a', 'damage');
    expect(player(next, 'a').upgradeCounts.damage).toBe(1);
    expect(player(next, 'b').upgradeCounts.damage).toBe(0);
    expect(player(next, 'a').openOffer).toBeNull();
  });

  it('counts a team upgrade for the whole team (SG-40)', () => {
    const next = applyUpgradeChoice(runWithOffers(), 'a', 'movement-speed');
    expect(next.teamUpgradeCounts['movement-speed']).toBe(1);
  });

  it('heals up to full health and no further', () => {
    const hurt = { ...runWithOffers(), teamHealth: 50 };
    expect(applyUpgradeChoice(hurt, 'a', 'healing').teamHealth).toBe(50 + HEALING_PER_CHOICE);
    const almostFull = { ...runWithOffers(), teamHealth: TEAM_HEALTH - 1 };
    expect(applyUpgradeChoice(almostFull, 'a', 'healing').teamHealth).toBe(TEAM_HEALTH);
  });

  it('opens the next waiting offer after a choice (SG-37)', () => {
    const queued = withPlayers(makeRun(), [makePlayer({ openOffer: offer, waitingOfferCount: 2 })]);
    const next = applyUpgradeChoice(queued, 'amy', 'damage');
    expect(next.players[0]?.openOffer).toHaveLength(3);
    expect(next.players[0]?.waitingOfferCount).toBe(1);
  });

  it('swaps a team upgrade that reached its limit out of the other open offers (SG-43)', () => {
    const limit = UPGRADE_LIMITS['movement-speed'] ?? 0;
    const almost = {
      ...runWithOffers(),
      teamUpgradeCounts: { 'movement-speed': limit - 1, healing: 0 },
    };
    const next = applyUpgradeChoice(almost, 'a', 'movement-speed');
    expect(next.teamUpgradeCounts['movement-speed']).toBe(limit);
    expect(player(next, 'b').openOffer).not.toContain('movement-speed');
    expect(player(next, 'b').openOffer).toHaveLength(3);
  });

  it('counts every choice of an individual upgrade up to its limit (SG-41)', () => {
    const limit = UPGRADE_LIMITS.piercing ?? 0;
    let state = withPlayers(makeRun(), [makePlayer()]);
    for (let choice = 0; choice < limit; choice += 1) {
      state = withPlayers(state, [{ ...player(state, 'amy'), openOffer: ['piercing'] }]);
      state = applyUpgradeChoice(state, 'amy', 'piercing');
    }
    expect(player(state, 'amy').upgradeCounts.piercing).toBe(limit);
  });

  it('throws a refusal the server can report, and changes nothing', () => {
    const state = runWithOffers();
    let caught: unknown;
    try {
      applyUpgradeChoice(state, 'a', 'piercing');
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(UpgradeChoiceRefusedError);
    expect(caught).toMatchObject({ playerId: 'a', upgradeId: 'piercing', reason: 'not-in-offer' });
  });
});
