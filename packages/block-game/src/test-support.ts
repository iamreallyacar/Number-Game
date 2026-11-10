// Builders shared by the test files. Excluded from the build in tsconfig.build.json.
import { isShapeColour, type BoardCell } from './board-cell.js';
import type { GameState } from './game-state.js';

/** Builds cells from rows written as text, where '.' is empty and '0' to '7' is a colour. */
export function cellsFromRows(rows: readonly string[]): BoardCell[] {
  return rows.flatMap((row) =>
    Array.from(row, (character): BoardCell => {
      if (character === '.') {
        return null;
      }
      const colour = Number(character);
      if (!isShapeColour(colour)) {
        throw new Error(`Test board has an invalid character '${character}'`);
      }
      return colour;
    }),
  );
}

/** An 8 x 8 board where filled and empty cells alternate, so no two empty cells touch sideways. */
export const CHECKERBOARD_ROWS: readonly string[] = Array.from({ length: 8 }, (_, row) =>
  row % 2 === 0 ? '0.0.0.0.' : '.0.0.0.0',
);

export function makeTestState(overrides: Partial<GameState> & Pick<GameState, 'cells'>): GameState {
  return {
    size: 8,
    slots: ['single', 'square-2', 'line-3-horizontal'],
    score: 0,
    streak: 0,
    linesCleared: 0,
    shapesPlaced: 0,
    randomState: 12345,
    ...overrides,
  };
}
