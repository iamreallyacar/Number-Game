import { DatabaseSync } from 'node:sqlite';
import { NUMBER_GAME_ID } from '@local/number-game';
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

  it('deletes Number Game saves and high scores made on a width other than 10', () => {
    const database = new DatabaseSync(':memory:');
    for (const migration of MIGRATIONS.slice(0, 3)) {
      database.exec(migration);
    }
    database.exec('PRAGMA user_version = 3');
    const insertSave = database.prepare(
      `INSERT INTO save_slots
         (game_id, slot_number, save_id, player_id, state_json, state_version, locked_device_id,
          last_played_at)
       VALUES (?, ?, ?, 'Sam', ?, 1, 'device-aaaa', '2026-01-01')`,
    );
    const insertScore = database.prepare(
      `INSERT INTO high_scores
         (game_id, player_id, score, category, details_json, finished_at)
       VALUES (?, 'Sam', ?, 'normal', ?, '2026-01-01')`,
    );
    database.exec("INSERT INTO players (player_id, created_at) VALUES ('Sam', '2026-01-01')");
    insertSave.run(NUMBER_GAME_ID, 1, 'save-10', '{"width":10}');
    insertSave.run(NUMBER_GAME_ID, 2, 'save-11', '{"width":11}');
    insertSave.run(NUMBER_GAME_ID, 3, 'save-12', '{"width":12}');
    insertSave.run('counter', 1, 'save-other', '{"width":11}');
    insertScore.run(NUMBER_GAME_ID, 10, '{"width":10}');
    insertScore.run(NUMBER_GAME_ID, 11, '{"width":11}');
    insertScore.run(NUMBER_GAME_ID, 12, '{"width":12}');
    insertScore.run('counter', 13, '{"width":11}');

    runMigrations(database);

    const keptSaves = database.prepare('SELECT save_id FROM save_slots ORDER BY save_id').all();
    expect(keptSaves.map((row) => row['save_id'])).toEqual(['save-10', 'save-other']);
    const keptScores = database.prepare('SELECT score FROM high_scores ORDER BY score').all();
    expect(keptScores.map((row) => row['score'])).toEqual([10, 13]);
  });

  it('deletes every Block Game save and high score and keeps other games', () => {
    const database = new DatabaseSync(':memory:');
    for (const migration of MIGRATIONS.slice(0, 4)) {
      database.exec(migration);
    }
    database.exec('PRAGMA user_version = 4');
    const insertSave = database.prepare(
      `INSERT INTO save_slots
         (game_id, slot_number, save_id, player_id, state_json, state_version, locked_device_id,
          last_played_at)
       VALUES (?, ?, ?, 'Sam', '{}', 1, 'device-aaaa', '2026-01-01')`,
    );
    const insertScore = database.prepare(
      `INSERT INTO high_scores
         (game_id, player_id, score, category, details_json, finished_at)
       VALUES (?, 'Sam', ?, 'normal', '{}', '2026-01-01')`,
    );
    database.exec("INSERT INTO players (player_id, created_at) VALUES ('Sam', '2026-01-01')");
    insertSave.run('block-game', 1, 'save-block-1');
    insertSave.run('block-game', 2, 'save-block-2');
    insertSave.run(NUMBER_GAME_ID, 1, 'save-number');
    insertScore.run('block-game', 100);
    insertScore.run(NUMBER_GAME_ID, 200);

    runMigrations(database);

    const keptSaves = database.prepare('SELECT save_id FROM save_slots').all();
    expect(keptSaves.map((row) => row['save_id'])).toEqual(['save-number']);
    const keptScores = database.prepare('SELECT score FROM high_scores').all();
    expect(keptScores.map((row) => row['score'])).toEqual([200]);
  });

  it('deletes every save and high score of the removed Disk Game and keeps other games', () => {
    const database = new DatabaseSync(':memory:');
    for (const migration of MIGRATIONS.slice(0, 5)) {
      database.exec(migration);
    }
    database.exec('PRAGMA user_version = 5');
    const insertSave = database.prepare(
      `INSERT INTO save_slots
         (game_id, slot_number, save_id, player_id, state_json, state_version, locked_device_id,
          last_played_at)
       VALUES (?, ?, ?, 'Sam', '{}', 1, 'device-aaaa', '2026-01-01')`,
    );
    const insertScore = database.prepare(
      `INSERT INTO high_scores
         (game_id, player_id, score, category, details_json, finished_at)
       VALUES (?, 'Sam', ?, 'normal', '{}', '2026-01-01')`,
    );
    database.exec("INSERT INTO players (player_id, created_at) VALUES ('Sam', '2026-01-01')");
    insertSave.run('disk-game', 1, 'save-disk-1');
    insertSave.run('disk-game', 2, 'save-disk-2');
    insertSave.run(NUMBER_GAME_ID, 1, 'save-number');
    insertScore.run('disk-game', 100);
    insertScore.run(NUMBER_GAME_ID, 200);

    runMigrations(database);

    const keptSaves = database.prepare('SELECT save_id FROM save_slots').all();
    expect(keptSaves.map((row) => row['save_id'])).toEqual(['save-number']);
    const keptScores = database.prepare('SELECT score FROM high_scores').all();
    expect(keptScores.map((row) => row['score'])).toEqual([200]);
  });
});
