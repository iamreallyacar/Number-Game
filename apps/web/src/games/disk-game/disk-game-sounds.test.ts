import { describe, expect, it } from 'vitest';
import { CHEER_SOUND } from '../../audio/clip-sounds.js';
import { DISK_GAME_SOUNDS } from './disk-game-sounds.js';

describe('DISK_GAME_SOUNDS', () => {
  it.each(['stageClear', 'perfectStageClear'] as const)(
    'plays a random cheer over the bells for %s',
    (soundName) => {
      const sound = DISK_GAME_SOUNDS[soundName];
      expect(sound.kind === 'layered' && sound.layers.includes(CHEER_SOUND)).toBe(true);
      expect(sound.kind === 'layered' && sound.layers.some((layer) => layer.kind === 'tones')).toBe(
        true,
      );
    },
  );
});
