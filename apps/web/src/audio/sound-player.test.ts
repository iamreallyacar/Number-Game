import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '../test-support/memory-storage.js';
import {
  clipSound,
  layeredSound,
  oneOfSound,
  SoundPlayer,
  spokenClipSound,
  toneSound,
  type SoundPlayerEnvironment,
} from './sound-player.js';

interface FakeSource {
  buffer: AudioBuffer | null;
  start: () => void;
  connect: (node: unknown) => unknown;
}

class FakeAudioContext {
  readonly state = 'running';
  readonly currentTime = 0;
  readonly destination = {};
  readonly startedSources: FakeSource[] = [];
  readonly decodedBytes: ArrayBuffer[] = [];

  decodeAudioData(bytes: ArrayBuffer): Promise<AudioBuffer> {
    this.decodedBytes.push(bytes);
    return Promise.resolve({ duration: 0.5 } as AudioBuffer);
  }

  createBufferSource(): FakeSource {
    const source: FakeSource = {
      buffer: null,
      start: () => {
        this.startedSources.push(source);
      },
      connect: (node) => node,
    };
    return source;
  }

  createGain(): { gain: { value: number }; connect: (node: unknown) => unknown } {
    return { gain: { value: 1 }, connect: (node) => node };
  }
}

interface Setup {
  readonly soundPlayer: SoundPlayer;
  readonly audioContext: FakeAudioContext;
  readonly storage: MemoryStorage;
  readonly fetchClipBytes: ReturnType<typeof vi.fn<(url: string) => Promise<ArrayBuffer>>>;
}

function setUp(overrides: Partial<SoundPlayerEnvironment> = {}): Setup {
  const audioContext = new FakeAudioContext();
  const storage = new MemoryStorage();
  const fetchClipBytes = vi.fn<(url: string) => Promise<ArrayBuffer>>(() =>
    Promise.resolve(new ArrayBuffer(8)),
  );
  const soundPlayer = new SoundPlayer({
    storage,
    createAudioContext: () => audioContext as unknown as AudioContext,
    fetchClipBytes,
    chooseOptionIndex: () => 0,
    ...overrides,
  });
  return { soundPlayer, audioContext, storage, fetchClipBytes };
}

function refuseAudioContext(): AudioContext {
  throw new Error('A muted player must not start sound.');
}

async function letPromisesSettle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SoundPlayer mute choice', () => {
  it('starts with sound on', () => {
    expect(setUp().soundPlayer.muted).toBe(false);
  });

  it('remembers the mute choice for the next visit', () => {
    const { soundPlayer, storage } = setUp();
    soundPlayer.setMuted(true);
    expect(setUp({ storage }).soundPlayer.muted).toBe(true);
  });

  it('remembers turning sound back on', () => {
    const { soundPlayer, storage } = setUp();
    soundPlayer.setMuted(true);
    soundPlayer.setMuted(false);
    expect(setUp({ storage }).soundPlayer.muted).toBe(false);
  });

  it('does not start sound while muted', async () => {
    const { soundPlayer, fetchClipBytes } = setUp({ createAudioContext: refuseAudioContext });
    soundPlayer.setMuted(true);
    expect(() => {
      soundPlayer.play(clipSound('/clip.mp3'));
      soundPlayer.play(
        toneSound([
          { frequencyHz: 440, waveform: 'sine', peakGain: 0.1, startSeconds: 0, fadeSeconds: 0.1 },
        ]),
      );
    }).not.toThrow();
    await letPromisesSettle();
    expect(fetchClipBytes).not.toHaveBeenCalled();
  });
});

