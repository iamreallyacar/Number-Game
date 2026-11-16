import {
  MAX_PLAYERS_PER_ROOM,
  SURVIVOR_GAME_CATEGORIES,
  SURVIVOR_GAME_ID,
} from '@local/survivor-game';
import type { RoomBrowserGame } from '../browser-game.js';
import { describeSurvivorGameDetails } from './describe-survivor-game-details.js';

/** High scores are filtered by the number of players, which the category holds as text. */
function labelPlayerCount(category: string): string {
  return category === '1' ? '1 player' : `${category} players`;
}

export const survivorGameBrowserModule: RoomBrowserGame = {
  kind: 'room',
  id: SURVIVOR_GAME_ID,
  name: 'Survivor Game',
  description: `Survive endless waves together with up to ${String(MAX_PLAYERS_PER_ROOM)} players on their own phones. Stay roped together, level up, and choose upgrades.`,
  categories: SURVIVOR_GAME_CATEGORIES.map((category) => ({
    id: category,
    label: labelPlayerCount(category),
  })),
  describeDetails: describeSurvivorGameDetails,
  loadPlayScreen: async () => (await import('./SurvivorGamePlayScreen.svelte')).default,
};
