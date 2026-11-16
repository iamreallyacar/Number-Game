import type { SummaryDetails } from '@local/game-server-api';
import type { StoredFormatUpgrade } from '@local/stored-values';
import { HttpError } from '../http-error.js';
import { upgradeStoredValue } from './stored-format.js';

/** Summary details as they are kept with a high score. */
export interface StoredSummaryDetails {
  readonly detailsJson: string;
  readonly detailsVersion: number;
}

/** Reads stored JSON, upgrades it to the newest format, and checks it, failing with a 500 error. */
export function readStoredJson<Parsed>(
  json: string,
  version: number,
  upgrades: readonly StoredFormatUpgrade[],
  parse: (stored: unknown) => Parsed,
  brokenError: { readonly code: string; readonly description: string },
): Parsed {
  try {
    return parse(upgradeStoredValue(JSON.parse(json), version, upgrades));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new HttpError(500, brokenError.code, `${brokenError.description}: ${reason}`);
  }
}

export const BROKEN_SAVE = {
  code: 'broken-save',
  description: 'This save is broken and cannot be used',
};
export const BROKEN_HIGH_SCORE = {
  code: 'broken-high-score',
  description: 'A stored high score is broken and cannot be shown',
};

/** Reads summary details stored with a high score, upgraded and checked by the game. */
export function readStoredSummaryDetails(
  stored: StoredSummaryDetails,
  upgrades: readonly StoredFormatUpgrade[],
  parse: (stored: unknown) => SummaryDetails,
): SummaryDetails {
  return readStoredJson(
    stored.detailsJson,
    stored.detailsVersion,
    upgrades,
    parse,
    BROKEN_HIGH_SCORE,
  );
}
