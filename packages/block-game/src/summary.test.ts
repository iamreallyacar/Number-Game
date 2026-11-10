import { describe, expect, it } from 'vitest';
import { createEmptyCells } from './board.js';
import {
  BOARD_SIZE_CATEGORIES,
  InvalidSummaryDetailsError,
  parseSummaryDetails,
  summarizeGame,
} from './summary.js';
import { makeTestState } from './test-support.js';

describe('summarizeGame', () => {
  it('reports the score, the board size as the category, and the size and lines cleared', () => {
    const state = makeTestState({
      size: 10,
      cells: createEmptyCells(10),
      score: 250,
      linesCleared: 7,
    });
    expect(summarizeGame(state)).toEqual({
      score: 250,
      category: '10',
      details: { size: 10, linesCleared: 7 },
    });
  });

  it('has one category for each board size', () => {
    expect(BOARD_SIZE_CATEGORIES).toEqual(['8', '9', '10']);
  });
});

describe('parseSummaryDetails', () => {
  it('reads back the details it wrote', () => {
    const details = summarizeGame(makeTestState({ cells: createEmptyCells(8) })).details;
    expect(parseSummaryDetails(JSON.parse(JSON.stringify(details)))).toEqual(details);
  });

  it.each([
    { problem: 'not an object', value: 'x', message: 'expected an object' },
    { problem: 'a bad size', value: { size: 7, linesCleared: 0 }, message: 'size' },
    { problem: 'a size as text', value: { size: '8', linesCleared: 0 }, message: 'size' },
    { problem: 'negative lines', value: { size: 8, linesCleared: -1 }, message: 'linesCleared' },
    { problem: 'decimal lines', value: { size: 8, linesCleared: 1.5 }, message: 'linesCleared' },
  ])('rejects $problem', ({ value, message }) => {
    expect(() => parseSummaryDetails(value)).toThrow(InvalidSummaryDetailsError);
    expect(() => parseSummaryDetails(value)).toThrow(message);
  });
});
