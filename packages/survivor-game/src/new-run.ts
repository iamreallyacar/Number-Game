import { createRandomState } from '@local/seeded-random';
import { TEAM_HEALTH } from './balance.js';
import { MAX_PLAYERS_PER_ROOM, MIN_PLAYERS_PER_ROOM } from './room-limits.js';
import type { PlayerState, RunState } from './run-state.js';
import { createIndividualUpgradeCounts, createTeamUpgradeCounts } from './upgrades.js';

/** Players start on a small circle around the origin (SG-13). A lone player starts on it. */
const START_SPREAD_DISTANCE = 40;

export interface NewRunOptions {
  /** One entry per player of the room, without repeats. */
  readonly playerIds: readonly string[];
  /** Any safe integer. The caller picks it, so the rules stay free of hidden randomness. */
  readonly seed: number;
}

function startingPlayer(playerId: string, index: number, playerCount: number): PlayerState {
  const angle = (2 * Math.PI * index) / playerCount;
  const spread = playerCount === 1 ? 0 : START_SPREAD_DISTANCE;
  return {
    playerId,
    x: Math.cos(angle) * spread,
    y: Math.sin(angle) * spread,
    upgradeCounts: createIndividualUpgradeCounts(),
    shotCooldownSteps: 0,
    openOffer: null,
    waitingOfferCount: 0,
  };
}

export function createRun(options: NewRunOptions): RunState {
  const { playerIds } = options;
  if (playerIds.length < MIN_PLAYERS_PER_ROOM || playerIds.length > MAX_PLAYERS_PER_ROOM) {
    throw new RangeError(
      `A run has ${String(MIN_PLAYERS_PER_ROOM)} to ${String(MAX_PLAYERS_PER_ROOM)} players, got ${String(playerIds.length)}`,
    );
  }
  if (new Set(playerIds).size !== playerIds.length) {
    throw new RangeError('A player ID can be in a run only once');
  }
  return {
    stepCount: 0,
    randomState: createRandomState(options.seed),
    score: 0,
    teamHealth: TEAM_HEALTH,
    teamLevel: 1,
    teamExperience: 0,
    teamUpgradeCounts: createTeamUpgradeCounts(),
    players: playerIds.map((playerId, index) => startingPlayer(playerId, index, playerIds.length)),
    bullets: [],
    enemies: [],
    nextEntityId: 1,
    enemySpawnCarry: 0,
    endReason: null,
  };
}
