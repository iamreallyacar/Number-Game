import type { BlockShape } from '@local/block-game';

/** A short spoken description of a shape for screen readers, such as "4 blocks, 2 wide, 2 tall". */
export function describeShape(shape: BlockShape): string {
  const blocks = shape.cells.length === 1 ? '1 block' : `${String(shape.cells.length)} blocks`;
  return `${blocks}, ${String(shape.width)} wide, ${String(shape.height)} tall`;
}
