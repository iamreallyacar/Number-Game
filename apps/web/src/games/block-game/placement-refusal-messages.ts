import type { PlacementRefusal } from '@local/block-game';

export const PLACEMENT_REFUSAL_MESSAGES: Readonly<Record<PlacementRefusal, string>> = {
  'cell-occupied': 'That shape does not fit there',
  'out-of-bounds': 'That shape would stick out of the board',
  'game-over': 'The game is over',
  'slot-out-of-range': 'That slot does not exist',
};
