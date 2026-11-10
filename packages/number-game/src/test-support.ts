// Builders shared by the test files. Excluded from the build in tsconfig.build.json.
import { isDigit, type Cell } from './cell.js';
import type { GameState } from './game-state.js';

/** Builds cells from rows written as text, where '.' is an empty cell, such as '3..7'. */
export function cellsFromRows(rows: readonly string[]): Cell[] {
  return rows.flatMap((row) =>
    Array.from(row, (character): Cell => {
      if (character === '.') {
        return null;
      }
      const digit = Number(character);
      if (!isDigit(digit)) {
        throw new Error(`Test board has an invalid character '${character}'`);
      }
      return digit;
    }),
  );
}

export function makeTestState(overrides: Partial<GameState> & Pick<GameState, 'cells'>): GameState {
  return {
    width: 10,
    score: 0,
    stage: 1,
    difficulty: 'normal',
    addNumbersLeft: 5,
    hintsLeft: 3,
    randomState: 12345,
    ...overrides,
  };
}
