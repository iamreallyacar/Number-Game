import { isWholeNumberAtLeast, readStoredFields } from '@local/stored-values';
import { STEP_RATE } from './balance.js';
import { MAX_PLAYERS_PER_ROOM, MIN_PLAYERS_PER_ROOM } from './room-limits.js';
import type { RunState } from './run-state.js';

/** The category of a result is the number of players in the run, as text (SG-49). */
export const SURVIVOR_GAME_CATEGORIES: readonly string[] = Array.from(
  { length: MAX_PLAYERS_PER_ROOM - MIN_PLAYERS_PER_ROOM + 1 },
  (_, index) => String(MIN_PLAYERS_PER_ROOM + index),
);

/** Shown next to a high score (SG-49). Stored as JSON with high scores. */
// A type instead of an interface, because only a type can be passed where the server expects a
// plain record of strings and numbers.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SurvivorGameSummaryDetails = {
  readonly secondsSurvived: number;
  readonly levelReached: number;
};

export interface SurvivorGameSummary {
  readonly score: number;
  readonly category: string;
  readonly details: SurvivorGameSummaryDetails;
}

export class InvalidSummaryDetailsError extends Error {
  override readonly name = 'InvalidSummaryDetailsError';
}

export function secondsSurvivedOf(state: Pick<RunState, 'stepCount'>): number {
  return Math.floor(state.stepCount / STEP_RATE);
}

export function summarizeRun(state: RunState): SurvivorGameSummary {
  return {
    score: state.score,
    category: String(state.players.length),
    details: { secondsSurvived: secondsSurvivedOf(state), levelReached: state.teamLevel },
  };
}

function fail(message: string): never {
  throw new InvalidSummaryDetailsError(`Invalid Survivor Game summary details: ${message}`);
}

const DETAIL_FIELDS: readonly string[] = ['secondsSurvived', 'levelReached'];

/** Checks summary details read back from storage or from the server, and returns them typed. */
export function parseSummaryDetails(value: unknown): SurvivorGameSummaryDetails {
  const record = readStoredFields(value) ?? fail('expected an object');
  for (const key of record.keys()) {
    if (!DETAIL_FIELDS.includes(key)) {
      fail(`unknown field '${key}'`);
    }
  }
  const secondsSurvived = record.get('secondsSurvived');
  if (!isWholeNumberAtLeast(secondsSurvived, 0)) {
    fail('secondsSurvived must be a whole number of 0 or more');
  }
  const levelReached = record.get('levelReached');
  if (!isWholeNumberAtLeast(levelReached, 1)) {
    fail('levelReached must be a whole number of 1 or more');
  }
  return { secondsSurvived, levelReached };
}
