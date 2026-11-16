import { saveIdSchema } from '@local/game-server-api';
import { Value } from 'typebox/value';

/** Every page of the browser app. Pages inside a game carry the game id from the URL. */
export type Route =
  | { readonly page: 'dashboard' }
  /** The leaderboard and the save slots of one game. */
  | { readonly page: 'game'; readonly gameId: string }
  | {
      readonly page: 'play';
      readonly gameId: string;
      readonly slotNumber: number;
      readonly saveId: string;
    }
  /** The waiting room and the play screen of one room of a room game. */
  | { readonly page: 'room'; readonly gameId: string; readonly roomId: string }
  /** A play link from before save ids, which names only the slot and so cannot be trusted. */
  | { readonly page: 'outdated-play-link'; readonly gameId: string }
  | { readonly page: 'not-found' };

/** The routes the app links to. It never makes outdated play links or links to nowhere. */
export type PageRoute = Exclude<Route, { readonly page: 'not-found' | 'outdated-play-link' }>;

/** Paths of pages that are now part of the game page. Old links and bookmarks still open it. */
const FORMER_GAME_SUB_PAGES: readonly string[] = ['new', 'load', 'high-scores'];

/** The query parameter of a room page link that names the player ID this device plays as. */
const ROOM_PLAYER_ID_PARAMETER = 'playerId';

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
  const [section, encodedGameId, subPage, slotText, savesText, saveId, ...extraParts] = parts;
  if (section !== 'games' || encodedGameId === undefined || extraParts.length > 0) {
    return { page: 'not-found' };
  }
  const gameId = decodePathPart(encodedGameId);
  if (gameId === null) {
    return { page: 'not-found' };
  }
  if (subPage === undefined) {
    return { page: 'game', gameId };
  }
  if (subPage === 'rooms') {
    const roomId = slotText === undefined ? null : decodePathPart(slotText);
    return roomId === null || savesText !== undefined
      ? { page: 'not-found' }
      : { page: 'room', gameId, roomId };
  }
  if (slotText === undefined) {
    return FORMER_GAME_SUB_PAGES.includes(subPage)
      ? { page: 'game', gameId }
      : { page: 'not-found' };
  }
  if (subPage !== 'slots' || !SLOT_NUMBER_PATTERN.test(slotText)) {
    return { page: 'not-found' };
  }
  if (savesText === undefined) {
    return { page: 'outdated-play-link', gameId };
  }
  if (savesText === 'saves' && Value.Check(saveIdSchema, saveId)) {
    return { page: 'play', gameId, slotNumber: Number(slotText), saveId };
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
    case 'game':
      return gamePath;
    case 'play':
      return `${gamePath}/slots/${String(route.slotNumber)}/saves/${route.saveId}`;
    case 'room':
      return `${gamePath}/rooms/${encodeURIComponent(route.roomId)}`;
  }
}

/** The room page link for one player, so reloading the page returns to the same character. */
export function roomPagePath(gameId: string, roomId: string, playerId: string | null): string {
  const path = routePath({ page: 'room', gameId, roomId });
  return playerId === null
    ? path
    : `${path}?${ROOM_PLAYER_ID_PARAMETER}=${encodeURIComponent(playerId)}`;
}

/** The player ID in the query of a room page link, or null when the link names none. */
export function readRoomPagePlayerId(search: string): string | null {
  const playerId = new URLSearchParams(search).get(ROOM_PLAYER_ID_PARAMETER);
  return playerId === null || playerId === '' ? null : playerId;
}
