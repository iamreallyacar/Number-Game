import type { SoundCue, Tone } from '../../audio/sound-player.js';

// Notes from the C major chord, so every sound fits with the others when they overlap.
const NOTE_C5_HZ = 523.25;
const NOTE_G5_HZ = 783.99;
const NOTE_C6_HZ = 1046.5;
const NOTE_E6_HZ = 1318.51;
const NOTE_G6_HZ = 1567.98;
const NOTE_C7_HZ = 2093.0;

// A struck bell rings with a strong extra tone at about 2.76 times its main note. Adding it makes
// a plain tone sound like a bell instead of a beep.
const BELL_OVERTONE_RATIO = 2.76;

function bell(frequencyHz: number, startSeconds: number, peakGain: number): Tone[] {
  return [
    { frequencyHz, waveform: 'sine', peakGain, startSeconds, fadeSeconds: 0.9 },
    {
      frequencyHz: frequencyHz * BELL_OVERTONE_RATIO,
      waveform: 'sine',
      peakGain: peakGain * 0.3,
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
    { frequencyHz: 660, waveform: 'triangle', peakGain: 0.12, startSeconds: 0, fadeSeconds: 0.07 },
  ],
  matchRing: bell(NOTE_C6_HZ, 0, 0.25),
  // Played on top of the match ring, a little later, so a removed row rings twice.
  rowRemoved: bell(NOTE_G6_HZ, 0.08, 0.2),
  wrongMatch: [
    { frequencyHz: 196, waveform: 'square', peakGain: 0.05, startSeconds: 0, fadeSeconds: 0.12 },
    { frequencyHz: 147, waveform: 'square', peakGain: 0.05, startSeconds: 0.1, fadeSeconds: 0.2 },
  ],
  addNumbers: [
    {
      frequencyHz: NOTE_C5_HZ,
      waveform: 'triangle',
      peakGain: 0.15,
      startSeconds: 0,
      fadeSeconds: 0.15,
    },
    {
      frequencyHz: NOTE_G5_HZ,
      waveform: 'triangle',
      peakGain: 0.15,
      startSeconds: 0.07,
      fadeSeconds: 0.2,
    },
  ],
  hint: [
    { frequencyHz: NOTE_E6_HZ, waveform: 'sine', peakGain: 0.1, startSeconds: 0, fadeSeconds: 0.3 },
    {
      frequencyHz: NOTE_G6_HZ,
      waveform: 'sine',
      peakGain: 0.1,
      startSeconds: 0.1,
      fadeSeconds: 0.35,
    },
  ],
  stageClear: [
    ...bell(NOTE_C6_HZ, 0, 0.22),
    ...bell(NOTE_E6_HZ, 0.1, 0.22),
    ...bell(NOTE_G6_HZ, 0.2, 0.22),
    ...bell(NOTE_C7_HZ, 0.3, 0.25),
  ],
};
