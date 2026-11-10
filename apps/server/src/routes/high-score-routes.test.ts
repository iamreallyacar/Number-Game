import { describe, expect, it } from 'vitest';
import { HighScoresStore } from '../database/high-scores-store.js';
import { createPlayer, startTestServer } from '../test-support.js';

const HIGH_SCORES_URL = '/api/games/number-game/high-scores';

async function startServerWithResults() {
  const server = await startTestServer();
  await createPlayer(server.app, 'Sam');
  await createPlayer(server.app, 'Ana');
  const store = new HighScoresStore(server.database);
  const results = [
    { playerId: 'Sam', score: 300, category: 'easy' },
    { playerId: 'Sam', score: 900, category: 'easy' },
    { playerId: 'Ana', score: 500, category: 'hard' },
    { playerId: 'Sam', score: 100, category: 'hard' },
  ];
  for (const [index, result] of results.entries()) {
    store.insertResult({
      ...result,
      gameId: 'number-game',
      detailsJson: '{"stage":1}',
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
    ).toEqual([900, 500, 300]);
  });

  it('filters by difficulty', async () => {
    const { app } = await startServerWithResults();
    const response = await app.inject({ method: 'GET', url: `${HIGH_SCORES_URL}?category=hard` });
    expect(response.json()).toEqual({
      highScores: [
        {
          playerId: 'Ana',
          score: 500,
          category: 'hard',
          details: { stage: 1 },
          finishedAt: '2026-01-03T00:00:00.000Z',
        },
        {
          playerId: 'Sam',
          score: 100,
          category: 'hard',
          details: { stage: 1 },
          finishedAt: '2026-01-04T00:00:00.000Z',
        },
      ],
    });
  });

  it('rejects an unknown difficulty', async () => {
    const { app } = await startServerWithResults();
    const response = await app.inject({ method: 'GET', url: `${HIGH_SCORES_URL}?category=expert` });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'unknown-category' });
  });

  it("lists a player's best result per difficulty", async () => {
    const { app } = await startServerWithResults();
    const response = await app.inject({
      method: 'GET',
      url: '/api/games/number-game/personal-bests/sam',
    });
    expect(response.json()).toMatchObject({
      personalBests: [
        { playerId: 'Sam', score: 900, category: 'easy' },
        { playerId: 'Sam', score: 100, category: 'hard' },
      ],
    });
  });

  it('refuses personal bests for an unknown player', async () => {
    const { app } = await startServerWithResults();
    const response = await app.inject({
      method: 'GET',
      url: '/api/games/number-game/personal-bests/Nobody',
    });
    expect(response.statusCode).toBe(404);
  });
});
