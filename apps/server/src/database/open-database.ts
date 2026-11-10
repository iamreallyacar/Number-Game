import { accessSync, constants, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from './migrations.js';

const DATABASE_FILE_NAME = 'number-game-dashboard.sqlite';

/** Opens the database file in the data folder, creating both if needed, and runs migrations. */
export function openDatabase(dataDir: string): DatabaseSync {
  mkdirSync(dataDir, { recursive: true });
  checkDataDirIsWritable(dataDir);
  return prepareDatabase(new DatabaseSync(join(dataDir, DATABASE_FILE_NAME)));
}

// SQLite only says 'unable to open database file' when it cannot write, which hides the usual cause:
// a data folder owned by another user, such as one Docker created as root for a mounted volume.
function checkDataDirIsWritable(dataDir: string): void {
  try {
    accessSync(dataDir, constants.W_OK);
  } catch (error) {
    throw new Error(
      `The data folder ${dataDir} is not writable by user id ${String(process.getuid?.() ?? 'unknown')}. Give that user ownership of the folder`,
      { cause: error },
    );
  }
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
