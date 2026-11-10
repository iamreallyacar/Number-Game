import { describe, expect, it } from 'vitest';
import { createGame } from './new-game.js';
import { InvalidSummaryDetailsError, parseSummaryDetails, summarizeGame } from './summary.js';

describe('summarizeGame', () => {
  it('sums up the score, difficulty, stage, and width', () => {
    const state = createGame({ width: 11, difficulty: 'hard', seed: 7 });
    expect(summarizeGame(state)).toEqual({
      score: 0,
      category: 'hard',
      details: { stage: 1, width: 11, difficulty: 'hard' },
    });
  });

  it('gives details that parse back to the same value', () => {
    const { details } = summarizeGame(createGame({ width: 10, difficulty: 'easy', seed: 1 }));
    expect(parseSummaryDetails(JSON.parse(JSON.stringify(details)))).toEqual(details);
  });
});

describe('parseSummaryDetails', () => {
  it.each([
    { name: 'a text stage', details: { stage: '3', width: 11, difficulty: 'hard' } },
    { name: 'an unknown width', details: { stage: 3, width: 9, difficulty: 'hard' } },
    { name: 'an unknown difficulty', details: { stage: 3, width: 11, difficulty: 'odd' } },
    { name: 'a list', details: [] },
  ])('rejects details with $name', ({ details }) => {
    expect(() => parseSummaryDetails(details)).toThrow(InvalidSummaryDetailsError);
  });
});
