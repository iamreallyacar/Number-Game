import type { DatabaseSync } from 'node:sqlite';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';
import { HighScoresStore } from './database/high-scores-store.js';
import { PlayersStore } from './database/players-store.js';
import { SaveSlotsStore } from './database/save-slots-store.js';
import type { GameRegistry } from './games/game-registry.js';
import { registerErrorHandler } from './http-error.js';
import { RoomRunner } from './rooms/room-runner.js';
import { SOCKET_MAX_BUFFERED_BYTES, SOCKET_PING_INTERVAL_MS } from './rooms/room-timing.js';
import { RoomStore } from './rooms/room-store.js';
import { SocketWatchdog } from './rooms/socket-watchdog.js';
import type { StepScheduler } from './rooms/step-loop.js';
import { startWaitingRoomExpiry } from './rooms/waiting-room-expiry.js';
import { registerHealthRoutes } from './routes/health-routes.js';
import { registerHighScoreRoutes } from './routes/high-score-routes.js';
import { registerMoveRoutes } from './routes/move-routes.js';
import { registerPlayerRoutes } from './routes/player-routes.js';
import { registerSaveSlotRoutes } from './routes/save-slot-routes.js';
import { registerRoomRoutes } from './routes/room-routes.js';
import { registerRoomSocketRoutes } from './routes/room-socket-routes.js';
import { registerWebAppRoutes } from './routes/web-app-routes.js';
import type { TypedFastify } from './typed-fastify.js';

const MAX_SOCKET_MESSAGE_BYTES = 4096;

export interface AppDependencies {
  readonly database: DatabaseSync;
  readonly games: GameRegistry;
  readonly saveSlotsPerGame: number;
  readonly maxRoomGameRuns: number;
  /** The clock and timer of the step loops of room games. Tests give one they move by hand. */
  readonly stepScheduler: StepScheduler;
  readonly webAppDir: string;
  readonly logRequests: boolean;
}

export async function buildApp(dependencies: AppDependencies): Promise<TypedFastify> {
  const app = Fastify({ logger: dependencies.logRequests }).withTypeProvider<TypeBoxTypeProvider>();
  const { database, games, saveSlotsPerGame } = dependencies;
  const players = new PlayersStore(database);
  const saves = new SaveSlotsStore(database);
  const highScores = new HighScoresStore(database);
  const rooms = new RoomStore(dependencies.maxRoomGameRuns, () => dependencies.stepScheduler.now());
  const runner = new RoomRunner({
    rooms,
    highScores,
    scheduler: dependencies.stepScheduler,
    logger: app.log,
  });

  const watchdog = new SocketWatchdog({
    scheduler: dependencies.stepScheduler,
    pingIntervalMilliseconds: SOCKET_PING_INTERVAL_MS,
    maxBufferedBytes: SOCKET_MAX_BUFFERED_BYTES,
  });
  watchdog.start();
  const stopWaitingRoomExpiry = startWaitingRoomExpiry(rooms, dependencies.stepScheduler);

  // Registered before the WebSocket plugin so it closes the sockets with its own close code first.
  app.addHook('preClose', () => {
    watchdog.stop();
    stopWaitingRoomExpiry();
    runner.shutDown();
  });

  // A browser only ever sends a direction or an upgrade choice, so a big frame is a mistake.
  await app.register(websocket, { options: { maxPayload: MAX_SOCKET_MESSAGE_BYTES } });

  registerErrorHandler(app);
  registerHealthRoutes(app);
  registerPlayerRoutes(app, players);
  registerSaveSlotRoutes(app, { games, players, saves, saveSlotsPerGame });
  registerMoveRoutes(app, { database, games, saves, highScores, saveSlotsPerGame });
  registerHighScoreRoutes(app, { games, players, highScores });
  registerRoomRoutes(app, { games, players, rooms, runner });
  registerRoomSocketRoutes(app, {
    games,
    runner,
    watchdog,
    scheduler: dependencies.stepScheduler,
  });
  await registerWebAppRoutes(app, dependencies.webAppDir);
  return app;
}
