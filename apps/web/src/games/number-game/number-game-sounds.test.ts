import { describe, expect, it } from 'vitest';
import { CHEER_SOUND } from '../../audio/clip-sounds.js';
import { NUMBER_GAME_SOUNDS } from './number-game-sounds.js';

describe('NUMBER_GAME_SOUNDS', () => {
  it.each(['stageClear'] as const)('plays a random cheer over the bells for %s', (soundName) => {
    const sound = NUMBER_GAME_SOUNDS[soundName];
    expect(sound.kind === 'layered' && sound.layers.includes(CHEER_SOUND)).toBe(true);
    expect(sound.kind === 'layered' && sound.layers.some((layer) => layer.kind === 'tones')).toBe(
      true,
    );
  });
});
