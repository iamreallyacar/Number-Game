import type { BrowserGame } from './browser-game.js';
import { BrowserGameRegistry } from './browser-game-registry.js';
import { numberGameBrowserModule } from './number-game/number-game-module.js';

/** Every game on the dashboard. A new game adds one line here. */
export function createBrowserGameRegistry(): BrowserGameRegistry<BrowserGame> {
  const registry = new BrowserGameRegistry<BrowserGame>();
  registry.register(numberGameBrowserModule);
  return registry;
}
