import type {
  ReportedBullet,
  ReportedEnemy,
  ReportedPlayer,
  RunStateReport,
} from './state-report.js';
import {
  failMessage,
  readExactFields,
  readFiniteNumber,
  readList,
  readText,
  readWholeNumber,
} from './read-message-fields.js';
import {
  INDIVIDUAL_UPGRADE_IDS,
  isUpgradeId,
  TEAM_UPGRADE_IDS,
  type IndividualUpgradeCounts,
  type TeamUpgradeCounts,
  type UpgradeId,
} from './upgrades.js';

const WHAT = 'state report';

function parseIndividualUpgradeCounts(value: unknown): IndividualUpgradeCounts {
  const fields = readExactFields(value, WHAT, INDIVIDUAL_UPGRADE_IDS);
  const read = (name: (typeof INDIVIDUAL_UPGRADE_IDS)[number]): number =>
    readWholeNumber(fields.get(name), WHAT, name);
  return {
    'more-bullets': read('more-bullets'),
    damage: read('damage'),
    piercing: read('piercing'),
    'bullet-size': read('bullet-size'),
    'fire-rate': read('fire-rate'),
  };
}

function parseTeamUpgradeCounts(value: unknown): TeamUpgradeCounts {
  const fields = readExactFields(value, WHAT, TEAM_UPGRADE_IDS);
  return {
    'movement-speed': readWholeNumber(fields.get('movement-speed'), WHAT, 'movement-speed'),
    healing: readWholeNumber(fields.get('healing'), WHAT, 'healing'),
  };
}

function parseOffer(value: unknown): readonly UpgradeId[] | null {
  if (value === null) {
    return null;
  }
  return readList(value, WHAT, 'openOffer').map((upgradeId) => {
    if (!isUpgradeId(upgradeId)) {
      failMessage(WHAT, 'an offer holds an unknown upgrade');
    }
    return upgradeId;
  });
}

function parsePlayer(value: unknown): ReportedPlayer {
  const fields = readExactFields(value, WHAT, [
    'playerId',
    'x',
    'y',
    'upgradeCounts',
    'openOffer',
    'waitingOfferCount',
  ]);
  return {
    playerId: readText(fields.get('playerId'), WHAT, 'playerId'),
    x: readFiniteNumber(fields.get('x'), WHAT, 'x'),
    y: readFiniteNumber(fields.get('y'), WHAT, 'y'),
    upgradeCounts: parseIndividualUpgradeCounts(fields.get('upgradeCounts')),
    openOffer: parseOffer(fields.get('openOffer')),
    waitingOfferCount: readWholeNumber(fields.get('waitingOfferCount'), WHAT, 'waitingOfferCount'),
  };
}

function parseBullet(value: unknown): ReportedBullet {
  const fields = readExactFields(value, WHAT, ['id', 'x', 'y', 'radius']);
  return {
    id: readWholeNumber(fields.get('id'), WHAT, 'id'),
    x: readFiniteNumber(fields.get('x'), WHAT, 'x'),
    y: readFiniteNumber(fields.get('y'), WHAT, 'y'),
    radius: readFiniteNumber(fields.get('radius'), WHAT, 'radius'),
  };
}

function parseEnemy(value: unknown): ReportedEnemy {
  const fields = readExactFields(value, WHAT, ['id', 'x', 'y']);
  return {
    id: readWholeNumber(fields.get('id'), WHAT, 'id'),
    x: readFiniteNumber(fields.get('x'), WHAT, 'x'),
    y: readFiniteNumber(fields.get('y'), WHAT, 'y'),
  };
}

/** Checks a state report a browser received from the server, and returns it typed. */
export function parseRunStateReport(value: unknown): RunStateReport {
  const fields = readExactFields(value, WHAT, [
    'stepCount',
    'score',
    'teamHealth',
    'teamLevel',
    'teamExperience',
    'teamUpgradeCounts',
    'players',
    'bullets',
    'enemies',
  ]);
  return {
    stepCount: readWholeNumber(fields.get('stepCount'), WHAT, 'stepCount'),
    score: readWholeNumber(fields.get('score'), WHAT, 'score'),
    teamHealth: readFiniteNumber(fields.get('teamHealth'), WHAT, 'teamHealth'),
    teamLevel: readWholeNumber(fields.get('teamLevel'), WHAT, 'teamLevel'),
    teamExperience: readWholeNumber(fields.get('teamExperience'), WHAT, 'teamExperience'),
    teamUpgradeCounts: parseTeamUpgradeCounts(fields.get('teamUpgradeCounts')),
    players: readList(fields.get('players'), WHAT, 'players').map(parsePlayer),
    bullets: readList(fields.get('bullets'), WHAT, 'bullets').map(parseBullet),
    enemies: readList(fields.get('enemies'), WHAT, 'enemies').map(parseEnemy),
  };
}
