import type { RandomState } from '@local/seeded-random';
import type { IndividualUpgradeCounts, TeamUpgradeCounts, UpgradeId } from './upgrades.js';

/** Why a run ended: the team's health reached 0 (SG-48), or nobody was connected for too long (SG-47). */
export type RunEndReason = 'defeat' | 'abandoned';

export interface PlayerState {
  readonly playerId: string;
  readonly x: number;
  readonly y: number;
  readonly upgradeCounts: IndividualUpgradeCounts;
  /** Steps left until the basic shot may fire. 0 means it fires as soon as an enemy is in range. */
  readonly shotCooldownSteps: number;
  /** The offer the player is choosing from now, or null when there is none (SG-36). */
  readonly openOffer: readonly UpgradeId[] | null;
  /** Offers waiting behind the open one (SG-37). Their upgrades are picked when they open. */
  readonly waitingOfferCount: number;
}

export interface Bullet {
  readonly id: number;
  readonly ownerPlayerId: string;
  readonly x: number;
  readonly y: number;
  /** A unit vector. A bullet flies straight and never follows its target (SG-21). */
  readonly directionX: number;
  readonly directionY: number;
  readonly radius: number;
  readonly damage: number;
  readonly hitsLeft: number;
  readonly distanceLeft: number;
  /** Enemies this bullet already damaged, since it damages each enemy once (SG-21). */
  readonly hitEnemyIds: readonly number[];
}

export interface Enemy {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly health: number;
  readonly points: number;
  /** Steps until this enemy may damage the team again (SG-33). */
  readonly touchCooldownSteps: number;
}

/**
 * Everything a run needs to continue, as plain data that survives JSON. The server sends it to
 * the browsers, and the browsers only draw it. It has no clock and no connection information.
 */
export interface RunState {
  /** Steps taken so far. Time survived is this divided by STEP_RATE. */
  readonly stepCount: number;
  readonly randomState: RandomState;
  readonly score: number;
  readonly teamHealth: number;
  readonly teamLevel: number;
  /** Experience gained towards the next level. */
  readonly teamExperience: number;
  readonly teamUpgradeCounts: TeamUpgradeCounts;
  readonly players: readonly PlayerState[];
  readonly bullets: readonly Bullet[];
  readonly enemies: readonly Enemy[];
  readonly nextEntityId: number;
  /** The part of an enemy that has not appeared yet, carried over to the next step. */
  readonly enemySpawnCarry: number;
  readonly endReason: RunEndReason | null;
}
