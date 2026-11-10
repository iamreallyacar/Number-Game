import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS, runMigrations } from './migrations.js';

const SAVE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

  it('gives every save that existed before save ids its own id', () => {
    const database = new DatabaseSync(':memory:');
    for (const migration of MIGRATIONS.slice(0, 2)) {
      database.exec(migration);
    }
    database.exec('PRAGMA user_version = 2');
    database.exec(`
      INSERT INTO players (player_id, created_at) VALUES ('Sam', '2026-01-01');
      INSERT INTO save_slots
        (game_id, slot_number, player_id, state_json, state_version, locked_device_id,
         last_played_at)
      VALUES
        ('counter', 1, 'Sam', '{"count":1}', 2, 'device-aaaa', '2026-01-01'),
        ('counter', 2, 'Sam', '{"count":2}', 2, 'device-aaaa', '2026-01-02');
    `);

    runMigrations(database);

    const rows = database
      .prepare('SELECT slot_number, save_id, state_json FROM save_slots ORDER BY slot_number')
      .all();
    expect(rows.map((row) => [row['slot_number'], row['state_json']])).toEqual([
      [1, '{"count":1}'],
      [2, '{"count":2}'],
    ]);
    const saveIds = rows.map((row) => row['save_id']);
    for (const saveId of saveIds) {
      expect(saveId).toMatch(SAVE_ID_PATTERN);
    }
    expect(new Set(saveIds).size).toBe(saveIds.length);
  });
});
