import { describe, expect, it } from 'vitest';
import { parseRoute, routePath, type PageRoute } from './routes.js';

const SAVE_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

describe('parseRoute', () => {
  it('reads every page from its path', () => {
    expect(parseRoute('/')).toEqual({ page: 'dashboard' });
    expect(parseRoute('/games/number-game')).toEqual({ page: 'game', gameId: 'number-game' });
    expect(parseRoute(`/games/number-game/slots/3/saves/${SAVE_ID}`)).toEqual({
      page: 'play',
      gameId: 'number-game',
      slotNumber: 3,
      saveId: SAVE_ID,
    });
  });

  it('opens the game page for the paths of the former new game, load game, and high score pages', () => {
    for (const path of [
      '/games/number-game/new',
      '/games/number-game/load/',
      '/games/number-game/high-scores',
    ]) {
      expect(parseRoute(path)).toEqual({ page: 'game', gameId: 'number-game' });
    }
  });

  it('reads a play link without a save id as outdated, so it opens no game', () => {
    expect(parseRoute('/games/number-game/slots/3')).toEqual({
      page: 'outdated-play-link',
      gameId: 'number-game',
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
      '/games/number-game/slots/2/saves',
      '/games/number-game/slots/2/saves/not-a-save-id',
      `/games/number-game/slots/2/other/${SAVE_ID}`,
      `/games/number-game/slots/2x/saves/${SAVE_ID}`,
      `/games/number-game/slots/2/saves/${SAVE_ID}/extra`,
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
      { page: 'game', gameId: 'a game/with slash' },
      { page: 'play', gameId: 'number-game', slotNumber: 12, saveId: SAVE_ID },
    ];
    for (const route of routes) {
      expect(parseRoute(routePath(route))).toEqual(route);
    }
  });
});
