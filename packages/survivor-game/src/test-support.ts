// Builders shared by the test files. Excluded from the build in tsconfig.build.json.
import { createRun } from './new-run.js';
import type { Enemy, PlayerState, RunState } from './run-state.js';
import { createIndividualUpgradeCounts } from './upgrades.js';

export function makeRun(playerIds: readonly string[] = ['amy'], seed = 1): RunState {
  return createRun({ playerIds, seed });
}

export function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: 'amy',
    x: 0,
    y: 0,
    upgradeCounts: createIndividualUpgradeCounts(),
    shotCooldownSteps: 0,
    openOffer: null,
    waitingOfferCount: 0,
    ...overrides,
  };
}

export function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return { id: 100, x: 100, y: 0, health: 20, points: 10, touchCooldownSteps: 0, ...overrides };
}

/** Replaces the players of a run, keeping everything else. */
export function withPlayers(state: RunState, players: readonly PlayerState[]): RunState {
  return { ...state, players };
}
