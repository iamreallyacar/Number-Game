// Server entry point: reads the settings, opens the database, and starts listening.
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { ConfigError, readConfig, type ServerConfig } from './config.js';
import { openDatabase } from './database/open-database.js';
import { createGameRegistry } from './games/create-game-registry.js';

// The built browser app sits next to this package in the workspace: apps/web/dist.
const WEB_APP_DIR = fileURLToPath(new URL('../../web/dist/', import.meta.url));

function readConfigOrExit(): ServerConfig {
  try {
    return readConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`Configuration error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

const config = readConfigOrExit();
const database = openDatabase(config.dataDir);
const app = await buildApp({
  database,
  games: createGameRegistry(),
  saveSlotsPerGame: config.saveSlotsPerGame,
  webAppDir: WEB_APP_DIR,
  logRequests: true,
});

async function shutDown(signal: string): Promise<void> {
  app.log.info(`Received ${signal}, shutting down`);
  await app.close();
  database.close();
}

process.once('SIGINT', (signal) => void shutDown(signal));
process.once('SIGTERM', (signal) => void shutDown(signal));

await app.listen({ host: config.host, port: config.port });