describe('SoundPlayer clips', () => {
  it('plays a clip when sound is on', async () => {
    const { soundPlayer, audioContext } = setUp();
    soundPlayer.play(clipSound('/clip.mp3'));
    await letPromisesSettle();
    expect(audioContext.startedSources).toHaveLength(1);
  });

  it('fetches and decodes a clip once however often it plays', async () => {
    const { soundPlayer, audioContext, fetchClipBytes } = setUp();
    soundPlayer.play(clipSound('/clip.mp3'));
    soundPlayer.play(clipSound('/clip.mp3'));
    await letPromisesSettle();
    soundPlayer.play(clipSound('/clip.mp3'));
    await letPromisesSettle();
    expect(fetchClipBytes).toHaveBeenCalledTimes(1);
    expect(audioContext.decodedBytes).toHaveLength(1);
    expect(audioContext.startedSources).toHaveLength(3);
  });

  it('does not play a clip that finishes loading after the player was muted', async () => {
    const { soundPlayer, audioContext } = setUp();
    soundPlayer.play(clipSound('/clip.mp3'));
    soundPlayer.setMuted(true);
    await letPromisesSettle();
    expect(audioContext.startedSources).toHaveLength(0);
  });

  it('reports a clip that fails to load and keeps working', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { soundPlayer, audioContext } = setUp({
      fetchClipBytes: (url) =>
        url === '/broken.mp3'
          ? Promise.reject(new Error('Not found'))
          : Promise.resolve(new ArrayBuffer(8)),
    });
    soundPlayer.play(clipSound('/broken.mp3'));
    soundPlayer.play(clipSound('/clip.mp3'));
    await letPromisesSettle();
    expect(errorLog).toHaveBeenCalledWith(
      'Could not load the sound clip /broken.mp3.',
      expect.any(Error),
    );
    expect(audioContext.startedSources).toHaveLength(1);
  });

  it('tries a clip again on the next play after its first fetch failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { soundPlayer, audioContext, fetchClipBytes } = setUp();
    fetchClipBytes.mockRejectedValueOnce(new Error('Offline'));
    soundPlayer.play(clipSound('/clip.mp3'));
    await letPromisesSettle();
    expect(audioContext.startedSources).toHaveLength(0);
    soundPlayer.play(clipSound('/clip.mp3'));
    await letPromisesSettle();
    expect(fetchClipBytes).toHaveBeenCalledTimes(2);
    expect(audioContext.startedSources).toHaveLength(1);
  });

  it('plays a clip on its first play after its preload failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { soundPlayer, audioContext, fetchClipBytes } = setUp();
    fetchClipBytes.mockRejectedValueOnce(new Error('Offline'));
    soundPlayer.preload([clipSound('/clip.mp3')]);
    await letPromisesSettle();
    soundPlayer.play(clipSound('/clip.mp3'));
    await letPromisesSettle();
    expect(fetchClipBytes).toHaveBeenCalledTimes(2);
    expect(audioContext.startedSources).toHaveLength(1);
  });

  it('reports a clip that cannot be decoded', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { soundPlayer, audioContext } = setUp();
    audioContext.decodeAudioData = () => Promise.reject(new Error('Bad audio'));
    soundPlayer.play(clipSound('/clip.mp3'));
    await letPromisesSettle();
    expect(errorLog).toHaveBeenCalledTimes(1);
    expect(audioContext.startedSources).toHaveLength(0);
  });

  it('preloads clips without starting the audio context and fetches each once', async () => {
    const { soundPlayer, fetchClipBytes } = setUp({ createAudioContext: refuseAudioContext });
    const shout = clipSound('/shout.mp3');
    soundPlayer.preload([shout, oneOfSound([clipSound('/a.mp3'), shout]), layeredSound([shout])]);
    await letPromisesSettle();
    expect(fetchClipBytes.mock.calls.map(([url]) => url)).toEqual(['/shout.mp3', '/a.mp3']);
  });

  it('reports a clip that fails to preload', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { soundPlayer } = setUp({ fetchClipBytes: () => Promise.reject(new Error('Offline')) });
    soundPlayer.preload([clipSound('/clip.mp3')]);
    await letPromisesSettle();
    expect(errorLog).toHaveBeenCalledWith(
      'Could not preload the sound clip /clip.mp3.',
      expect.any(Error),
    );
  });
});

describe('SoundPlayer combined sounds', () => {
  it('plays the option picked for a one-of sound', async () => {
    const { soundPlayer, fetchClipBytes } = setUp({ chooseOptionIndex: () => 1 });
    soundPlayer.play(oneOfSound([clipSound('/first.mp3'), clipSound('/second.mp3')]));
    await letPromisesSettle();
    expect(fetchClipBytes.mock.calls.map(([url]) => url)).toEqual(['/second.mp3']);
  });

  it('plays every layer of a layered sound', async () => {
    const { soundPlayer, audioContext } = setUp();
    soundPlayer.play(layeredSound([clipSound('/a.mp3'), clipSound('/b.mp3')]));
    await letPromisesSettle();
    expect(audioContext.startedSources).toHaveLength(2);
  });

  it('returns the spoken words of the option picked inside a layered sound', () => {
    const { soundPlayer } = setUp({ chooseOptionIndex: () => 1 });
    const cheer = oneOfSound([
      spokenClipSound('/first.mp3', '發'),
      spokenClipSound('/second.mp3', '萬歲'),
    ]);
    expect(soundPlayer.play(layeredSound([clipSound('/knock.mp3'), cheer]))).toBe('萬歲');
  });

  it('returns no spoken words for a sound without words or while muted', () => {
    const { soundPlayer } = setUp();
    expect(soundPlayer.play(clipSound('/knock.mp3'))).toBeNull();
    soundPlayer.setMuted(true);
    expect(soundPlayer.play(spokenClipSound('/first.mp3', '發'))).toBeNull();
  });

  it('refuses a one-of sound without options', () => {
    expect(() => oneOfSound([])).toThrow('at least one option');
  });
});
