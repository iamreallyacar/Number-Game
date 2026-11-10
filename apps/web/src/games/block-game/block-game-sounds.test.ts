import { describe, expect, it } from 'vitest';
import { lineClearSound } from './block-game-sounds.js';

// Each bell is a main tone plus a quiet overtone.
const TONES_PER_BELL = 2;

describe('lineClearSound', () => {
  it('rings one more bell for each extra line', () => {
    expect(lineClearSound(1, 1)).toHaveLength(1 * TONES_PER_BELL);
    expect(lineClearSound(3, 1)).toHaveLength(3 * TONES_PER_BELL);
  });

  it('rings one more bell during a streak, up to a limit', () => {
    expect(lineClearSound(2, 2)).toHaveLength(3 * TONES_PER_BELL);
    expect(lineClearSound(9, 9)).toHaveLength(5 * TONES_PER_BELL);
  });
});
