import { describe, expect, it } from 'vitest';
import { startTestServer } from '../test-support.js';

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
