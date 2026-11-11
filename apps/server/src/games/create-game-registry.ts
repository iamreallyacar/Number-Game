import { blockGameServerModule } from './block-game.js';
import { diskGameServerModule } from './disk-game.js';
import { GameRegistry } from './game-registry.js';
import { numberGameServerModule } from './number-game.js';

/** The one place that lists the games this server offers. Add new games here. */
export function createGameRegistry(): GameRegistry {
  const registry = new GameRegistry();
  registry.register(numberGameServerModule);
  registry.register(blockGameServerModule);
  registry.register(diskGameServerModule);
  return registry;
}
