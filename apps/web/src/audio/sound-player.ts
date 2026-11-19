/** One plain tone inside a sound cue. Tones played together make richer sounds, such as a bell. */
export interface Tone {
  readonly frequencyHz: number;
  readonly waveform: OscillatorType;
  /** Loudness right after the tone starts, from 0 to 1. */
  readonly peakGain: number;
  /** When the tone starts, counted from the moment the cue is played. */
  readonly startSeconds: number;
  /** How long the tone takes to fade away after it starts. */
  readonly fadeSeconds: number;
}

/** A sound built from tones, such as the ring when a pair is cleared. */
export interface ToneSound {
  readonly kind: 'tones';
  readonly tones: readonly Tone[];
}

/** A recorded audio file. The file is fetched and decoded once, then played from memory. */
export interface ClipSound {
  readonly kind: 'clip';
  readonly url: string;
  /** Loudness of the clip from 0 up, where 1 plays the file as it is. */
  readonly gain: number;
  /** The words a voice says in the clip, written as they are spoken, or null for a clip without words. */
  readonly spokenWords: string | null;
}

/** One of several sounds, picked at random each time it plays, so a frequent sound stays fresh. */
export interface OneOfSound {
  readonly kind: 'one-of';
  readonly options: readonly Sound[];
}

/** Sounds that start together, such as a shout over a run of bells. */
export interface LayeredSound {
  readonly kind: 'layered';
  readonly layers: readonly Sound[];
}

export type Sound = ToneSound | ClipSound | OneOfSound | LayeredSound;

export function toneSound(tones: readonly Tone[]): ToneSound {
  return { kind: 'tones', tones };
}

export function clipSound(url: string, gain = 1): ClipSound {
  return { kind: 'clip', url, gain, spokenWords: null };
}

export function spokenClipSound(url: string, spokenWords: string): ClipSound {
  return { kind: 'clip', url, gain: 1, spokenWords };
}

export function oneOfSound(options: readonly Sound[]): OneOfSound {
  if (options.length === 0) {
    throw new Error('A one-of sound needs at least one option.');
  }
  return { kind: 'one-of', options };
}

export function layeredSound(layers: readonly Sound[]): LayeredSound {
  return { kind: 'layered', layers };
}

/** What a sound player needs from the browser, so tests can replace it. */
export interface SoundPlayerEnvironment {
  readonly storage: Storage;
  readonly createAudioContext: () => AudioContext;
  readonly fetchClipBytes: (url: string) => Promise<ArrayBuffer>;
  /** Returns a whole number from 0 up to, but not including, optionCount. */
  readonly chooseOptionIndex: (optionCount: number) => number;
}

const SOUND_MUTED_STORAGE_KEY = 'game-dashboard.sound-muted';
// A very fast start makes a click, so each tone swells in over a short moment instead.
const TONE_ATTACK_SECONDS = 0.015;
// A fade that shrinks by a fixed share each moment never reaches 0, so it ends at this
// gain, which is too quiet to hear.
const SILENT_GAIN = 0.0001;

/**
 * Plays tones made in the browser and recorded clips (PL-18). The mute choice is kept in local
 * storage, so it stays on this device only (PL-19).
 */
export class SoundPlayer {
  readonly #environment: SoundPlayerEnvironment;
  readonly #clipBytes = new Map<string, Promise<ArrayBuffer>>();
  readonly #clipBuffers = new Map<string, Promise<AudioBuffer | null>>();
  #audioContext: AudioContext | null = null;
  #muted: boolean;

  constructor(environment: SoundPlayerEnvironment) {
    this.#environment = environment;
    this.#muted = environment.storage.getItem(SOUND_MUTED_STORAGE_KEY) === 'true';
  }

  get muted(): boolean {
    return this.#muted;
  }

  setMuted(muted: boolean): void {
    this.#muted = muted;
    this.#environment.storage.setItem(SOUND_MUTED_STORAGE_KEY, String(muted));
  }

