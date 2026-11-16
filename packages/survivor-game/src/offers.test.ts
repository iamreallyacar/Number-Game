import { describe, expect, it } from 'vitest';
import {
  giveLevelUpOffers,
  isUpgradeChoosable,
  OFFER_SIZE,
  openNextOffer,
  replaceExhaustedUpgradesInOpenOffers,
} from './offers.js';
import { makePlayer } from './test-support.js';
import {
  createIndividualUpgradeCounts,
  createTeamUpgradeCounts,
  UPGRADE_IDS,
  UPGRADE_LIMITS,
  type IndividualUpgradeId,
} from './upgrades.js';

const noTeamChoices = createTeamUpgradeCounts();
const atLimit = (upgradeId: IndividualUpgradeId) => ({
  ...createIndividualUpgradeCounts(),
  [upgradeId]: UPGRADE_LIMITS[upgradeId],
});

describe('isUpgradeChoosable', () => {
  it('counts individual limits for each player (SG-39)', () => {
    const capped = makePlayer({ upgradeCounts: atLimit('damage') });
    expect(isUpgradeChoosable('damage', capped, noTeamChoices)).toBe(false);
    expect(isUpgradeChoosable('damage', makePlayer(), noTeamChoices)).toBe(true);
  });

  it('counts team limits for the whole team (SG-40)', () => {
    const capped = { ...noTeamChoices, 'movement-speed': UPGRADE_LIMITS['movement-speed'] ?? 0 };
    expect(isUpgradeChoosable('movement-speed', makePlayer(), capped)).toBe(false);
  });

  it('never limits healing', () => {
    const many = { ...noTeamChoices, healing: 1000 };
    expect(isUpgradeChoosable('healing', makePlayer(), many)).toBe(true);
  });
});

describe('giveLevelUpOffers', () => {
  it('opens an offer of 3 different upgrades for every player (SG-36)', () => {
    const players = [makePlayer({ playerId: 'a' }), makePlayer({ playerId: 'b' })];
    const result = giveLevelUpOffers(players, noTeamChoices, 5);
    for (const player of result.players) {
      expect(player.openOffer).toHaveLength(OFFER_SIZE);
      expect(new Set(player.openOffer).size).toBe(OFFER_SIZE);
      expect(player.waitingOfferCount).toBe(0);
    }
  });

  it('picks each player offer separately from the random state', () => {
    const players = Array.from({ length: 4 }, (_, index) =>
      makePlayer({ playerId: `p${String(index)}` }),
    );
    const result = giveLevelUpOffers(players, noTeamChoices, 5);
    expect(
      new Set(result.players.map((player) => JSON.stringify(player.openOffer))).size,
    ).toBeGreaterThan(1);
    expect(result.randomState).not.toBe(5);
  });

  it('queues a new offer behind an open one without changing it (SG-37)', () => {
    const open = makePlayer({ openOffer: ['damage', 'piercing', 'healing'] });
    const [queued] = giveLevelUpOffers([open], noTeamChoices, 5).players;
    expect(queued?.openOffer).toEqual(['damage', 'piercing', 'healing']);
    expect(queued?.waitingOfferCount).toBe(1);
  });

  it('shows fewer than 3 when fewer are left to offer, and never an empty offer (SG-42)', () => {
    const everythingCapped = {
      ...createIndividualUpgradeCounts(),
      'more-bullets': UPGRADE_LIMITS['more-bullets'] ?? 0,
      damage: UPGRADE_LIMITS.damage ?? 0,
      piercing: UPGRADE_LIMITS.piercing ?? 0,
      'bullet-size': UPGRADE_LIMITS['bullet-size'] ?? 0,
    };
    const player = makePlayer({ upgradeCounts: everythingCapped });
    const teamCapped = {
      ...noTeamChoices,
      'movement-speed': UPGRADE_LIMITS['movement-speed'] ?? 0,
    };
    const [opened] = giveLevelUpOffers([player], teamCapped, 5).players;
    expect([...(opened?.openOffer ?? [])].sort()).toEqual(['fire-rate', 'healing']);
  });

  it('never puts an upgrade that reached its limit in an offer (SG-41)', () => {
    const player = makePlayer({ upgradeCounts: atLimit('more-bullets') });
    for (let seed = 0; seed < 50; seed += 1) {
      const [opened] = giveLevelUpOffers([player], noTeamChoices, seed).players;
      expect(opened?.openOffer).not.toContain('more-bullets');
    }
  });

  it('offers every upgrade at some point', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 100; seed += 1) {
      const [opened] = giveLevelUpOffers([makePlayer()], noTeamChoices, seed).players;
      opened?.openOffer?.forEach((upgradeId) => seen.add(upgradeId));
    }
    expect([...seen].sort()).toEqual([...UPGRADE_IDS].sort());
  });
});

describe('openNextOffer', () => {
  it('opens a waiting offer and counts it off', () => {
    const waiting = makePlayer({ waitingOfferCount: 2 });
    const { value } = openNextOffer(waiting, noTeamChoices, 3);
    expect(value.openOffer).toHaveLength(OFFER_SIZE);
    expect(value.waitingOfferCount).toBe(1);
  });

  it('leaves no open offer when none is waiting', () => {
    const { value, randomState } = openNextOffer(makePlayer(), noTeamChoices, 3);
    expect(value.openOffer).toBeNull();
    expect(randomState).toBe(3);
  });
});

describe('replaceExhaustedUpgradesInOpenOffers', () => {
  const capped = { ...noTeamChoices, 'movement-speed': UPGRADE_LIMITS['movement-speed'] ?? 0 };

  it('swaps a team upgrade that reached its limit for a different upgrade (SG-43)', () => {
    const player = makePlayer({ openOffer: ['movement-speed', 'damage', 'piercing'] });
    const [result] = replaceExhaustedUpgradesInOpenOffers([player], capped, 4).players;
    expect(result?.openOffer).toHaveLength(3);
    expect(result?.openOffer).not.toContain('movement-speed');
    expect(new Set(result?.openOffer).size).toBe(3);
    expect(result?.openOffer).toEqual(expect.arrayContaining(['damage', 'piercing']));
  });

  it('shortens the offer when nothing else is left to swap in', () => {
    const player = makePlayer({
      openOffer: ['movement-speed', 'healing'],
      upgradeCounts: {
        'more-bullets': UPGRADE_LIMITS['more-bullets'] ?? 0,
        damage: UPGRADE_LIMITS.damage ?? 0,
        piercing: UPGRADE_LIMITS.piercing ?? 0,
        'bullet-size': UPGRADE_LIMITS['bullet-size'] ?? 0,
        'fire-rate': UPGRADE_LIMITS['fire-rate'] ?? 0,
      },
    });
    const [result] = replaceExhaustedUpgradesInOpenOffers([player], capped, 4).players;
    expect(result?.openOffer).toEqual(['healing']);
  });

  it('leaves offers without an exhausted upgrade, and players without an offer, untouched', () => {
    const players = [
      makePlayer({ playerId: 'a', openOffer: ['damage', 'healing'] }),
      makePlayer({ playerId: 'b' }),
    ];
    const result = replaceExhaustedUpgradesInOpenOffers(players, capped, 4);
    expect(result.players).toEqual(players);
    expect(result.randomState).toBe(4);
  });
});
