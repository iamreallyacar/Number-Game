import { describe, expect, it } from 'vitest';
import { describeBlockGameDetails } from './describe-block-game-details.js';

describe('describeBlockGameDetails', () => {
  it('labels the lines cleared', () => {
    expect(describeBlockGameDetails({ linesCleared: 14 })).toEqual([
      { label: 'Lines cleared', value: '14' },
    ]);
  });

  it('fails loudly on details from a different shape', () => {
    expect(() => describeBlockGameDetails({ size: 10, linesCleared: 0 })).toThrow(
      "unknown field 'size'",
    );
    expect(() => describeBlockGameDetails({ linesCleared: '3' })).toThrow(
      'linesCleared must be a whole number',
    );
  });
});
