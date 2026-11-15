import { describe, expect, it } from 'vitest';
import { PLAY_AHEAD_MATCH_BUDGET, countNumbersClearedByPlayAhead } from './play-ahead.js';
import { cellsFromRows } from './test-support.js';

describe('countNumbersClearedByPlayAhead', () => {
  it('counts the numbers cleared by matching until no pair can see each other', () => {
    expect(countNumbersClearedByPlayAhead(cellsFromRows(['1923......']), 10)).toBe(2);
    expect(countNumbersClearedByPlayAhead(cellsFromRows(['1991......']), 10)).toBe(4);
  });

  it('counts what opens up after a match, including a removed row', () => {
    const cells = cellsFromRows(['1.', '.9', '3.', '.7']);
    expect(countNumbersClearedByPlayAhead(cells, 2)).toBe(4);
  });

  it('clears nothing on a board without a pair that sees each other', () => {
    expect(countNumbersClearedByPlayAhead(cellsFromRows(['12', '34']), 2)).toBe(0);
  });

  it('stops after the match budget on a huge board', () => {
    const cells = cellsFromRows(Array<string>(60).fill('1111111111'));
    expect(countNumbersClearedByPlayAhead(cells, 10)).toBe(PLAY_AHEAD_MATCH_BUDGET * 2);
  });
});
