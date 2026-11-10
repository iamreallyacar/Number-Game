import { GameRegistry } from './game-registry.js';
import { numberGameServerModule } from './number-game.js';

/** The one place that lists the games this server offers. Add new games here. */
export function createGameRegistry(): GameRegistry {
  const registry = new GameRegistry();
  registry.register(numberGameServerModule);
  return registry;
}
