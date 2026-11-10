/** Every page of the browser app. Pages inside a game carry the game id from the URL. */
export type Route =
  | { readonly page: 'dashboard' }
  | { readonly page: 'game-menu'; readonly gameId: string }
  | { readonly page: 'new-game'; readonly gameId: string }
  | { readonly page: 'load-game'; readonly gameId: string }
  | { readonly page: 'play'; readonly gameId: string; readonly slotNumber: number }
  | { readonly page: 'high-scores'; readonly gameId: string }
  | { readonly page: 'not-found' };

export type PageRoute = Exclude<Route, { readonly page: 'not-found' }>;

const SLOT_NUMBER_PATTERN = /^[1-9]\d*$/;

function decodePathPart(part: string): string | null {
  try {
    return decodeURIComponent(part);
  } catch {
    // A broken percent sign in a typed URL is an unknown page, not an app error.
    return null;
  }
}

/** Turns a URL path into a route. Unknown paths give the not-found page. */
export function parseRoute(path: string): Route {
  const parts = path.split('/').filter((part) => part !== '');
  if (parts.length === 0) {
    return { page: 'dashboard' };
  }
  const [section, encodedGameId, subPage, slotText, ...extraParts] = parts;
  if (section !== 'games' || encodedGameId === undefined || extraParts.length > 0) {
    return { page: 'not-found' };
  }
  const gameId = decodePathPart(encodedGameId);
  if (gameId === null) {
    return { page: 'not-found' };
  }
  if (subPage === undefined) {
    return { page: 'game-menu', gameId };
  }
  if (slotText === undefined) {
    switch (subPage) {
      case 'new':
        return { page: 'new-game', gameId };
      case 'load':
        return { page: 'load-game', gameId };
      case 'high-scores':
        return { page: 'high-scores', gameId };
    }
    return { page: 'not-found' };
  }
  if (subPage === 'slots' && SLOT_NUMBER_PATTERN.test(slotText)) {
    return { page: 'play', gameId, slotNumber: Number(slotText) };
  }
  return { page: 'not-found' };
}

/** Builds the URL path of a route. parseRoute(routePath(route)) gives back the same route. */
export function routePath(route: PageRoute): string {
  if (route.page === 'dashboard') {
    return '/';
  }
  const gamePath = `/games/${encodeURIComponent(route.gameId)}`;
  switch (route.page) {
    case 'game-menu':
      return gamePath;
    case 'new-game':
      return `${gamePath}/new`;
    case 'load-game':
      return `${gamePath}/load`;
    case 'high-scores':
      return `${gamePath}/high-scores`;
    case 'play':
      return `${gamePath}/slots/${String(route.slotNumber)}`;
  }
}
