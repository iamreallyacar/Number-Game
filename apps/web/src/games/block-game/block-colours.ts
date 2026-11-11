import type { ShapeColour } from '@local/block-game';

/**
 * The colour of each block colour index (BG-09). Mid tones that stand out against the light page
 * background. Filled cells are also drawn raised, so colour is not the only thing that tells them
 * apart from empty cells.
 */
export const BLOCK_COLOURS: Readonly<Record<ShapeColour, string>> = {
  0: '#e0705a',
  1: '#e3a33a',
  2: '#59a95f',
  3: '#2f9e9a',
  4: '#4f7fd8',
  5: '#8b6bd6',
  6: '#d0649f',
  7: '#9aae35',
};
