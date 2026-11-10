import { describe, expect, it } from 'vitest';
import { BrowserGameRegistry } from './browser-game-registry.js';

describe('BrowserGameRegistry', () => {
  it('lists registered games in order and finds them by id', () => {
    const registry = new BrowserGameRegistry<{ id: string }>();
    registry.register({ id: 'first' });
    registry.register({ id: 'second' });
    expect(registry.listGames()).toEqual([{ id: 'first' }, { id: 'second' }]);
    expect(registry.findGame('second')).toEqual({ id: 'second' });
    expect(registry.findGame('missing')).toBeNull();
  });

  it('refuses two games with the same id', () => {
    const registry = new BrowserGameRegistry<{ id: string }>();
    registry.register({ id: 'same' });
    expect(() => {
      registry.register({ id: 'same' });
    }).toThrow("A game with id 'same' is already registered");
  });
});
