import { HEALING_PER_CHOICE, TEAM_HEALTH } from './balance.js';
import { openNextOffer, replaceExhaustedUpgradesInOpenOffers } from './offers.js';
import type { PlayerState, RunState } from './run-state.js';
import { isTeamUpgrade, type UpgradeId } from './upgrades.js';

/** Why a choice cannot be made. The server reports it to the player. */
export type UpgradeChoiceRefusal = 'unknown-player' | 'no-open-offer' | 'not-in-offer';

/**
 * Thrown by the step function when an input holds a choice that is not in the player's current
 * offer. The step changes nothing in that case. The server avoids it by asking
 * `findUpgradeChoiceRefusal` when a message arrives, and reports the reason to that player.
 */
export class UpgradeChoiceRefusedError extends Error {
  override readonly name = 'UpgradeChoiceRefusedError';

  constructor(
    readonly playerId: string,
    readonly upgradeId: UpgradeId,
    readonly reason: UpgradeChoiceRefusal,
  ) {
    super(`Player '${playerId}' cannot choose '${upgradeId}': ${reason}`);
  }
}

export function findUpgradeChoiceRefusal(
  state: RunState,
  playerId: string,
  upgradeId: UpgradeId,
): UpgradeChoiceRefusal | null {
  const player = state.players.find((candidate) => candidate.playerId === playerId);
  if (player === undefined) {
    return 'unknown-player';
  }
  if (player.openOffer === null) {
    return 'no-open-offer';
  }
  return player.openOffer.includes(upgradeId) ? null : 'not-in-offer';
}

function applyEffect(state: RunState, player: PlayerState, upgradeId: UpgradeId): RunState {
  if (!isTeamUpgrade(upgradeId)) {
    const upgradeCounts = {
      ...player.upgradeCounts,
      [upgradeId]: player.upgradeCounts[upgradeId] + 1,
    };
    return {
      ...state,
      players: state.players.map((candidate) =>
        candidate.playerId === player.playerId ? { ...candidate, upgradeCounts } : candidate,
      ),
    };
  }
  const teamUpgradeCounts = {
    ...state.teamUpgradeCounts,
    [upgradeId]: state.teamUpgradeCounts[upgradeId] + 1,
  };
  const teamHealth =
    upgradeId === 'healing'
      ? Math.min(TEAM_HEALTH, state.teamHealth + HEALING_PER_CHOICE)
      : state.teamHealth;
  return { ...state, teamUpgradeCounts, teamHealth };
}

/**
 * Applies a choice from the player's open offer, opens their next waiting offer, and swaps a team
 * upgrade that just reached its limit out of every other open offer (SG-41, SG-43).
 */
export function applyUpgradeChoice(
  state: RunState,
  playerId: string,
  upgradeId: UpgradeId,
): RunState {
  const refusal = findUpgradeChoiceRefusal(state, playerId, upgradeId);
  if (refusal !== null) {
    throw new UpgradeChoiceRefusedError(playerId, upgradeId, refusal);
  }
  const chooser = state.players.find((candidate) => candidate.playerId === playerId);
  if (chooser === undefined) {
    throw new Error('The chooser was found a moment ago and cannot be missing');
  }
  const afterEffect = applyEffect(state, chooser, upgradeId);
  const closed = afterEffect.players.map((player) =>
    player.playerId === playerId ? { ...player, openOffer: null } : player,
  );
  const swapped = replaceExhaustedUpgradesInOpenOffers(
    closed,
    afterEffect.teamUpgradeCounts,
    afterEffect.randomState,
  );
  const chooserAfterSwap = swapped.players.find((candidate) => candidate.playerId === playerId);
  if (chooserAfterSwap === undefined) {
    throw new Error('The chooser was found a moment ago and cannot be missing');
  }
  const opened = openNextOffer(
    chooserAfterSwap,
    afterEffect.teamUpgradeCounts,
    swapped.randomState,
  );
  return {
    ...afterEffect,
    randomState: opened.randomState,
    players: swapped.players.map((player) =>
      player.playerId === playerId ? opened.value : player,
    ),
  };
}
