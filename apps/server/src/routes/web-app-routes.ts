import { existsSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { ApiErrorBody } from '../http-error.js';
import type { TypedFastify } from '../typed-fastify.js';

const API_PREFIX = '/api/';
const WEB_APP_ENTRY_FILE = 'index.html';

/**
 * Serves the built browser app from the same port as the API (PL-11). Unknown paths outside the
 * API get the app's index page, so the browser app can handle its own page routing.
 */
export async function registerWebAppRoutes(app: TypedFastify, webAppDir: string): Promise<void> {
  const hasWebApp = existsSync(join(webAppDir, WEB_APP_ENTRY_FILE));
  if (hasWebApp) {
    await app.register(fastifyStatic, { root: webAppDir });
  } else {
    app.log.warn(
      `No built browser app found in ${webAppDir}. Only the API is served. Run npm run build first`,
    );
  }

  app.setNotFoundHandler((request, reply) => {
    if (hasWebApp && request.method === 'GET' && !request.url.startsWith(API_PREFIX)) {
      return reply.sendFile(WEB_APP_ENTRY_FILE);
    }
    const body: ApiErrorBody = {
      error: 'not-found',
      message: `${request.method} ${request.url} does not exist`,
    };
    return reply.code(404).send(body);
  });
}
