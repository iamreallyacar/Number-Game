import { describe, expect, it } from 'vitest';
import { counterTestGame } from '../counter-test-game.js';
import { fakeRoomTestGame } from '../fake-room-test-game.js';
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
    expect(() => new GameRegistry().getGame('chess')).toThrow(
      expect.objectContaining({ statusCode: 404, errorCode: 'unknown-game' }) as Error,
    );
  });

  it('rejects a broken save with a clear error', () => {
    expect(() => counterTestGame.readState({ stateJson: 'not json', stateVersion: 2 })).toThrow(
      'This save is broken',
    );
  });
});

describe('GameRegistry game kinds', () => {
  function registryWithBothKinds(): GameRegistry {
    const registry = new GameRegistry();
    registry.register(counterTestGame);
    registry.register(fakeRoomTestGame);
    return registry;
  }

  it('finds each kind with its own lookup', () => {
    const registry = registryWithBothKinds();
    expect(registry.getSavedGame('counter')).toBe(counterTestGame);
    expect(registry.getRoomGame('fake-room')).toBe(fakeRoomTestGame);
    expect(registry.getGame('counter').kind).toBe('saved');
    expect(registry.getGame('fake-room').kind).toBe('room');
  });

  it('refuses the wrong kind with wrong-game-kind', () => {
    const registry = registryWithBothKinds();
    expect(() => registry.getSavedGame('fake-room')).toThrow(
      expect.objectContaining({ statusCode: 400, errorCode: 'wrong-game-kind' }) as Error,
    );
    expect(() => registry.getRoomGame('counter')).toThrow(
      expect.objectContaining({ statusCode: 400, errorCode: 'wrong-game-kind' }) as Error,
    );
  });

  it('refuses an unknown id with unknown-game for every lookup', () => {
    const registry = registryWithBothKinds();
    const lookups = [
      () => registry.getGame('chess'),
      () => registry.getSavedGame('chess'),
      () => registry.getRoomGame('chess'),
    ];
    for (const lookup of lookups) {
      expect(lookup).toThrow(
        expect.objectContaining({ statusCode: 404, errorCode: 'unknown-game' }) as Error,
      );
    }
  });
});
