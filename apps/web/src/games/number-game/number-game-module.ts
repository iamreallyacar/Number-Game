import { DIFFICULTY_IDS, NUMBER_GAME_ID } from '@local/number-game';
import type { BrowserGame } from '../browser-game.js';
import { describeNumberGameDetails } from './describe-number-game-details.js';
import { DIFFICULTY_LABELS } from './difficulty-labels.js';

export const numberGameBrowserModule: BrowserGame = {
  id: NUMBER_GAME_ID,
  name: 'Number Game',
  description:
    'Clear pairs of numbers that are equal or add up to 10. Clear the board to reach the next stage.',
  // High scores are filtered by difficulty.
  categories: DIFFICULTY_IDS.map((difficulty) => ({
    id: difficulty,
    label: DIFFICULTY_LABELS[difficulty],
  })),
  describeDetails: describeNumberGameDetails,
  loadNewGameOptionsForm: async () => (await import('./NumberGameOptionsForm.svelte')).default,
  loadPlayScreen: async () => (await import('./NumberGamePlayScreen.svelte')).default,
};
