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

/** A short sound made of tones, such as the ring when a pair is cleared. */
export type SoundCue = readonly Tone[];

const SOUND_MUTED_STORAGE_KEY = 'game-dashboard.sound-muted';
const TONE_ATTACK_SECONDS = 0.005;
// A fade that shrinks by a fixed share each moment never reaches 0, so it ends at this
// gain, which is too quiet to hear.
const SILENT_GAIN = 0.0001;

/**
 * Plays sound cues made in the browser, so the games need no audio files (PL-18). The mute
 * choice is kept in local storage, so it stays on this device only (PL-19).
 */
export class SoundPlayer {
  readonly #storage: Storage;
  readonly #createAudioContext: () => AudioContext;
  #audioContext: AudioContext | null = null;
  #muted: boolean;

  constructor(storage: Storage, createAudioContext: () => AudioContext) {
    this.#storage = storage;
    this.#createAudioContext = createAudioContext;
    this.#muted = storage.getItem(SOUND_MUTED_STORAGE_KEY) === 'true';
  }

  get muted(): boolean {
    return this.#muted;
  }

  setMuted(muted: boolean): void {
    this.#muted = muted;
    this.#storage.setItem(SOUND_MUTED_STORAGE_KEY, String(muted));
  }

  play(cue: SoundCue): void {
    if (this.#muted) {
      return;
    }
    // The audio context is made on the first sound, which always comes from a tap. Browsers only
    // allow sound to start after the player has interacted with the page.
    this.#audioContext ??= this.#createAudioContext();
    const audioContext = this.#audioContext;
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch((error: unknown) => {
        console.error('The browser refused to start sound.', error);
      });
    }
    const cueStartSeconds = audioContext.currentTime;
    for (const tone of cue) {
      playTone(audioContext, tone, cueStartSeconds);
    }
  }
}

function playTone(audioContext: AudioContext, tone: Tone, cueStartSeconds: number): void {
  const startSeconds = cueStartSeconds + tone.startSeconds;
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

let sharedSoundPlayer: SoundPlayer | null = null;

/** The one sound player of the page, shared by the mute button and every game. */
export function getSoundPlayer(): SoundPlayer {
  sharedSoundPlayer ??= new SoundPlayer(window.localStorage, () => new AudioContext());
  return sharedSoundPlayer;
}
