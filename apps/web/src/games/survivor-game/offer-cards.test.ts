import { createRun, type PlayerState, type RunState } from '@local/survivor-game';
import { describe, expect, it } from 'vitest';
import { describeOffer, OfferChoiceGuard, offerIndexForKey } from './offer-cards.js';

const baseRun: RunState = createRun({ playerIds: ['Sam'], seed: 1 });
const [firstPlayer] = baseRun.players;
if (firstPlayer === undefined) {
  throw new Error('The test run needs a player');
}
const basePlayer: PlayerState = firstPlayer;

function playerWith(overrides: Partial<PlayerState>): PlayerState {
  return { ...basePlayer, ...overrides };
}

describe('describeOffer', () => {
  it('has no cards without an open offer', () => {
    expect(describeOffer(baseRun, playerWith({ openOffer: null }))).toBeNull();
  });

  it('gives each upgrade a title, an effect, a scope, and its progress', () => {
    const player = playerWith({
      openOffer: ['more-bullets', 'movement-speed', 'healing'],
      waitingOfferCount: 2,
      upgradeCounts: { ...basePlayer.upgradeCounts, 'more-bullets': 1 },
    });
    const run = { ...baseRun, teamUpgradeCounts: { 'movement-speed': 3, healing: 5 } };
    const offer = describeOffer(run, player);
    expect(offer?.queuedCount).toBe(2);
    expect(offer?.cards).toEqual([
      {
        upgradeId: 'more-bullets',
        title: 'More bullets',
        effect: '1 more bullet per shot',
        scope: 'You',
        progress: '1 of 4 chosen',
      },
      {
        upgradeId: 'movement-speed',
        title: 'Movement speed',
        effect: 'Everyone moves 8 faster',
        scope: 'Team',
        progress: '3 of 6 chosen',
      },
      {
        upgradeId: 'healing',
        title: 'Healing',
        effect: 'The team heals 20 health',
        scope: 'Team',
        progress: null,
      },
    ]);
  });
});

describe('offerIndexForKey', () => {
  it('maps the number keys, on the row and on the number pad, to cards', () => {
    expect(offerIndexForKey('Digit1')).toBe(0);
    expect(offerIndexForKey('Numpad3')).toBe(2);
    expect(offerIndexForKey('KeyA')).toBeNull();
    expect(offerIndexForKey('Digit0')).toBeNull();
  });
});

describe('OfferChoiceGuard', () => {
  const offered = playerWith({
    openOffer: ['damage', 'piercing', 'healing'],
    waitingOfferCount: 1,
  });

  it('chooses the card at the index, once for an offer', () => {
    const guard = new OfferChoiceGuard();
    expect(guard.choose(offered, 1)).toBe('piercing');
    expect(guard.choose(offered, 0)).toBeNull();
  });

  it('allows a choice again when the next offer opens', () => {
    const guard = new OfferChoiceGuard();
    guard.choose(offered, 0);
    const next = playerWith({ openOffer: ['damage', 'piercing', 'healing'], waitingOfferCount: 0 });
    expect(guard.choose(next, 0)).toBe('damage');
  });

  it('allows a choice on an identical offer that opens after the answered one closed', () => {
    const lastOffer = playerWith({
      openOffer: ['damage', 'piercing', 'healing'],
      waitingOfferCount: 0,
    });
    const guard = new OfferChoiceGuard();
    expect(guard.choose(lastOffer, 0)).toBe('damage');
    guard.handleReportedPlayer(playerWith({ openOffer: null }));
    expect(guard.choose(lastOffer, 0)).toBe('damage');
  });

  it('chooses nothing for a card that is not there or when there is no offer', () => {
    const guard = new OfferChoiceGuard();
    expect(guard.choose(offered, 5)).toBeNull();
    expect(guard.choose(playerWith({ openOffer: null }), 0)).toBeNull();
  });

  it('allows a choice again once the connection is not open, since the choice may be lost', () => {
    const guard = new OfferChoiceGuard();
    guard.choose(offered, 0);
    guard.handleConnectionStatus({ kind: 'open' });
    expect(guard.choose(offered, 0)).toBeNull();
    guard.handleConnectionStatus({ kind: 'reconnecting', attempt: 1, retryInMs: 500 });
    expect(guard.choose(offered, 0)).toBe('damage');
  });

  it('allows a choice again after the server refused one', () => {
    const guard = new OfferChoiceGuard();
    guard.choose(offered, 0);
    guard.clear();
    expect(guard.choose(offered, 0)).toBe('damage');
  });
});
