import { describe, expect, it } from 'vitest';
import { STEP_RATE } from './balance.js';
import {
  InvalidSummaryDetailsError,
  parseSummaryDetails,
  SURVIVOR_GAME_CATEGORIES,
  summarizeRun,
} from './summary.js';
import { makeRun } from './test-support.js';

describe('summarizeRun', () => {
  it('reports the score, the number of players, the time survived, and the level (SG-49)', () => {
    const state = {
      ...makeRun(['a', 'b', 'c']),
      score: 320,
      teamLevel: 7,
      stepCount: STEP_RATE * 95 + 12,
    };
    expect(summarizeRun(state)).toEqual({
      score: 320,
      category: '3',
      details: { secondsSurvived: 95, levelReached: 7 },
    });
  });

  it('has a category for every number of players', () => {
    expect(SURVIVOR_GAME_CATEGORIES).toEqual(['1', '2', '3', '4']);
    expect(SURVIVOR_GAME_CATEGORIES).toContain(summarizeRun(makeRun(['a', 'b'])).category);
  });
});

describe('parseSummaryDetails', () => {
  it('reads back the details it wrote', () => {
    const details = summarizeRun(makeRun()).details;
    expect(parseSummaryDetails(JSON.parse(JSON.stringify(details)))).toEqual(details);
  });

  it.each([
    { problem: 'not an object', value: 'x', message: 'expected an object' },
    {
      problem: 'an unknown field',
      value: { secondsSurvived: 1, levelReached: 1, a: 1 },
      message: "'a'",
    },
    { problem: 'missing seconds', value: { levelReached: 1 }, message: 'secondsSurvived' },
    {
      problem: 'negative seconds',
      value: { secondsSurvived: -1, levelReached: 1 },
      message: 'secondsSurvived',
    },
    { problem: 'missing level', value: { secondsSurvived: 0 }, message: 'levelReached' },
    { problem: 'level 0', value: { secondsSurvived: 0, levelReached: 0 }, message: 'levelReached' },
    {
      problem: 'decimal level',
      value: { secondsSurvived: 0, levelReached: 1.5 },
      message: 'levelReached',
    },
  ])('rejects $problem', ({ value, message }) => {
    expect(() => parseSummaryDetails(value)).toThrow(InvalidSummaryDetailsError);
    expect(() => parseSummaryDetails(value)).toThrow(message);
  });
});
