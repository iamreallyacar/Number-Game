import { BLOCK_GAME_CATEGORY, BLOCK_GAME_ID } from '@local/block-game';
import type { SavedBrowserGame } from '../browser-game.js';
import { describeBlockGameDetails } from './describe-block-game-details.js';

export const blockGameBrowserModule: SavedBrowserGame = {
  kind: 'saved',
  id: BLOCK_GAME_ID,
  name: 'Block Game',
  description:
    'Drag shapes onto the board. Fill a whole row or column to clear it, and keep going while shapes still fit.',
  categories: [{ id: BLOCK_GAME_CATEGORY, label: 'All games' }],
  describeDetails: describeBlockGameDetails,
  loadNewGameOptionsForm: async () => (await import('./BlockGameOptionsForm.svelte')).default,
  loadPlayScreen: async () => (await import('./BlockGamePlayScreen.svelte')).default,
};
