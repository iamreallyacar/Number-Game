import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { runMigrations } from './migrations.js';

describe('runMigrations', () => {
  it('creates the tables and can run again without changes', () => {
    const database = new DatabaseSync(':memory:');
    runMigrations(database);
    runMigrations(database);
    const tables = database
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row['name']);
    expect(tables).toEqual(['high_scores', 'players', 'save_slots']);
  });

  it('refuses a database made by a newer server', () => {
    const database = new DatabaseSync(':memory:');
    database.exec('PRAGMA user_version = 99');
    expect(() => {
      runMigrations(database);
    }).toThrow('newer than this server supports');
  });
});
