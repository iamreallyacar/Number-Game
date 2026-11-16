import type { StoredFormatUpgrade } from '@local/stored-values';

// High score details outlive the code that wrote them, so a change to SurvivorGameSummaryDetails
// needs an upgrade here, the same way the database schema needs a migration. Entry 0 turns
// version 1 into version 2, and so on. Never edit an entry that has shipped; add a new one.
// A run is never stored, so there is no list of run state upgrades.

export const SUMMARY_DETAILS_UPGRADES: readonly StoredFormatUpgrade[] = [];
