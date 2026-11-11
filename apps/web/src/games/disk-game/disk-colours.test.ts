import { MAX_DISK_COUNT } from '@local/disk-game';
import { describe, expect, it } from 'vitest';
import { diskColourOf, diskWidthShareOf } from './disk-colours.js';

describe('disk looks', () => {
  it('gives every disk size its own colour (DK-03)', () => {
    const colours = Array.from({ length: MAX_DISK_COUNT }, (_, index) => diskColourOf(index + 1));
    expect(new Set(colours).size).toBe(MAX_DISK_COUNT);
    expect(() => diskColourOf(MAX_DISK_COUNT + 1)).toThrow('no colour');
  });

  it('makes each larger disk wider, up to the full width (DK-03)', () => {
    expect(diskWidthShareOf(1, 5)).toBeCloseTo(0.3);
    expect(diskWidthShareOf(3, 5)).toBeCloseTo(0.65);
    expect(diskWidthShareOf(5, 5)).toBeCloseTo(1);
  });
});
