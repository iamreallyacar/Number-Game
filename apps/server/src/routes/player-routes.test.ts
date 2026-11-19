import { describe, expect, it } from 'vitest';
import { COUNTER_URL, startTestServer } from '../test-support.js';

describe('player routes', () => {
  it('creates and lists player IDs', async () => {
    const { app } = await startTestServer();
    await app.inject({ method: 'POST', url: '/api/players', body: { playerId: 'Sam' } });
    await app.inject({ method: 'POST', url: '/api/players', body: { playerId: 'Ana Lee' } });
    const response = await app.inject({ method: 'GET', url: '/api/players' });
    expect(response.json()).toEqual({ playerIds: ['Ana Lee', 'Sam'] });
  });

  it('rejects a duplicate player ID in any letter case', async () => {
    const { app } = await startTestServer();
    await app.inject({ method: 'POST', url: '/api/players', body: { playerId: 'Sam' } });
    const response = await app.inject({
      method: 'POST',
      url: '/api/players',
      body: { playerId: 'sam' },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'player-exists' });
  });

  it('rejects a duplicate player ID that differs only in the case of a non-ASCII letter', async () => {
    const { app } = await startTestServer();
    await app.inject({ method: 'POST', url: '/api/players', body: { playerId: 'Émile' } });
    const response = await app.inject({
      method: 'POST',
      url: '/api/players',
      body: { playerId: 'émile' },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'player-exists' });
    const list = await app.inject({ method: 'GET', url: '/api/players' });
    expect(list.json()).toEqual({ playerIds: ['Émile'] });
  });

  it('finds a player by a non-ASCII ID in another letter case', async () => {
    const { app } = await startTestServer();
    await app.inject({ method: 'POST', url: '/api/players', body: { playerId: 'Émile' } });
    const response = await app.inject({
      method: 'GET',
      url: `${COUNTER_URL}/personal-bests/${encodeURIComponent('émile')}`,
    });
    expect(response.statusCode).toBe(200);
  });

  it.each(['Émile', 'a_b.c-1', 'a'.repeat(24)])("accepts the player ID '%s'", async (playerId) => {
    const { app } = await startTestServer();
    const response = await app.inject({ method: 'POST', url: '/api/players', body: { playerId } });
    expect(response.statusCode).toBe(201);
  });

  it('rejects a player ID with a trailing space', async () => {
    const { app } = await startTestServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/players',
      body: { playerId: 'Sam ' },
    });
    expect(response.statusCode).toBe(400);
  });

  it.each(['', ' Sam', 'Sam  Lee', 'a'.repeat(25), 'Sam<script>'])(
    "rejects the player ID '%s'",
    async (playerId) => {
      const { app } = await startTestServer();
      const response = await app.inject({
        method: 'POST',
        url: '/api/players',
        body: { playerId },
      });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ error: 'invalid-request' });
    },
  );

  it('answers a body that is not valid JSON as a bad request, not a server error', async () => {
    const { app } = await startTestServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/players',
      headers: { 'content-type': 'application/json' },
      body: '{"playerId": ',
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'invalid-request' });
  });

  it('answers a body type the server does not read as unsupported', async () => {
    const { app } = await startTestServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/players',
      headers: { 'content-type': 'text/xml' },
      body: '<playerId>Sam</playerId>',
    });
    expect(response.statusCode).toBe(415);
    expect(response.json()).toMatchObject({ error: 'invalid-request' });
  });
});

describe('health route', () => {
  it('reports ok', async () => {
    const { app } = await startTestServer();
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
