import type { PlayerState, RunState } from './run-state.js';
import type { IndividualUpgradeCounts, TeamUpgradeCounts, UpgradeId } from './upgrades.js';

/** Positions go over the wire with this many decimals. A pixel on a phone is far coarser. */
const REPORTED_DECIMALS = 1;
const REPORTED_DECIMAL_SCALE = 10 ** REPORTED_DECIMALS;

export interface ReportedPlayer {
  readonly playerId: string;
  readonly x: number;
  readonly y: number;
  readonly upgradeCounts: IndividualUpgradeCounts;
  readonly openOffer: readonly UpgradeId[] | null;
  readonly waitingOfferCount: number;
}

export interface ReportedBullet {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface ReportedEnemy {
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

/**
 * What a browser needs to draw the run and its status, and nothing else. It leaves out the
 * random generator state, the bullet and enemy bookkeeping, and the spawn carry, which only the
 * server's own steps use. Positions are rounded, so it is not a state a run can continue from.
 */
export interface RunStateReport {
  readonly stepCount: number;
  readonly score: number;
  readonly teamHealth: number;
  readonly teamLevel: number;
  readonly teamExperience: number;
  readonly teamUpgradeCounts: TeamUpgradeCounts;
  readonly players: readonly ReportedPlayer[];
  readonly bullets: readonly ReportedBullet[];
  readonly enemies: readonly ReportedEnemy[];
}

function roundForReport(value: number): number {
  return Math.round(value * REPORTED_DECIMAL_SCALE) / REPORTED_DECIMAL_SCALE;
}

function reportPlayer(player: PlayerState): ReportedPlayer {
  return {
    playerId: player.playerId,
    x: roundForReport(player.x),
    y: roundForReport(player.y),
    upgradeCounts: player.upgradeCounts,
    openOffer: player.openOffer,
    waitingOfferCount: player.waitingOfferCount,
  };
}

/** The part of a run state that goes to the browsers. The run state itself keeps full precision. */
export function buildRunStateReport(state: RunState): RunStateReport {
  return {
    stepCount: state.stepCount,
    score: state.score,
    teamHealth: state.teamHealth,
    teamLevel: state.teamLevel,
    teamExperience: state.teamExperience,
    teamUpgradeCounts: state.teamUpgradeCounts,
    players: state.players.map(reportPlayer),
    bullets: state.bullets.map((bullet) => ({
      id: bullet.id,
      x: roundForReport(bullet.x),
      y: roundForReport(bullet.y),
      radius: bullet.radius,
    })),
    enemies: state.enemies.map((enemy) => ({
      id: enemy.id,
      x: roundForReport(enemy.x),
      y: roundForReport(enemy.y),
    })),
  };
}
