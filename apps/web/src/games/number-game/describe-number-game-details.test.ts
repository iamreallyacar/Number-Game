import { describe, expect, it } from 'vitest';
import { describeNumberGameDetails } from './describe-number-game-details.js';

describe('describeNumberGameDetails', () => {
  it('labels the stage, width, and difficulty', () => {
    expect(describeNumberGameDetails({ stage: 3, width: 11, difficulty: 'hard' })).toEqual([
      { label: 'Stage', value: '3' },
      { label: 'Width', value: '11' },
      { label: 'Difficulty', value: 'Hard' },
    ]);
  });

  it('fails loudly on details from a different shape', () => {
    expect(() => describeNumberGameDetails({ stage: '3', width: 11, difficulty: 'hard' })).toThrow(
      'numeric stage',
    );
    expect(() => describeNumberGameDetails({ stage: 3, width: 11, difficulty: 'odd' })).toThrow(
      'unknown difficulty',
    );
  });
});
