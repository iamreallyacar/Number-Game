import { describe, expect, it } from 'vitest';
import { COUNTER_FORMAT_VERSION, COUNTER_GAME_ID } from '../counter-test-game.js';
import { HighScoresStore } from '../database/high-scores-store.js';
import { COUNTER_URL, createPlayer, startTestServer } from '../test-support.js';

const HIGH_SCORES_URL = `${COUNTER_URL}/high-scores`;

async function startServerWithResults() {
  const server = await startTestServer();
  await createPlayer(server.app, 'Sam');
  await createPlayer(server.app, 'Ana');
  const store = new HighScoresStore(server.database);
  const results = [
    { playerId: 'Sam', score: 30, category: 'to-3' },
    { playerId: 'Sam', score: 90, category: 'to-3' },
    { playerId: 'Ana', score: 50, category: 'to-5' },
    { playerId: 'Sam', score: 10, category: 'to-5' },
  ];
  for (const [index, result] of results.entries()) {
    store.insertResult({
      ...result,
      gameId: COUNTER_GAME_ID,
      detailsJson: '{"count":1}',
      detailsVersion: COUNTER_FORMAT_VERSION,
      finishedAt: `2026-01-0${String(index + 1)}T00:00:00.000Z`,
    });
  }
  return server;
}

describe('high score routes', () => {
  it('lists the top results, best first', async () => {
    const { app } = await startServerWithResults();
    const response = await app.inject({ method: 'GET', url: `${HIGH_SCORES_URL}?limit=3` });
    expect(
      response.json<{ highScores: { score: number }[] }>().highScores.map((result) => result.score),
    ).toEqual([90, 50, 30]);
  });

  it('filters by category', async () => {
    const { app } = await startServerWithResults();
    const response = await app.inject({ method: 'GET', url: `${HIGH_SCORES_URL}?category=to-5` });
    expect(response.json()).toEqual({
      highScores: [
        {
          playerId: 'Ana',
          score: 50,
          category: 'to-5',
          details: { count: 1 },
          finishedAt: '2026-01-03T00:00:00.000Z',
        },
        {
          playerId: 'Sam',
          score: 10,
          category: 'to-5',
          details: { count: 1 },
          finishedAt: '2026-01-04T00:00:00.000Z',
        },
      ],
    });
  });

  it('rejects an unknown category', async () => {
    const { app } = await startServerWithResults();
    const response = await app.inject({ method: 'GET', url: `${HIGH_SCORES_URL}?category=to-9` });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'unknown-category' });
  });

  it('upgrades details written in an older format', async () => {
    const { app, database } = await startServerWithResults();
    new HighScoresStore(database).insertResult({
      gameId: COUNTER_GAME_ID,
      playerId: 'Ana',
      score: 999,
      category: 'to-3',
      detailsJson: '{"value":3}',
      detailsVersion: 1,
      finishedAt: '2026-02-01T00:00:00.000Z',
    });
    const response = await app.inject({ method: 'GET', url: `${HIGH_SCORES_URL}?limit=1` });
    expect(response.json()).toMatchObject({ highScores: [{ score: 999, details: { count: 3 } }] });
  });

  it("lists a player's best result per category", async () => {
    const { app } = await startServerWithResults();
    const response = await app.inject({
      method: 'GET',
      url: `${COUNTER_URL}/personal-bests/sam`,
    });
    expect(response.json()).toMatchObject({
      personalBests: [
        { playerId: 'Sam', score: 90, category: 'to-3' },
        { playerId: 'Sam', score: 10, category: 'to-5' },
      ],
    });
  });

  it('refuses personal bests for an unknown player', async () => {
    const { app } = await startServerWithResults();
    const response = await app.inject({
      method: 'GET',
      url: `${COUNTER_URL}/personal-bests/Nobody`,
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'unknown-player' });
  });
});
