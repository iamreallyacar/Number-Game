import { describe, expect, it } from 'vitest';
import { EXPERIENCE_ADDED_PER_LEVEL, FIRST_LEVEL_EXPERIENCE } from './balance.js';
import { experienceNeededAt, gainExperience } from './experience.js';

describe('experienceNeededAt', () => {
  it('needs the first level amount at level 1 and more with each level (SG-35)', () => {
    expect(experienceNeededAt(1)).toBe(FIRST_LEVEL_EXPERIENCE);
    expect(experienceNeededAt(2)).toBe(FIRST_LEVEL_EXPERIENCE + EXPERIENCE_ADDED_PER_LEVEL);
    expect(experienceNeededAt(10)).toBe(FIRST_LEVEL_EXPERIENCE + 9 * EXPERIENCE_ADDED_PER_LEVEL);
  });
});

describe('gainExperience', () => {
  it('fills the bar without a level up', () => {
    expect(gainExperience(1, 0, 4)).toEqual({ level: 1, experience: 4, levelsGained: 0 });
  });

  it('levels up when the bar is full and keeps the extra experience', () => {
    expect(gainExperience(1, 4, 3)).toEqual({ level: 2, experience: 2, levelsGained: 1 });
  });

  it('levels up more than once when the experience is large', () => {
    const needed = experienceNeededAt(1) + experienceNeededAt(2);
    expect(gainExperience(1, 0, needed + 1)).toEqual({ level: 3, experience: 1, levelsGained: 2 });
  });
});
