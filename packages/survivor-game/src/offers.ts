import { drawRandomItem, type RandomDraw, type RandomState } from '@local/seeded-random';
import type { PlayerState } from './run-state.js';
import {
  isTeamUpgrade,
  UPGRADE_IDS,
  UPGRADE_LIMITS,
  type TeamUpgradeCounts,
  type UpgradeId,
} from './upgrades.js';

/** An offer has 3 different upgrades (SG-36), or fewer when not enough are left (SG-42). */
export const OFFER_SIZE = 3;

export interface PlayersWithOffers {
  readonly players: readonly PlayerState[];
  readonly randomState: RandomState;
}

/** Whether the upgrade has not reached its limit yet, for this player or for the team (SG-41). */
export function isUpgradeChoosable(
  upgradeId: UpgradeId,
  player: PlayerState,
  teamCounts: TeamUpgradeCounts,
): boolean {
  const limit = UPGRADE_LIMITS[upgradeId];
  if (limit === null) {
    return true;
  }
  const choicesMade = isTeamUpgrade(upgradeId)
    ? teamCounts[upgradeId]
    : player.upgradeCounts[upgradeId];
  return choicesMade < limit;
}

function drawUpgrades(
  candidates: readonly UpgradeId[],
  count: number,
  randomState: RandomState,
): RandomDraw<readonly UpgradeId[]> {
  const drawn: UpgradeId[] = [];
  let remaining = candidates;
  let currentState = randomState;
  while (drawn.length < count && remaining.length > 0) {
    const draw = drawRandomItem(currentState, remaining);
    currentState = draw.randomState;
    drawn.push(draw.value);
    remaining = remaining.filter((upgradeId) => upgradeId !== draw.value);
  }
  return { value: drawn, randomState: currentState };
}

function drawOfferFor(
  player: PlayerState,
  teamCounts: TeamUpgradeCounts,
  randomState: RandomState,
): RandomDraw<readonly UpgradeId[]> {
  const choosable = UPGRADE_IDS.filter((upgradeId) =>
    isUpgradeChoosable(upgradeId, player, teamCounts),
  );
  return drawUpgrades(choosable, OFFER_SIZE, randomState);
}

/** Opens the player's next waiting offer, if there is one. */
export function openNextOffer(
  player: PlayerState,
  teamCounts: TeamUpgradeCounts,
  randomState: RandomState,
): RandomDraw<PlayerState> {
  if (player.waitingOfferCount === 0) {
    return { value: { ...player, openOffer: null }, randomState };
  }
  const offer = drawOfferFor(player, teamCounts, randomState);
  return {
    value: {
      ...player,
      openOffer: offer.value,
      waitingOfferCount: player.waitingOfferCount - 1,
    },
    randomState: offer.randomState,
  };
}

/** Gives every player one more offer, each picked separately. It queues behind an open one (SG-36, SG-37). */
export function giveLevelUpOffers(
  players: readonly PlayerState[],
  teamCounts: TeamUpgradeCounts,
  randomState: RandomState,
): PlayersWithOffers {
  let currentState = randomState;
  const updated = players.map((player) => {
    const queued = { ...player, waitingOfferCount: player.waitingOfferCount + 1 };
    if (player.openOffer !== null) {
      return queued;
    }
    const opened = openNextOffer(queued, teamCounts, currentState);
    currentState = opened.randomState;
    return opened.value;
  });
  return { players: updated, randomState: currentState };
}

/**
 * Swaps every upgrade in an open offer that has reached its limit for a different one that is not
 * in the offer yet (SG-43). If none is left to swap in, the offer gets shorter.
 */
export function replaceExhaustedUpgradesInOpenOffers(
  players: readonly PlayerState[],
  teamCounts: TeamUpgradeCounts,
  randomState: RandomState,
): PlayersWithOffers {
  let currentState = randomState;
  const updated = players.map((player) => {
    const offer = player.openOffer;
    if (offer === null) {
      return player;
    }
    const kept = offer.filter((upgradeId) => isUpgradeChoosable(upgradeId, player, teamCounts));
    if (kept.length === offer.length) {
      return player;
    }
    const spare = UPGRADE_IDS.filter(
      (upgradeId) => !kept.includes(upgradeId) && isUpgradeChoosable(upgradeId, player, teamCounts),
    );
    const replacements = drawUpgrades(spare, offer.length - kept.length, currentState);
    currentState = replacements.randomState;
    return { ...player, openOffer: [...kept, ...replacements.value] };
  });
  return { players: updated, randomState: currentState };
}
