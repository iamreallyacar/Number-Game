import { bellTones } from '../../audio/bell-tones.js';
import { layeredSound, toneSound, type Sound } from '../../audio/sound-player.js';
import { CHEER_SOUND, GAME_OVER_SOUND, WRONG_BUZZER_SOUND } from '../../audio/clip-sounds.js';

// Notes from the C major chord, so every sound fits with the others when they overlap.
const NOTE_C4_HZ = 261.63;
const NOTE_G4_HZ = 392.0;
const NOTE_C5_HZ = 523.25;
const NOTE_E5_HZ = 659.25;
const NOTE_G5_HZ = 783.99;
const NOTE_C6_HZ = 1046.5;

const BELL_RING_SECONDS = 0.9;

export type NumberGameSoundName =
  'select' | 'matchShout' | 'wrongMatch' | 'addNumbers' | 'hint' | 'stageClear' | 'gameOver';

/** The Number Game sound for each event (NG-31). */
export const NUMBER_GAME_SOUNDS: Readonly<Record<NumberGameSoundName, Sound>> = {
  select: toneSound([
    { frequencyHz: 440, waveform: 'sine', peakGain: 0.15, startSeconds: 0, fadeSeconds: 0.07 },
  ]),
  matchShout: CHEER_SOUND,
  wrongMatch: WRONG_BUZZER_SOUND,
  addNumbers: toneSound([
    {
      frequencyHz: NOTE_C4_HZ,
      waveform: 'sine',
      peakGain: 0.15,
      startSeconds: 0,
      fadeSeconds: 0.15,
    },
    {
      frequencyHz: NOTE_G4_HZ,
      waveform: 'sine',
      peakGain: 0.15,
      startSeconds: 0.07,
      fadeSeconds: 0.2,
    },
  ]),
  hint: toneSound([
    { frequencyHz: NOTE_E5_HZ, waveform: 'sine', peakGain: 0.1, startSeconds: 0, fadeSeconds: 0.3 },
    {
      frequencyHz: NOTE_G5_HZ,
      waveform: 'sine',
      peakGain: 0.1,
      startSeconds: 0.1,
      fadeSeconds: 0.35,
    },
  ]),
  stageClear: layeredSound([
    toneSound([
      ...bellTones(NOTE_C5_HZ, 0, 0.22, BELL_RING_SECONDS),
      ...bellTones(NOTE_E5_HZ, 0.1, 0.22, BELL_RING_SECONDS),
      ...bellTones(NOTE_G5_HZ, 0.2, 0.22, BELL_RING_SECONDS),
      ...bellTones(NOTE_C6_HZ, 0.3, 0.25, BELL_RING_SECONDS),
    ]),
    CHEER_SOUND,
  ]),
  gameOver: GAME_OVER_SOUND,
};

/** Every sound the game can play, for the play screen to preload. */
export const NUMBER_GAME_PRELOADED_SOUNDS: readonly Sound[] = Object.values(NUMBER_GAME_SOUNDS);