  /**
   * Starts fetching every clip inside the sounds, so the first play is not silent. Fetching needs
   * no audio context, so it is safe before the first tap. Decoding waits for the first play.
   */
  preload(sounds: readonly Sound[]): void {
    for (const url of collectClipUrls(sounds)) {
      this.#fetchClipBytes(url).catch((error: unknown) => {
        console.error(`Could not preload the sound clip ${url}.`, error);
      });
    }
  }

  /**
   * Returns the words spoken in the clips that were picked to play, or null when the sound has no
   * spoken words or sound is muted, so a screen can show the words it is playing.
   */
  play(sound: Sound): string | null {
    if (this.#muted) {
      return null;
    }
    // The audio context is made on the first sound, which always comes from a tap. Browsers only
    // allow sound to start after the player has interacted with the page.
    this.#audioContext ??= this.#environment.createAudioContext();
    const audioContext = this.#audioContext;
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch((error: unknown) => {
        console.error('The browser refused to start sound.', error);
      });
    }
    const spokenWords = this.#playOnContext(audioContext, sound);
    return spokenWords.length > 0 ? spokenWords.join(' ') : null;
  }

  #playOnContext(audioContext: AudioContext, sound: Sound): readonly string[] {
    switch (sound.kind) {
      case 'tones': {
        const soundStartSeconds = audioContext.currentTime;
        for (const tone of sound.tones) {
          playTone(audioContext, tone, soundStartSeconds);
        }
        return [];
      }
      case 'clip':
        this.#playClip(audioContext, sound);
        return sound.spokenWords === null ? [] : [sound.spokenWords];
      case 'one-of': {
        const optionIndex = this.#environment.chooseOptionIndex(sound.options.length);
        const option = sound.options[optionIndex];
        if (option === undefined) {
          throw new Error(`No sound option at index ${String(optionIndex)}.`);
        }
        return this.#playOnContext(audioContext, option);
      }
      case 'layered':
        return sound.layers.flatMap((layer) => this.#playOnContext(audioContext, layer));
    }
  }

  #playClip(audioContext: AudioContext, clip: ClipSound): void {
    this.#decodeClip(audioContext, clip.url)
      .then((buffer) => {
        // The player may have been muted while the clip was still loading.
        if (buffer === null || this.#muted) {
          return;
        }
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const volume = audioContext.createGain();
        volume.gain.value = clip.gain;
        source.connect(volume).connect(audioContext.destination);
        source.start();
      })
      .catch((error: unknown) => {
        console.error(`Could not play the sound clip ${clip.url}.`, error);
      });
  }

  /** Resolves to null when the clip cannot be loaded; the reason has been logged once. */
  #decodeClip(audioContext: AudioContext, url: string): Promise<AudioBuffer | null> {
    let buffer = this.#clipBuffers.get(url);
    if (buffer === undefined) {
      buffer = this.#fetchClipBytes(url)
        .then((bytes) => audioContext.decodeAudioData(bytes))
        .catch((error: unknown) => {
          console.error(`Could not load the sound clip ${url}.`, error);
          // Forgetting the failure lets the next play retry once the network is back.
          this.#clipBytes.delete(url);
          this.#clipBuffers.delete(url);
          return null;
        });
      this.#clipBuffers.set(url, buffer);
    }
    return buffer;
  }

  #fetchClipBytes(url: string): Promise<ArrayBuffer> {
    let bytes = this.#clipBytes.get(url);
    if (bytes === undefined) {
      bytes = this.#environment.fetchClipBytes(url).catch((error: unknown) => {
        // A failed preload must not stay cached, or the first play after it would be silent too.
        this.#clipBytes.delete(url);
        throw error;
      });
      this.#clipBytes.set(url, bytes);
    }
    return bytes;
  }
}

function collectClipUrls(sounds: readonly Sound[]): Set<string> {
  const urls = new Set<string>();
  for (const sound of sounds) {
    switch (sound.kind) {
      case 'tones':
        break;
      case 'clip':
        urls.add(sound.url);
        break;
      case 'one-of':
        collectClipUrls(sound.options).forEach((url) => urls.add(url));
        break;
      case 'layered':
        collectClipUrls(sound.layers).forEach((url) => urls.add(url));
        break;
    }
  }
  return urls;
}

function playTone(audioContext: AudioContext, tone: Tone, soundStartSeconds: number): void {
  const startSeconds = soundStartSeconds + tone.startSeconds;
  const endSeconds = startSeconds + tone.fadeSeconds;
  const oscillator = new OscillatorNode(audioContext, {
    type: tone.waveform,
    frequency: tone.frequencyHz,
  });
  const envelope = new GainNode(audioContext, { gain: 0 });
  envelope.gain.setValueAtTime(0, startSeconds);
  envelope.gain.linearRampToValueAtTime(tone.peakGain, startSeconds + TONE_ATTACK_SECONDS);
  envelope.gain.exponentialRampToValueAtTime(SILENT_GAIN, endSeconds);
  oscillator.connect(envelope).connect(audioContext.destination);
  oscillator.start(startSeconds);
  oscillator.stop(endSeconds);
}

async function fetchClipBytesFromNetwork(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetching ${url} failed with status ${String(response.status)}.`);
  }
  return response.arrayBuffer();
}

let sharedSoundPlayer: SoundPlayer | null = null;

/** The one sound player of the page, shared by the mute button and every game. */
export function getSoundPlayer(): SoundPlayer {
  sharedSoundPlayer ??= new SoundPlayer({
    storage: window.localStorage,
    createAudioContext: () => new AudioContext(),
    fetchClipBytes: fetchClipBytesFromNetwork,
    chooseOptionIndex: (optionCount) => Math.floor(Math.random() * optionCount),
  });
  return sharedSoundPlayer;
}
