import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from './migrations.js';

const DATABASE_FILE_NAME = 'number-game-dashboard.sqlite';

/** Opens the database file in the data folder, creating both if needed, and runs migrations. */
export function openDatabase(dataDir: string): DatabaseSync {
  mkdirSync(dataDir, { recursive: true });
  return prepareDatabase(new DatabaseSync(join(dataDir, DATABASE_FILE_NAME)));
}

/** A database that lives only in memory, for tests. */
export function openInMemoryDatabase(): DatabaseSync {
  return prepareDatabase(new DatabaseSync(':memory:'));
}

function prepareDatabase(database: DatabaseSync): DatabaseSync {
  database.exec('PRAGMA foreign_keys = ON');
  database.exec('PRAGMA journal_mode = WAL');
  runMigrations(database);
  return database;
}
