import { BOARD_SIZE, type BoardCell, type BoardGrid } from '@local/block-game';
import { describe, expect, it } from 'vitest';
import { buildPlacementPreview } from './placement-preview.js';

/** A 10 x 10 board with the top row filled except its last two cells. */
function boardWithAlmostFullTopRow(): BoardGrid {
  const cells: BoardCell[] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) =>
    index < BOARD_SIZE - 2 ? 0 : null,
  );
  return { cells };
}

describe('buildPlacementPreview', () => {
  it('shows the covered cells and the row that would be cleared', () => {
    const preview = buildPlacementPreview(boardWithAlmostFullTopRow(), 'line-2-horizontal', {
      topRow: 0,
      leftColumn: 8,
    });
    expect(preview).toEqual({
      coveredCellIndexes: [8, 9],
      fits: true,
      clearingCellIndexes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    });
  });

  it('marks a shape over filled cells as not fitting and clears nothing', () => {
    const preview = buildPlacementPreview(boardWithAlmostFullTopRow(), 'square-2', {
      topRow: 0,
      leftColumn: 0,
    });
    expect(preview).toEqual({
      coveredCellIndexes: [0, 1, 10, 11],
      fits: false,
      clearingCellIndexes: [],
    });
  });

  it('fails loudly on a target that sticks out of the board', () => {
    expect(() =>
      buildPlacementPreview(boardWithAlmostFullTopRow(), 'square-2', { topRow: 9, leftColumn: 0 }),
    ).toThrow('sticks out of the board');
  });
});
