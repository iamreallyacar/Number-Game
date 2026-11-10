import { describe, expect, it } from 'vitest';
import { describeBlockGameDetails } from './describe-block-game-details.js';

describe('describeBlockGameDetails', () => {
  it('labels the board size and lines cleared', () => {
    expect(describeBlockGameDetails({ size: 9, linesCleared: 14 })).toEqual([
      { label: 'Board', value: '9 x 9' },
      { label: 'Lines cleared', value: '14' },
    ]);
  });

  it('fails loudly on details from a different shape', () => {
    expect(() => describeBlockGameDetails({ size: 7, linesCleared: 0 })).toThrow(
      'size must be one of',
    );
    expect(() => describeBlockGameDetails({ size: 8, linesCleared: '3' })).toThrow(
      'linesCleared must be a whole number',
    );
  });
});
