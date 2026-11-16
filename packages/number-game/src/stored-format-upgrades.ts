import { readStoredFields, type StoredFormatUpgrade } from '@local/stored-values';
import { BOARD_WIDTH } from './game-state.js';

// Saved game states and high score details outlive the code that wrote them, so a change to
// GameState or NumberGameSummaryDetails needs an upgrade here, the same way the database schema
// needs a migration. Entry 0 turns version 1 into version 2, and so on, so the current version is
// the list length plus 1. Never edit an entry that has shipped; add a new one instead.

/**
 * Version 1 stored the board width, which could be 10, 11, or 12. The board is always 10 wide now,
 * and the database migration that came with this upgrade deletes the rows of the other widths, so
 * meeting another width here means the stored data is broken.
 */
function removeStoredWidth(stored: unknown, storedKind: string): unknown {
  const fields = readStoredFields(stored);
  if (fields === null) {
    throw new Error(`Cannot upgrade ${storedKind}: expected an object`);
  }
  const width = fields.get('width');
  if (width !== BOARD_WIDTH) {
    throw new Error(
      `Cannot upgrade ${storedKind}: width must be ${String(BOARD_WIDTH)}, got ${JSON.stringify(width)}`,
    );
  }
  fields.delete('width');
  return Object.fromEntries(fields);
}

export const GAME_STATE_UPGRADES: readonly StoredFormatUpgrade[] = [
  (stored) => removeStoredWidth(stored, 'a stored game state'),
];

export const SUMMARY_DETAILS_UPGRADES: readonly StoredFormatUpgrade[] = [
  (stored) => removeStoredWidth(stored, 'stored summary details'),
];
