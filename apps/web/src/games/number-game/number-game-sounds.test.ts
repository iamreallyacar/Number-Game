import { describe, expect, it } from 'vitest';
import { CHEER_SOUND } from '../../audio/clip-sounds.js';
import { NUMBER_GAME_SOUNDS } from './number-game-sounds.js';

describe('NUMBER_GAME_SOUNDS', () => {
  it('plays a cheer from the shared pool for a cleared pair', () => {
    expect(NUMBER_GAME_SOUNDS.matchShout).toBe(CHEER_SOUND);
  });

  it('says a Mandarin "fan shu" (sweet potato) for a wrong match', () => {
    const sound = NUMBER_GAME_SOUNDS.wrongMatch;
    expect(sound.kind === 'clip' && sound.url).toContain('wrong-match-fanshu-cmn');
  });

  it.each(['stageClear'] as const)('plays a random cheer over the bells for %s', (soundName) => {
    const sound = NUMBER_GAME_SOUNDS[soundName];
    expect(sound.kind === 'layered' && sound.layers.includes(CHEER_SOUND)).toBe(true);
    expect(sound.kind === 'layered' && sound.layers.some((layer) => layer.kind === 'tones')).toBe(
      true,
    );
  });
});
