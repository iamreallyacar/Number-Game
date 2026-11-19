import {
  balance,
  isTeamUpgrade,
  UPGRADE_LIMITS,
  UPGRADE_TITLES,
  type ReportedPlayer,
  type RunStateReport,
  type UpgradeId,
} from '@local/survivor-game';
import type { ConnectionStatus } from '../../rooms/reconnecting-socket.js';

/** The effect of one choice, as short text built from the balance values (SB-07). */
const UPGRADE_EFFECTS: Readonly<Record<UpgradeId, string>> = {
  'more-bullets': `${String(balance.MORE_BULLETS_PER_CHOICE)} more bullet per shot`,
  damage: `${String(balance.DAMAGE_PER_CHOICE)} more damage per bullet`,
  piercing: `Bullets hit ${String(balance.PIERCING_PER_CHOICE)} more enemy`,
  'bullet-size': `Bullets are ${String(balance.BULLET_SIZE_PER_CHOICE)} bigger`,
  'fire-rate': `${String(Math.round(balance.FIRE_RATE_REDUCTION_PER_CHOICE * 100))} percent less time between shots`,
  'movement-speed': `Everyone moves ${String(balance.MOVEMENT_SPEED_PER_CHOICE)} faster`,
  healing: `The team heals ${String(balance.HEALING_PER_CHOICE)} health`,
};

export interface OfferCard {
  readonly upgradeId: UpgradeId;
  readonly title: string;
  readonly effect: string;
  /** Who the upgrade changes (SG-39, SG-40). */
  readonly scope: 'You' | 'Team';
  /** How often it was chosen, such as "1 of 4 chosen", or null for an upgrade with no limit. */
  readonly progress: string | null;
}

export interface OfferView {
  readonly cards: readonly OfferCard[];
  /** Offers waiting behind this one (SG-55). */
  readonly queuedCount: number;
}

function countChosen(state: RunStateReport, player: ReportedPlayer, upgradeId: UpgradeId): number {
  return isTeamUpgrade(upgradeId)
    ? state.teamUpgradeCounts[upgradeId]
    : player.upgradeCounts[upgradeId];
}

function describeProgress(chosen: number, limit: number | null): string | null {
  return limit === null ? null : `${String(chosen)} of ${String(limit)} chosen`;
}

/** The cards of the player's open offer, or null when the player has none (SG-36, SG-55). */
export function describeOffer(state: RunStateReport, player: ReportedPlayer): OfferView | null {
  if (player.openOffer === null) {
    return null;
  }
  return {
    cards: player.openOffer.map((upgradeId) => ({
      upgradeId,
      title: UPGRADE_TITLES[upgradeId],
      effect: UPGRADE_EFFECTS[upgradeId],
      scope: isTeamUpgrade(upgradeId) ? 'Team' : 'You',
      progress: describeProgress(countChosen(state, player, upgradeId), UPGRADE_LIMITS[upgradeId]),
    })),
    queuedCount: player.waitingOfferCount,
  };
}

const OFFER_KEY_PATTERN = /^(?:Digit|Numpad)([1-9])$/;

/** The card a key chooses: 1 is the first card. Other keys choose nothing. */
export function offerIndexForKey(code: string): number | null {
  const digit = OFFER_KEY_PATTERN.exec(code)?.[1];
  return digit === undefined ? null : Number(digit) - 1;
}

/**
 * Stops a second tap on the same offer from choosing again before the server has opened the next
 * offer, which could pick a card the player never saw.
 */
export class OfferChoiceGuard {
  private choiceMadeOn: string | null = null;

  /** The upgrade to send for a card of the open offer, or null for a card that is not there or an offer already answered. */
  choose(player: ReportedPlayer, cardIndex: number): UpgradeId | null {
    const offerKey = offerKeyOf(player);
    const upgradeId = player.openOffer?.[cardIndex];
    if (offerKey === null || upgradeId === undefined || offerKey === this.choiceMadeOn) {
      return null;
    }
    this.choiceMadeOn = offerKey;
    return upgradeId;
  }

  /**
   * Call for every state reported for the own player. Once the offer has closed, the answer is
   * done, so an identical offer opening later (same cards, same queue) is a new one.
   */
  handleReportedPlayer(player: ReportedPlayer): void {
    if (player.openOffer === null) {
      this.clear();
    }
  }

  /**
   * A choice sent just before the connection dropped may never have been applied, and the server
   * shows the same offer again after reconnecting, so only an open connection keeps the guard.
   */
  handleConnectionStatus(status: ConnectionStatus): void {
    if (status.kind !== 'open') {
      this.clear();
    }
  }

  /** Lets the player choose again, for a choice the server refused. */
  clear(): void {
    this.choiceMadeOn = null;
  }
}

function offerKeyOf(player: ReportedPlayer): string | null {
  return player.openOffer === null
    ? null
    : `${player.openOffer.join(',')}|${String(player.waitingOfferCount)}`;
}
