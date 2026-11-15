import { describe, expect, it } from 'vitest';
import { describeNumberGameDetails } from './describe-number-game-details.js';

describe('describeNumberGameDetails', () => {
  it('labels the stage and difficulty', () => {
    expect(describeNumberGameDetails({ stage: 3, difficulty: 'hard' })).toEqual([
      { label: 'Stage', value: '3' },
      { label: 'Difficulty', value: 'Hard' },
    ]);
  });

  it('fails loudly on details from a different shape', () => {
    expect(() => describeNumberGameDetails({ stage: '3', difficulty: 'hard' })).toThrow(
      'stage must be a whole number',
    );
    expect(() => describeNumberGameDetails({ stage: 3, difficulty: 'odd' })).toThrow(
      'difficulty must be one of',
    );
  });
});
