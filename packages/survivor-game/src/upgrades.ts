import {
  DAMAGE_LIMIT,
  FIRE_RATE_LIMIT,
  BULLET_SIZE_LIMIT,
  MORE_BULLETS_LIMIT,
  MOVEMENT_SPEED_LIMIT,
  PIERCING_LIMIT,
} from './balance.js';

/** The upgrades that change only the player who chose them (SG-39). */
export const INDIVIDUAL_UPGRADE_IDS = [
  'more-bullets',
  'damage',
  'piercing',
  'bullet-size',
  'fire-rate',
] as const;

/** The upgrades that change every player (SG-40). */
export const TEAM_UPGRADE_IDS = ['movement-speed', 'healing'] as const;

export type IndividualUpgradeId = (typeof INDIVIDUAL_UPGRADE_IDS)[number];
export type TeamUpgradeId = (typeof TEAM_UPGRADE_IDS)[number];
export type UpgradeId = IndividualUpgradeId | TeamUpgradeId;

export const UPGRADE_IDS: readonly UpgradeId[] = [...INDIVIDUAL_UPGRADE_IDS, ...TEAM_UPGRADE_IDS];

/** How often an upgrade can be chosen (SG-41). Null means it has no limit. */
export const UPGRADE_LIMITS: Readonly<Record<UpgradeId, number | null>> = {
  'more-bullets': MORE_BULLETS_LIMIT,
  damage: DAMAGE_LIMIT,
  piercing: PIERCING_LIMIT,
  'bullet-size': BULLET_SIZE_LIMIT,
  'fire-rate': FIRE_RATE_LIMIT,
  'movement-speed': MOVEMENT_SPEED_LIMIT,
  healing: null,
};

/** How the player sees each upgrade on a card. The rules do not use it. */
export const UPGRADE_TITLES: Readonly<Record<UpgradeId, string>> = {
  'more-bullets': 'More bullets',
  damage: 'Damage',
  piercing: 'Piercing',
  'bullet-size': 'Bullet size',
  'fire-rate': 'Fire rate',
  'movement-speed': 'Movement speed',
  healing: 'Healing',
};

const upgradeIdSet: ReadonlySet<unknown> = new Set(UPGRADE_IDS);
const teamUpgradeIdSet: ReadonlySet<unknown> = new Set(TEAM_UPGRADE_IDS);

export function isUpgradeId(value: unknown): value is UpgradeId {
  return upgradeIdSet.has(value);
}

export function isTeamUpgrade(upgradeId: UpgradeId): upgradeId is TeamUpgradeId {
  return teamUpgradeIdSet.has(upgradeId);
}

export type IndividualUpgradeCounts = Readonly<Record<IndividualUpgradeId, number>>;
export type TeamUpgradeCounts = Readonly<Record<TeamUpgradeId, number>>;

export function createIndividualUpgradeCounts(): IndividualUpgradeCounts {
  return { 'more-bullets': 0, damage: 0, piercing: 0, 'bullet-size': 0, 'fire-rate': 0 };
}

export function createTeamUpgradeCounts(): TeamUpgradeCounts {
  return { 'movement-speed': 0, healing: 0 };
}
