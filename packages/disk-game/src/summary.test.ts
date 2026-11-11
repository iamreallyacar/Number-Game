import { describe, expect, it } from 'vitest';
import {
  InvalidSummaryDetailsError,
  parseSummaryDetails,
  STARTING_DISK_COUNT_CATEGORIES,
  summarizeGame,
} from './summary.js';
import { makeTestState } from './test-support.js';

describe('summarizeGame', () => {
  it('reports the score, stage, starting disk count, and moves left of a save (DK-21)', () => {
    const state = makeTestState({ startingDiskCount: 3, score: 250, movesLeft: 6 });
    expect(summarizeGame(state)).toEqual({
      score: 250,
      category: '3',
      details: { stage: 1, startingDiskCount: 3, movesLeft: 6 },
    });
  });

  it('leaves moves left out of a finished game, which becomes a high score (DK-21)', () => {
    expect(summarizeGame(makeTestState({ movesLeft: 1 })).details).toEqual({
      stage: 1,
      startingDiskCount: 3,
    });
  });

  it('has one category for each starting disk count', () => {
    expect(STARTING_DISK_COUNT_CATEGORIES).toEqual(['3', '4', '5']);
  });
});

describe('parseSummaryDetails', () => {
  it('reads back the details it wrote, with and without moves left', () => {
    for (const state of [makeTestState(), makeTestState({ movesLeft: 0 })]) {
      const { details } = summarizeGame(state);
      expect(parseSummaryDetails(JSON.parse(JSON.stringify(details)))).toEqual(details);
    }
  });

  it.each([
    { problem: 'not an object', value: 'x', message: 'expected an object' },
    { problem: 'stage 0', value: { stage: 0, startingDiskCount: 3 }, message: 'stage' },
    {
      problem: 'a bad starting disk count',
      value: { stage: 1, startingDiskCount: 6 },
      message: 'startingDiskCount',
    },
    {
      problem: 'negative moves left',
      value: { stage: 1, startingDiskCount: 3, movesLeft: -1 },
      message: 'movesLeft',
    },
    {
      problem: 'moves left as text',
      value: { stage: 1, startingDiskCount: 3, movesLeft: '4' },
      message: 'movesLeft',
    },
  ])('rejects $problem', ({ value, message }) => {
    expect(() => parseSummaryDetails(value)).toThrow(InvalidSummaryDetailsError);
    expect(() => parseSummaryDetails(value)).toThrow(message);
  });
});
