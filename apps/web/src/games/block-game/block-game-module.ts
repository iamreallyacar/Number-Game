import { BLOCK_GAME_ID, BOARD_SIZES, boardSizeCategory } from '@local/block-game';
import type { BrowserGame } from '../browser-game.js';
import { boardSizeLabel } from './board-size-labels.js';
import { describeBlockGameDetails } from './describe-block-game-details.js';

export const blockGameBrowserModule: BrowserGame = {
  id: BLOCK_GAME_ID,
  name: 'Block Game',
  description:
    'Drag shapes onto the board. Fill a whole row or column to clear it, and keep going while shapes still fit.',
  // High scores are filtered by board size (BG-21).
  categories: BOARD_SIZES.map((size) => ({
    id: boardSizeCategory(size),
    label: boardSizeLabel(size),
  })),
  describeDetails: describeBlockGameDetails,
  loadNewGameOptionsForm: async () => (await import('./BlockGameOptionsForm.svelte')).default,
  loadPlayScreen: async () => (await import('./BlockGamePlayScreen.svelte')).default,
};
