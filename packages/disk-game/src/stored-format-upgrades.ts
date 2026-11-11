/** Turns a stored value written in one format version into the next version. */
export type StoredFormatUpgrade = (stored: unknown) => unknown;

// Saved game states and high score details outlive the code that wrote them, so a change to
// GameState or DiskGameSummaryDetails needs an upgrade here, the same way the database schema
// needs a migration. Entry 0 turns version 1 into version 2, and so on, so the current version is
// the list length plus 1. Never edit an entry that has shipped; add a new one instead.

export const GAME_STATE_UPGRADES: readonly StoredFormatUpgrade[] = [];

export const SUMMARY_DETAILS_UPGRADES: readonly StoredFormatUpgrade[] = [];
