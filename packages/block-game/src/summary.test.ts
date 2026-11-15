import { describe, expect, it } from 'vitest';
import { createEmptyCells } from './board.js';
import {
  BLOCK_GAME_CATEGORIES,
  BLOCK_GAME_CATEGORY,
  InvalidSummaryDetailsError,
  parseSummaryDetails,
  summarizeGame,
} from './summary.js';
import { makeTestState } from './test-support.js';

describe('summarizeGame', () => {
  it('reports the score, the one category, and the lines cleared', () => {
    const state = makeTestState({ cells: createEmptyCells(), score: 250, linesCleared: 7 });
    expect(summarizeGame(state)).toEqual({
      score: 250,
      category: 'standard',
      details: { linesCleared: 7 },
    });
  });

  it('has one category', () => {
    expect(BLOCK_GAME_CATEGORIES).toEqual([BLOCK_GAME_CATEGORY]);
  });
});

describe('parseSummaryDetails', () => {
  it('reads back the details it wrote', () => {
    const details = summarizeGame(makeTestState({ cells: createEmptyCells() })).details;
    expect(parseSummaryDetails(JSON.parse(JSON.stringify(details)))).toEqual(details);
  });

  it.each([
    { problem: 'not an object', value: 'x', message: 'expected an object' },
    { problem: 'an unknown field', value: { size: 10, linesCleared: 0 }, message: "'size'" },
    { problem: 'missing lines', value: {}, message: 'linesCleared' },
    { problem: 'negative lines', value: { linesCleared: -1 }, message: 'linesCleared' },
    { problem: 'decimal lines', value: { linesCleared: 1.5 }, message: 'linesCleared' },
  ])('rejects $problem', ({ value, message }) => {
    expect(() => parseSummaryDetails(value)).toThrow(InvalidSummaryDetailsError);
    expect(() => parseSummaryDetails(value)).toThrow(message);
  });
});
