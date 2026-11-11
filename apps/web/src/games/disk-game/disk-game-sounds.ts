import type { SoundCue, Tone } from '../../audio/sound-player.js';

// Notes from the D major chord, so every sound fits with the others when they overlap. A chord of
// its own gives this game a different voice from the Number Game and the Block Game.
const NOTE_D3_HZ = 146.83;
const NOTE_A3_HZ = 220.0;
const NOTE_D4_HZ = 293.66;
const NOTE_FSHARP4_HZ = 369.99;
const NOTE_A4_HZ = 440.0;
const NOTE_D5_HZ = 587.33;
const NOTE_FSHARP5_HZ = 739.99;
const NOTE_A5_HZ = 880.0;
const NOTE_D6_HZ = 1174.66;

const STAGE_CLEAR_NOTE_GAP_SECONDS = 0.09;

function softTone(frequencyHz: number, startSeconds: number, fadeSeconds: number): Tone {
  return { frequencyHz, waveform: 'sine', peakGain: 0.16, startSeconds, fadeSeconds };
}

function risingRun(frequenciesHz: readonly number[]): SoundCue {
  return frequenciesHz.map((frequencyHz, noteIndex) =>
    softTone(frequencyHz, noteIndex * STAGE_CLEAR_NOTE_GAP_SECONDS, 0.6),
  );
}

export type DiskGameSoundName =
  | 'pickUp'
  | 'drop'
  | 'refusedDrop'
  | 'undo'
  | 'hint'
  | 'stageClear'
  | 'perfectStageClear'
  | 'gameOver';

/** The Disk Game sound for each event (DK-22). */
export const DISK_GAME_SOUNDS: Readonly<Record<DiskGameSoundName, SoundCue>> = {
  pickUp: [softTone(NOTE_A4_HZ, 0, 0.07)],
  // A low knock, like a wooden disk landing on a peg.
  drop: [
    {
      frequencyHz: NOTE_D4_HZ,
      waveform: 'triangle',
      peakGain: 0.18,
      startSeconds: 0,
      fadeSeconds: 0.12,
    },
    softTone(NOTE_D3_HZ, 0, 0.18),
  ],
  refusedDrop: [
    { frequencyHz: 196, waveform: 'triangle', peakGain: 0.12, startSeconds: 0, fadeSeconds: 0.12 },
    { frequencyHz: 147, waveform: 'triangle', peakGain: 0.12, startSeconds: 0.1, fadeSeconds: 0.2 },
  ],
  // The drop played backwards in pitch: down, then up.
  undo: [softTone(NOTE_D4_HZ, 0, 0.1), softTone(NOTE_A3_HZ, 0.07, 0.14)],
  hint: [softTone(NOTE_FSHARP5_HZ, 0, 0.25), softTone(NOTE_A5_HZ, 0.1, 0.35)],
  stageClear: risingRun([NOTE_D4_HZ, NOTE_FSHARP4_HZ, NOTE_A4_HZ, NOTE_D5_HZ]),
  // A perfect stage rings two notes higher.
  perfectStageClear: risingRun([
    NOTE_D4_HZ,
    NOTE_FSHARP4_HZ,
    NOTE_A4_HZ,
    NOTE_D5_HZ,
    NOTE_FSHARP5_HZ,
    NOTE_D6_HZ,
  ]),
  gameOver: [
    softTone(NOTE_A4_HZ, 0, 0.5),
    softTone(NOTE_FSHARP4_HZ, 0.18, 0.5),
    softTone(NOTE_D4_HZ, 0.36, 0.8),
  ],
};
