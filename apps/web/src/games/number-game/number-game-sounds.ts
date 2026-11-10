import type { SoundCue, Tone } from '../../audio/sound-player.js';

// Notes from the C major chord, so every sound fits with the others when they overlap.
const NOTE_C4_HZ = 261.63;
const NOTE_G4_HZ = 392.0;
const NOTE_C5_HZ = 523.25;
const NOTE_E5_HZ = 659.25;
const NOTE_G5_HZ = 783.99;
const NOTE_C6_HZ = 1046.5;

// A struck bell rings with an extra tone at about 2.76 times its main note. A little of it makes a
// plain tone sound like a bell instead of a beep; too much makes it sharp on the ears.
const BELL_OVERTONE_RATIO = 2.76;
const BELL_OVERTONE_GAIN_SHARE = 0.1;

function bell(frequencyHz: number, startSeconds: number, peakGain: number): Tone[] {
  return [
    { frequencyHz, waveform: 'sine', peakGain, startSeconds, fadeSeconds: 0.9 },
    {
      frequencyHz: frequencyHz * BELL_OVERTONE_RATIO,
      waveform: 'sine',
      peakGain: peakGain * BELL_OVERTONE_GAIN_SHARE,
      startSeconds,
      fadeSeconds: 0.3,
    },
  ];
}

export type NumberGameSoundName =
  'select' | 'matchRing' | 'rowRemoved' | 'wrongMatch' | 'addNumbers' | 'hint' | 'stageClear';

/** The Number Game sound for each event (NG-31). */
export const NUMBER_GAME_SOUNDS: Readonly<Record<NumberGameSoundName, SoundCue>> = {
  select: [
    { frequencyHz: 440, waveform: 'sine', peakGain: 0.15, startSeconds: 0, fadeSeconds: 0.07 },
  ],
  matchRing: bell(NOTE_C5_HZ, 0, 0.25),
  // Played on top of the match ring, a little later, so a removed row rings twice.
  rowRemoved: bell(NOTE_G5_HZ, 0.08, 0.2),
  wrongMatch: [
    { frequencyHz: 196, waveform: 'triangle', peakGain: 0.12, startSeconds: 0, fadeSeconds: 0.12 },
    { frequencyHz: 147, waveform: 'triangle', peakGain: 0.12, startSeconds: 0.1, fadeSeconds: 0.2 },
  ],
  addNumbers: [
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
  ],
  hint: [
    { frequencyHz: NOTE_E5_HZ, waveform: 'sine', peakGain: 0.1, startSeconds: 0, fadeSeconds: 0.3 },
    {
      frequencyHz: NOTE_G5_HZ,
      waveform: 'sine',
      peakGain: 0.1,
      startSeconds: 0.1,
      fadeSeconds: 0.35,
    },
  ],
  stageClear: [
    ...bell(NOTE_C5_HZ, 0, 0.22),
    ...bell(NOTE_E5_HZ, 0.1, 0.22),
    ...bell(NOTE_G5_HZ, 0.2, 0.22),
    ...bell(NOTE_C6_HZ, 0.3, 0.25),
  ],
};
