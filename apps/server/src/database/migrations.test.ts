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
    expect(tables).toEqual(['high_score_players', 'high_scores', 'players', 'save_slots']);
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

  it('moves the player of every existing high score into the table of result players', () => {
    const database = new DatabaseSync(':memory:');
    for (const migration of MIGRATIONS.slice(0, 6)) {
      database.exec(migration);
    }
    database.exec('PRAGMA user_version = 6');
    database.exec(`
      INSERT INTO players (player_id, created_at) VALUES ('Sam', '2026-01-01'), ('Ana', '2026-01-01');
      INSERT INTO high_scores
        (high_score_id, game_id, player_id, score, category, details_json, details_version,
         finished_at)
      VALUES
        (7, 'counter', 'Sam', 30, 'to-3', '{"count":3}', 2, '2026-01-01'),
        (9, 'counter', 'Ana', 50, 'to-5', '{"count":5}', 2, '2026-01-02');
    `);

    runMigrations(database);

    const results = database.prepare('SELECT * FROM high_scores ORDER BY high_score_id').all();
    expect(results.map((row) => ({ ...row }))).toEqual([
      {
        high_score_id: 7,
        game_id: 'counter',
        score: 30,
        category: 'to-3',
        details_json: '{"count":3}',
        details_version: 2,
        finished_at: '2026-01-01',
      },
      {
        high_score_id: 9,
        game_id: 'counter',
        score: 50,
        category: 'to-5',
        details_json: '{"count":5}',
        details_version: 2,
        finished_at: '2026-01-02',
      },
    ]);
    const players = database
      .prepare('SELECT * FROM high_score_players ORDER BY high_score_id')
      .all();
    expect(players.map((row) => ({ ...row }))).toEqual([
      { high_score_id: 7, player_id: 'Sam', position: 0 },
      { high_score_id: 9, player_id: 'Ana', position: 0 },
    ]);
    const leftoverTables = database
      .prepare("SELECT name FROM sqlite_schema WHERE name = 'staged_result_players'")
      .all();
    expect(leftoverTables).toEqual([]);
  });

  it('deletes the player rows of a result with it', () => {
    const database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON');
    runMigrations(database);
    database.exec(`
      INSERT INTO players (player_id, created_at) VALUES ('Sam', '2026-01-01');
      INSERT INTO high_scores (game_id, score, category, details_json, details_version, finished_at)
        VALUES ('counter', 1, 'to-3', '{}', 1, '2026-01-01');
      INSERT INTO high_score_players (high_score_id, player_id, position) VALUES (1, 'Sam', 0);
      DELETE FROM high_scores;
    `);
    expect(database.prepare('SELECT * FROM high_score_players').all()).toEqual([]);
  });

  it('gives every existing player a letter-case-free key and keeps the ID as created', () => {
    const database = new DatabaseSync(':memory:');
    for (const migration of MIGRATIONS.slice(0, 7)) {
      database.exec(migration);
    }
    database.exec('PRAGMA user_version = 7');
    database.exec(`
      INSERT INTO players (player_id, created_at) VALUES ('Émile', '2026-01-01'), ('Sam', '2026-01-01');
    `);

    runMigrations(database);

    const players = database.prepare(
      'SELECT player_id, player_key FROM players ORDER BY player_id',
    );
    expect(players.all().map((row) => ({ ...row }))).toEqual([
      { player_id: 'Sam', player_key: 'sam' },
      { player_id: 'Émile', player_key: 'émile' },
    ]);
  });

  it('fails and names the player IDs that differ only in letter case', () => {
    const database = new DatabaseSync(':memory:');
    for (const migration of MIGRATIONS.slice(0, 7)) {
      database.exec(migration);
    }
    database.exec('PRAGMA user_version = 7');
    database.exec(`
      INSERT INTO players (player_id, created_at)
        VALUES ('Émile', '2026-01-01'), ('émile', '2026-01-02'), ('Sam', '2026-01-01');
    `);

    let failure: unknown;
    try {
      runMigrations(database);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).cause).toMatchObject({
      message: expect.stringMatching(/Émile.*émile/) as unknown,
    });
    const players = database.prepare('SELECT player_id FROM players ORDER BY player_id').all();
    expect(players).toHaveLength(3);
  });
});
