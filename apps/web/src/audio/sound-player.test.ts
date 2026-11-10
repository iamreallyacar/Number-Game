import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../test-support/memory-storage.js';
import { SoundPlayer } from './sound-player.js';

function refuseAudioContext(): AudioContext {
  throw new Error('A muted player must not start sound.');
}

describe('SoundPlayer', () => {
  it('starts with sound on', () => {
    expect(new SoundPlayer(new MemoryStorage(), refuseAudioContext).muted).toBe(false);
  });

  it('remembers the mute choice for the next visit', () => {
    const storage = new MemoryStorage();
    new SoundPlayer(storage, refuseAudioContext).setMuted(true);
    expect(new SoundPlayer(storage, refuseAudioContext).muted).toBe(true);
  });

  it('remembers turning sound back on', () => {
    const storage = new MemoryStorage();
    const soundPlayer = new SoundPlayer(storage, refuseAudioContext);
    soundPlayer.setMuted(true);
    soundPlayer.setMuted(false);
    expect(new SoundPlayer(storage, refuseAudioContext).muted).toBe(false);
  });

  it('does not start sound while muted', () => {
    const soundPlayer = new SoundPlayer(new MemoryStorage(), refuseAudioContext);
    soundPlayer.setMuted(true);
    expect(() => {
      soundPlayer.play([
        { frequencyHz: 440, waveform: 'sine', peakGain: 0.1, startSeconds: 0, fadeSeconds: 0.1 },
      ]);
    }).not.toThrow();
  });
});
