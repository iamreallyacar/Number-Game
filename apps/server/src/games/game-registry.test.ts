import { describe, expect, it } from 'vitest';
import { counterTestGame } from '../counter-test-game.js';
import { HttpError } from '../http-error.js';
import { GameRegistry } from './game-registry.js';

describe('GameRegistry', () => {
  it('finds a registered game by id', () => {
    const registry = new GameRegistry();
    registry.register(counterTestGame);
    expect(registry.getGame('counter')).toBe(counterTestGame);
  });

  it('refuses two games with the same id', () => {
    const registry = new GameRegistry();
    registry.register(counterTestGame);
    expect(() => {
      registry.register(counterTestGame);
    }).toThrow('already registered');
  });

  it('gives a 404 error for an unknown game', () => {
    expect(() => new GameRegistry().getGame('chess')).toThrow(HttpError);
  });

  it('rejects a broken save with a clear error', () => {
    expect(() => counterTestGame.readState({ stateJson: 'not json', stateVersion: 2 })).toThrow(
      'This save is broken',
    );
  });
});
