import type { DatabaseSync } from 'node:sqlite';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { HighScoresStore } from './database/high-scores-store.js';
import { PlayersStore } from './database/players-store.js';
import { SaveSlotsStore } from './database/save-slots-store.js';
import type { GameRegistry } from './games/game-registry.js';
import { registerErrorHandler } from './http-error.js';
import { registerHealthRoutes } from './routes/health-routes.js';
import { registerHighScoreRoutes } from './routes/high-score-routes.js';
import { registerMoveRoutes } from './routes/move-routes.js';
import { registerPlayerRoutes } from './routes/player-routes.js';
import { registerSaveSlotRoutes } from './routes/save-slot-routes.js';
import { registerWebAppRoutes } from './routes/web-app-routes.js';
import type { TypedFastify } from './typed-fastify.js';

export interface AppDependencies {
  readonly database: DatabaseSync;
  readonly games: GameRegistry;
  readonly saveSlotsPerGame: number;
  readonly webAppDir: string;
  readonly logRequests: boolean;
}

export async function buildApp(dependencies: AppDependencies): Promise<TypedFastify> {
  const app = Fastify({ logger: dependencies.logRequests }).withTypeProvider<TypeBoxTypeProvider>();
  const { database, games, saveSlotsPerGame } = dependencies;
  const players = new PlayersStore(database);
  const saves = new SaveSlotsStore(database);
  const highScores = new HighScoresStore(database);

  registerErrorHandler(app);
  registerHealthRoutes(app);
  registerPlayerRoutes(app, players);
  registerSaveSlotRoutes(app, { games, players, saves, saveSlotsPerGame });
  registerMoveRoutes(app, { database, games, saves, highScores, saveSlotsPerGame });
  registerHighScoreRoutes(app, { games, players, highScores });
  await registerWebAppRoutes(app, dependencies.webAppDir);
  return app;
}
