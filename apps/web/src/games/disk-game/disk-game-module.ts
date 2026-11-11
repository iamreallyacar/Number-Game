import { DISK_GAME_ID, STARTING_DISK_COUNTS, startingDiskCountCategory } from '@local/disk-game';
import type { BrowserGame } from '../browser-game.js';
import { describeDiskGameDetails } from './describe-disk-game-details.js';
import { startingDiskCountLabel } from './disk-count-labels.js';

export const diskGameBrowserModule: BrowserGame = {
  id: DISK_GAME_ID,
  name: 'Disk Game',
  description:
    'Move disks between three pegs until they all sit on one. Use as few moves as you can, because the moves you save carry over to the next stage.',
  // High scores are filtered by starting disk count (DK-21).
  categories: STARTING_DISK_COUNTS.map((startingDiskCount) => ({
    id: startingDiskCountCategory(startingDiskCount),
    label: startingDiskCountLabel(startingDiskCount),
  })),
  describeDetails: describeDiskGameDetails,
  loadNewGameOptionsForm: async () => (await import('./DiskGameOptionsForm.svelte')).default,
  loadPlayScreen: async () => (await import('./DiskGamePlayScreen.svelte')).default,
};
