import { createRun } from '@local/survivor-game';
import { describe, expect, it } from 'vitest';
import { describeRunStatus } from './run-status.js';

describe('describeRunStatus', () => {
  const run = createRun({ playerIds: ['Sam'], seed: 1 });

  it('shows a full health bar, an empty experience bar, and level 1 at the start', () => {
    expect(describeRunStatus(run)).toEqual({
      healthShare: 1,
      healthText: '100 / 100',
      experienceShare: 0,
      levelText: '1',
      scoreText: '0',
      timeText: '0:00',
    });
  });

  it('shows the bars as shares of their full size', () => {
    const status = describeRunStatus({
      ...run,
      teamHealth: 25,
      teamExperience: 3,
      teamLevel: 2,
      score: 120,
      stepCount: 30 * 65,
    });
    expect(status.healthShare).toBe(0.25);
    // Level 2 needs 8 experience (5 for the first level, 3 more for the next).
    expect(status.experienceShare).toBe(3 / 8);
    expect(status.scoreText).toBe('120');
    expect(status.timeText).toBe('1:05');
  });

  it('keeps the health bar inside its box when health is below zero', () => {
    expect(describeRunStatus({ ...run, teamHealth: -5 }).healthShare).toBe(0);
  });
});
