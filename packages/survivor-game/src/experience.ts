import { EXPERIENCE_ADDED_PER_LEVEL, FIRST_LEVEL_EXPERIENCE } from './balance.js';

export interface ExperienceGained {
  readonly level: number;
  readonly experience: number;
  readonly levelsGained: number;
}

/** The experience that takes the team from this level to the next. Each level needs more (SB-04). */
export function experienceNeededAt(level: number): number {
  return FIRST_LEVEL_EXPERIENCE + EXPERIENCE_ADDED_PER_LEVEL * (level - 1);
}

/** Adds experience and levels up while the bar is full, keeping the extra experience (SG-35). */
export function gainExperience(
  level: number,
  experience: number,
  gained: number,
): ExperienceGained {
  let currentLevel = level;
  let currentExperience = experience + gained;
  while (currentExperience >= experienceNeededAt(currentLevel)) {
    currentExperience -= experienceNeededAt(currentLevel);
    currentLevel += 1;
  }
  return {
    level: currentLevel,
    experience: currentExperience,
    levelsGained: currentLevel - level,
  };
}
