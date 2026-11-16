import { describe, expect, it } from 'vitest';
import { HighScoresStore, type StoredGameResult } from './high-scores-store.js';
import { openInMemoryDatabase } from './open-database.js';
import { PlayersStore } from './players-store.js';

function setUp() {
  const database = openInMemoryDatabase();
  const players = new PlayersStore(database);
  for (const playerId of ['Sam', 'Ana', 'Lee']) {
    players.createPlayer(playerId, '2026-01-01');
  }
  return { database, store: new HighScoresStore(database) };
}

function result(overrides: Partial<StoredGameResult>): StoredGameResult {
  return {
    gameId: 'counter',
    playerIds: ['Sam'],
    score: 10,
    category: 'a',
    detailsJson: '{}',
    detailsVersion: 1,
    finishedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('HighScoresStore', () => {
  it('keeps the players of a result in the order they were given', () => {
    const { store } = setUp();
    store.insertResult(result({ playerIds: ['Lee', 'Sam', 'Ana'] }));
    expect(store.listTopResults('counter', null, 10)[0]?.playerIds).toEqual(['Lee', 'Sam', 'Ana']);
  });

  it('refuses a result with no players', () => {
    const { store } = setUp();
    expect(() => {
      store.insertResult(result({ playerIds: [] }));
    }).toThrow('at least one player');
  });

  it('writes nothing when a player of the result does not exist', () => {
    const { store } = setUp();
    expect(() => {
      store.insertResult(result({ playerIds: ['Sam', 'Nobody'] }));
    }).toThrow();
    expect(store.listTopResults('counter', null, 10)).toEqual([]);
  });

  it('writes the whole result inside a transaction that is rolled back', () => {
    const { database, store } = setUp();
    database.exec('BEGIN');
    store.insertResult(result({}));
    database.exec('ROLLBACK');
    expect(store.listTopResults('counter', null, 10)).toEqual([]);
  });

  it('orders by score, then earlier first', () => {
    const { store } = setUp();
    store.insertResult(result({ score: 5, finishedAt: '2026-01-01T00:00:00.000Z' }));
    store.insertResult(result({ score: 9, finishedAt: '2026-01-03T00:00:00.000Z' }));
    store.insertResult(result({ score: 9, finishedAt: '2026-01-02T00:00:00.000Z' }));
    expect(
      store.listTopResults('counter', null, 10).map((entry) => [entry.score, entry.finishedAt]),
    ).toEqual([
      [9, '2026-01-02T00:00:00.000Z'],
      [9, '2026-01-03T00:00:00.000Z'],
      [5, '2026-01-01T00:00:00.000Z'],
    ]);
  });

  it('gives each member of a team the team result as a personal best', () => {
    const { store } = setUp();
    store.insertResult(result({ playerIds: ['Sam', 'Ana'], score: 50, category: 'b' }));
    store.insertResult(result({ playerIds: ['Sam'], score: 20, category: 'b' }));
    store.insertResult(result({ playerIds: ['Sam'], score: 7, category: 'a' }));
    expect(store.listPersonalBests('counter', 'Ana').map((entry) => entry.score)).toEqual([50]);
    expect(
      store.listPersonalBests('counter', 'Sam').map((entry) => [entry.category, entry.score]),
    ).toEqual([
      ['a', 7],
      ['b', 50],
    ]);
    expect(store.listPersonalBests('counter', 'Lee')).toEqual([]);
  });

  it('keeps the games apart', () => {
    const { store } = setUp();
    store.insertResult(result({ gameId: 'other' }));
    expect(store.listTopResults('counter', null, 10)).toEqual([]);
    expect(store.listPersonalBests('counter', 'Sam')).toEqual([]);
  });
});
