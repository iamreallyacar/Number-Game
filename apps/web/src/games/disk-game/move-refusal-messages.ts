import type { MoveRefusal } from '@local/disk-game';

/** What the player is told when a move, an undo, or a hint is refused (DK-10, DK-14). */
export const MOVE_REFUSAL_MESSAGES: Readonly<Record<MoveRefusal, string>> = {
  'game-over': 'The game is over.',
  'no-such-peg': 'That peg does not exist.',
  'same-peg': 'The disk is already on that peg.',
  'empty-peg': 'That peg has no disk to move.',
  'onto-smaller-disk': 'A disk cannot go on top of a smaller disk.',
  'nothing-to-undo': 'There is no move to undo in this stage.',
  'would-end-game': 'You do not have enough moves left for that.',
};
