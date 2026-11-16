import {
  balance,
  experienceNeededAt,
  secondsSurvivedOf,
  type RunStateReport,
} from '@local/survivor-game';
import { formatTimeSurvived } from './format-time-survived.js';

export interface RunStatus {
  readonly healthShare: number;
  readonly healthText: string;
  readonly experienceShare: number;
  readonly levelText: string;
  readonly scoreText: string;
  readonly timeText: string;
}

function clampShare(share: number): number {
  return Math.min(1, Math.max(0, share));
}

/** The team's health, experience bar, level, score, and time survived, ready to show (SG-56). */
export function describeRunStatus(state: RunStateReport): RunStatus {
  return {
    healthShare: clampShare(state.teamHealth / balance.TEAM_HEALTH),
    healthText: `${String(Math.ceil(state.teamHealth))} / ${String(balance.TEAM_HEALTH)}`,
    experienceShare: clampShare(state.teamExperience / experienceNeededAt(state.teamLevel)),
    levelText: String(state.teamLevel),
    scoreText: String(state.score),
    timeText: formatTimeSurvived(secondsSurvivedOf(state)),
  };
}
