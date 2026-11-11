import { describe, expect, it } from 'vitest';
import { describeDiskGameDetails } from './describe-disk-game-details.js';

describe('describeDiskGameDetails', () => {
  it('labels the stage, starting disk count, and moves left of a save', () => {
    expect(describeDiskGameDetails({ stage: 4, startingDiskCount: 3, movesLeft: 57 })).toEqual([
      { label: 'Stage', value: '4' },
      { label: 'Started with', value: '3 disks' },
      { label: 'Moves left', value: '57' },
    ]);
  });

  it('shows no moves left for a high score', () => {
    expect(describeDiskGameDetails({ stage: 6, startingDiskCount: 5 })).toEqual([
      { label: 'Stage', value: '6' },
      { label: 'Started with', value: '5 disks' },
    ]);
  });

  it('fails loudly on details from a different shape', () => {
    expect(() => describeDiskGameDetails({ stage: 1, startingDiskCount: 9 })).toThrow(
      'startingDiskCount must be one of',
    );
    expect(() => describeDiskGameDetails({ stage: 'two', startingDiskCount: 3 })).toThrow(
      'stage must be a whole number',
    );
  });
});
