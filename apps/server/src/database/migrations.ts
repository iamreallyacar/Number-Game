import type { DatabaseSync } from 'node:sqlite';

// Each entry upgrades the schema by one version. Never edit an entry that has shipped; add a new
// one instead, because existing databases have already run the old ones.
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE players (
    player_id TEXT PRIMARY KEY COLLATE NOCASE,
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE TABLE save_slots (
    game_id TEXT NOT NULL,
    slot_number INTEGER NOT NULL,
    player_id TEXT NOT NULL REFERENCES players (player_id),
    state_json TEXT NOT NULL,
    locked_device_id TEXT NOT NULL,
    last_played_at TEXT NOT NULL,
    PRIMARY KEY (game_id, slot_number)
  ) STRICT;

  CREATE TABLE high_scores (
    high_score_id INTEGER PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL REFERENCES players (player_id),
    score INTEGER NOT NULL,
    category TEXT NOT NULL,
    details_json TEXT NOT NULL,
    finished_at TEXT NOT NULL
  ) STRICT;

  CREATE INDEX high_scores_by_game_and_score ON high_scores (game_id, category, score DESC);
  `,
  // Each game numbers the formats of its stored states and summary details, so old ones can be
  // upgraded when a game changes. Rows written before this migration used format version 1.
  `
  ALTER TABLE save_slots ADD COLUMN state_version INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE high_scores ADD COLUMN details_version INTEGER NOT NULL DEFAULT 1;
  `,
];

function readSchemaVersion(database: DatabaseSync): number {
  const row = database.prepare('PRAGMA user_version').get();
  const version = row?.['user_version'];
  if (typeof version !== 'number') {
    throw new Error('Could not read the database schema version');
  }
  return version;
}

/** Brings the database schema up to the latest version. Runs every time the server starts. */
export function runMigrations(database: DatabaseSync): void {
  const currentVersion = readSchemaVersion(database);
  if (currentVersion > MIGRATIONS.length) {
    throw new Error(
      `Database schema version ${String(currentVersion)} is newer than this server supports ` +
        `(${String(MIGRATIONS.length)}). Update the server before using this database`,
    );
  }
  for (const [index, migration] of MIGRATIONS.entries()) {
    const targetVersion = index + 1;
    if (targetVersion <= currentVersion) {
      continue;
    }
    database.exec('BEGIN');
    try {
      database.exec(migration);
      database.exec(`PRAGMA user_version = ${String(targetVersion)}`);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw new Error(`Database migration to version ${String(targetVersion)} failed`, {
        cause: error,
      });
    }
  }
}
