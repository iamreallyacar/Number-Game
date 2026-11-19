import type { DatabaseSync } from 'node:sqlite';
import { foldPlayerId } from './fold-player-id.js';
import { readTextColumn } from './row-values.js';
import { runInTransaction } from './run-in-transaction.js';

// Each entry upgrades the schema by one version. Never edit an entry that has shipped; add a new
// one instead, because existing databases have already run the old ones. Exported so the tests
// can build a database at an older version and check the upgrade.
export const MIGRATIONS: readonly string[] = [
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
  // Each save gets its own id, so a link to a game that ended cannot open the next game started
  // in the same slot. SQLite cannot add a NOT NULL column without a fixed default, so the table
  // is rebuilt, and saves that already exist get a random id in the same shape as the server's.
  `
  CREATE TABLE save_slots_with_save_ids (
    game_id TEXT NOT NULL,
    slot_number INTEGER NOT NULL,
    save_id TEXT NOT NULL UNIQUE,
    player_id TEXT NOT NULL REFERENCES players (player_id),
    state_json TEXT NOT NULL,
    state_version INTEGER NOT NULL,
    locked_device_id TEXT NOT NULL,
    last_played_at TEXT NOT NULL,
    PRIMARY KEY (game_id, slot_number)
  ) STRICT;

  INSERT INTO save_slots_with_save_ids
    (game_id, slot_number, save_id, player_id, state_json, state_version, locked_device_id,
     last_played_at)
  SELECT game_id, slot_number,
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' ||
      hex(randomblob(2)) || '-' || hex(randomblob(6))),
    player_id, state_json, state_version, locked_device_id, last_played_at
  FROM save_slots;

  DROP TABLE save_slots;
  ALTER TABLE save_slots_with_save_ids RENAME TO save_slots;
  `,
  // The Number Game board is always 10 wide now, and its stored format version 2 no longer holds
  // the width. Saves and high scores made on width 11 or 12 cannot be loaded any more, so they are
  // deleted. Rows with no width field, or width 10, stay.
  `
  DELETE FROM save_slots
  WHERE game_id = 'number-game' AND json_extract(state_json, '$.width') <> 10;

  DELETE FROM high_scores
  WHERE game_id = 'number-game' AND json_extract(details_json, '$.width') <> 10;
  `,
  // The Block Game rules changed a lot (hands of 3, a weight ramp, fair hands), and old results
  // were earned under much easier rules, so every Block Game save and high score is deleted.
  `
  DELETE FROM save_slots WHERE game_id = 'block-game';
  DELETE FROM high_scores WHERE game_id = 'block-game';
  `,
  // The Disk Game was removed from the dashboard, so no code is left that can read its saves and
  // high scores.
  `
  DELETE FROM save_slots WHERE game_id = 'disk-game';
  DELETE FROM high_scores WHERE game_id = 'disk-game';
  `,
  // A result can name several players (PS-23), so who is on a result moves to its own table, with
  // one row for each player in the order they joined. Every existing result gets one row for its
  // player. The player column is dropped by rebuilding high_scores. The players are staged first
  // because dropping the old table must happen before the new table can hold the foreign key.
  `
  CREATE TABLE high_scores_without_player (
    high_score_id INTEGER PRIMARY KEY,
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    category TEXT NOT NULL,
    details_json TEXT NOT NULL,
    details_version INTEGER NOT NULL,
    finished_at TEXT NOT NULL
  ) STRICT;

  INSERT INTO high_scores_without_player
    (high_score_id, game_id, score, category, details_json, details_version, finished_at)
  SELECT high_score_id, game_id, score, category, details_json, details_version, finished_at
  FROM high_scores;

  CREATE TABLE staged_result_players AS
  SELECT high_score_id, player_id FROM high_scores;

  DROP TABLE high_scores;
  ALTER TABLE high_scores_without_player RENAME TO high_scores;
  CREATE INDEX high_scores_by_game_and_score ON high_scores (game_id, category, score DESC);

  CREATE TABLE high_score_players (
    high_score_id INTEGER NOT NULL REFERENCES high_scores (high_score_id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players (player_id),
    position INTEGER NOT NULL,
    PRIMARY KEY (high_score_id, position)
  ) STRICT;

  CREATE INDEX high_score_players_by_player ON high_score_players (player_id);

  INSERT INTO high_score_players (high_score_id, player_id, position)
  SELECT high_score_id, player_id, 0 FROM staged_result_players;

  DROP TABLE staged_result_players;
  `,
  // SQLite's NOCASE only folds ASCII letters, so 'Émile' and 'émile' could both exist. Players
  // get a key folded in TypeScript, and the unique index on it decides if an ID is taken. The
  // column cannot be NOT NULL or UNIQUE when added to a table with rows, so the index is made
  // after the keys are filled. fold_player_id is registered by runMigrations.
  `
  ALTER TABLE players ADD COLUMN player_key TEXT;
  UPDATE players SET player_key = fold_player_id(player_id);
  CREATE UNIQUE INDEX players_by_player_key ON players (player_key);
  `,
  // Saves that exist already have had their moves applied without numbers, and 0 is where the
  // next numbered move starts, so a browser that opens one begins counting from there.
  `
  ALTER TABLE save_slots ADD COLUMN move_count INTEGER NOT NULL DEFAULT 0;
  `,
];

const PLAYER_KEY_MIGRATION_VERSION = 8;

// Fails before the migration changes anything, so the message can name every clash instead of
// the database reporting only the first broken constraint. Nothing is merged or deleted, since
// the owner of the data has to decide which player keeps the ID.
function assertNoPlayerIdsDifferingOnlyInCase(database: DatabaseSync): void {
  const idsByKey = new Map<string, string[]>();
  for (const row of database.prepare('SELECT player_id FROM players').all()) {
    const playerId = readTextColumn(row, 'player_id');
    const key = foldPlayerId(playerId);
    idsByKey.set(key, [...(idsByKey.get(key) ?? []), playerId]);
  }
  const clashes = [...idsByKey.values()].filter((playerIds) => playerIds.length > 1);
  if (clashes.length > 0) {
    const described = clashes.map((playerIds) => playerIds.join(' / ')).join('; ');
    throw new Error(
      `Player IDs that differ only in letter case must be resolved by hand first: ${described}`,
    );
  }
}

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
  database.function('fold_player_id', (playerId) => foldPlayerId(String(playerId)));
  for (const [index, migration] of MIGRATIONS.entries()) {
    const targetVersion = index + 1;
    if (targetVersion <= currentVersion) {
      continue;
    }
    try {
      runInTransaction(database, () => {
        if (targetVersion === PLAYER_KEY_MIGRATION_VERSION) {
          assertNoPlayerIdsDifferingOnlyInCase(database);
        }
        database.exec(migration);
        database.exec(`PRAGMA user_version = ${String(targetVersion)}`);
      });
    } catch (error) {
      throw new Error(`Database migration to version ${String(targetVersion)} failed`, {
        cause: error,
      });
    }
  }
}
