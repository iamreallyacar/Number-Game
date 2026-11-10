import { describe, expect, it } from 'vitest';
import { parseRoute, routePath, type PageRoute } from './routes.js';

describe('parseRoute', () => {
  it('reads every page from its path', () => {
    expect(parseRoute('/')).toEqual({ page: 'dashboard' });
    expect(parseRoute('/games/number-game')).toEqual({ page: 'game-menu', gameId: 'number-game' });
    expect(parseRoute('/games/number-game/new')).toEqual({
      page: 'new-game',
      gameId: 'number-game',
    });
    expect(parseRoute('/games/number-game/load/')).toEqual({
      page: 'load-game',
      gameId: 'number-game',
    });
    expect(parseRoute('/games/number-game/high-scores')).toEqual({
      page: 'high-scores',
      gameId: 'number-game',
    });
    expect(parseRoute('/games/number-game/slots/3')).toEqual({
      page: 'play',
      gameId: 'number-game',
      slotNumber: 3,
    });
  });

  it('gives the not-found page for unknown paths', () => {
    for (const path of [
      '/players',
      '/games',
      '/games/number-game/other',
      '/games/number-game/slots/0',
      '/games/number-game/slots/2x',
      '/games/number-game/slots/2/extra',
      '/games/%E0%A4%A',
    ]) {
      expect(parseRoute(path)).toEqual({ page: 'not-found' });
    }
  });
});

describe('routePath', () => {
  it('builds paths that parse back to the same route', () => {
    const routes: PageRoute[] = [
      { page: 'dashboard' },
      { page: 'game-menu', gameId: 'a game/with slash' },
      { page: 'new-game', gameId: 'number-game' },
      { page: 'load-game', gameId: 'number-game' },
      { page: 'high-scores', gameId: 'number-game' },
      { page: 'play', gameId: 'number-game', slotNumber: 12 },
    ];
    for (const route of routes) {
      expect(parseRoute(routePath(route))).toEqual(route);
    }
  });
});
