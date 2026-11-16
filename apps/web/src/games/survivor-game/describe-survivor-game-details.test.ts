import { describe, expect, it } from 'vitest';
import { describeSurvivorGameDetails } from './describe-survivor-game-details.js';
import { formatTimeSurvived } from './format-time-survived.js';

describe('describeSurvivorGameDetails', () => {
  it('labels the time survived and the level reached', () => {
    expect(describeSurvivorGameDetails({ secondsSurvived: 205, levelReached: 7 })).toEqual([
      { label: 'Time survived', value: '3:25' },
      { label: 'Level reached', value: '7' },
    ]);
  });

  it('fails loudly on details of a different shape', () => {
    expect(() => describeSurvivorGameDetails({ linesCleared: 3 })).toThrow('unknown field');
  });
});

describe('formatTimeSurvived', () => {
  it('pads the seconds', () => {
    expect(formatTimeSurvived(0)).toBe('0:00');
    expect(formatTimeSurvived(65)).toBe('1:05');
    expect(formatTimeSurvived(3600)).toBe('60:00');
  });
});
