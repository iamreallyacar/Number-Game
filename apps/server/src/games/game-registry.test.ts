import { describe, expect, it } from 'vitest';
import { HttpError } from '../http-error.js';
import { GameRegistry } from './game-registry.js';
import { numberGameServerModule } from './number-game.js';

describe('GameRegistry', () => {
  it('finds a registered game by id', () => {
    const registry = new GameRegistry();
    registry.register(numberGameServerModule);
    expect(registry.getGame('number-game')).toBe(numberGameServerModule);
  });

  it('refuses two games with the same id', () => {
    const registry = new GameRegistry();
    registry.register(numberGameServerModule);
    expect(() => {
      registry.register(numberGameServerModule);
    }).toThrow('already registered');
  });

  it('gives a 404 error for an unknown game', () => {
    expect(() => new GameRegistry().getGame('chess')).toThrow(HttpError);
  });

  it('rejects a broken save with a clear error', () => {
    expect(() => numberGameServerModule.readState('{"width": 9}')).toThrow('This save is broken');
    expect(() => numberGameServerModule.readState('not json')).toThrow('This save is broken');
  });
});
