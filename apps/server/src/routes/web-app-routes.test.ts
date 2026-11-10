import { describe, expect, it } from 'vitest';
import { makeWebAppDir, startTestServer } from '../test-support.js';

describe('web app routes', () => {
  it('serves files of the built browser app', async () => {
    const { app } = await startTestServer(makeWebAppDir());
    const response = await app.inject({ method: 'GET', url: '/app.js' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('console.log');
  });

  it('serves the index page for browser app pages', async () => {
    const { app } = await startTestServer(makeWebAppDir());
    const response = await app.inject({ method: 'GET', url: '/games/counter' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('dashboard');
  });

  it('answers unknown API paths with a JSON 404', async () => {
    const { app } = await startTestServer(makeWebAppDir());
    const response = await app.inject({ method: 'GET', url: '/api/nothing' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'not-found' });
  });

  it('still serves the API when the browser app has not been built', async () => {
    const { app } = await startTestServer();
    const page = await app.inject({ method: 'GET', url: '/' });
    expect(page.statusCode).toBe(404);
    const health = await app.inject({ method: 'GET', url: '/api/health' });
    expect(health.statusCode).toBe(200);
  });
});
