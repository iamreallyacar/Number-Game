import { describe, expect, it } from 'vitest';
import { CHEER_SOUND } from '../../audio/clip-sounds.js';
import { lineClearSound } from './block-game-sounds.js';

// Each bell is a main tone plus a quiet overtone.
const TONES_PER_BELL = 2;

function bellToneCount(clearedLineCount: number, streak: number): number {
  const sound = lineClearSound(clearedLineCount, streak);
  if (sound.kind !== 'layered') {
    throw new Error('The line clear sound should layer a cheer over the bells.');
  }
  const bells = sound.layers.find((layer) => layer.kind === 'tones');
  if (bells?.kind !== 'tones') {
    throw new Error('The line clear sound should include the bells.');
  }
  return bells.tones.length;
}

describe('lineClearSound', () => {
  it('rings one more bell for each extra line', () => {
    expect(bellToneCount(1, 1)).toBe(1 * TONES_PER_BELL);
    expect(bellToneCount(3, 1)).toBe(3 * TONES_PER_BELL);
  });

  it('rings one more bell during a streak, up to a limit', () => {
    expect(bellToneCount(2, 2)).toBe(3 * TONES_PER_BELL);
    expect(bellToneCount(9, 9)).toBe(5 * TONES_PER_BELL);
  });

  it('plays a random cheer over the bells', () => {
    const sound = lineClearSound(1, 1);
    expect(sound.kind === 'layered' && sound.layers.includes(CHEER_SOUND)).toBe(true);
  });

  it('keeps "wan sui" among the cheers', () => {
    const cheerUrls = CHEER_SOUND.options.map((option) =>
      option.kind === 'clip' ? option.url : '',
    );
    expect(cheerUrls.some((url) => url.includes('wan-sui'))).toBe(true);
  });
});
