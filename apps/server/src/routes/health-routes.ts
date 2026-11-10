import type { TypedFastify } from '../typed-fastify.js';

export function registerHealthRoutes(app: TypedFastify): void {
  app.get('/api/health', () => ({ status: 'ok' }));
}
