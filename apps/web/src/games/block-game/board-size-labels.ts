import type { BoardSize } from '@local/block-game';

/** How a board size is written for the player, such as "8 x 8". */
export function boardSizeLabel(size: BoardSize): string {
  return `${String(size)} x ${String(size)}`;
}
