import { layeredSound, toneSound, type Sound, type Tone } from '../../audio/sound-player.js';
import { CHEER_SOUND, GAME_OVER_SOUND, WOOD_KNOCK_SOUND } from '../../audio/clip-sounds.js';

// Notes from the F major chord, so every sound fits with the others when they overlap. A different
// chord from the Number Game gives this game a voice of its own.
const NOTE_A4_HZ = 440.0;
const NOTE_C5_HZ = 523.25;
const NOTE_F5_HZ = 698.46;
const NOTE_A5_HZ = 880.0;
const NOTE_C6_HZ = 1046.5;
const NOTE_F6_HZ = 1396.91;

// The line clear rises through these notes. More lines, or a longer streak, play more of them.
const LINE_CLEAR_NOTES_HZ = [NOTE_C5_HZ, NOTE_F5_HZ, NOTE_A5_HZ, NOTE_C6_HZ, NOTE_F6_HZ] as const;
const LINE_CLEAR_NOTE_GAP_SECONDS = 0.07;

// A struck bell rings with an extra tone at about 2.76 times its main note. A little of it makes a
// plain tone sound like a bell instead of a beep; too much makes it sharp on the ears.
const BELL_OVERTONE_RATIO = 2.76;
const BELL_OVERTONE_GAIN_SHARE = 0.1;

function bell(frequencyHz: number, startSeconds: number, peakGain: number): Tone[] {
  return [
    { frequencyHz, waveform: 'sine', peakGain, startSeconds, fadeSeconds: 0.8 },
    {
      frequencyHz: frequencyHz * BELL_OVERTONE_RATIO,
      waveform: 'sine',
      peakGain: peakGain * BELL_OVERTONE_GAIN_SHARE,
      startSeconds,
      fadeSeconds: 0.25,
    },
  ];
}

export type BlockGameSoundName = 'pickUp' | 'place' | 'invalidDrop' | 'gameOver';

/** The Block Game sound for each event that always sounds the same (BG-18). */
export const BLOCK_GAME_SOUNDS: Readonly<Record<BlockGameSoundName, Sound>> = {
  pickUp: toneSound([
    {
      frequencyHz: NOTE_A4_HZ,
      waveform: 'sine',
      peakGain: 0.12,
      startSeconds: 0,
      fadeSeconds: 0.06,
    },
  ]),
  place: WOOD_KNOCK_SOUND,
  invalidDrop: toneSound([
    { frequencyHz: 196, waveform: 'triangle', peakGain: 0.12, startSeconds: 0, fadeSeconds: 0.12 },
    { frequencyHz: 147, waveform: 'triangle', peakGain: 0.12, startSeconds: 0.1, fadeSeconds: 0.2 },
  ]),
  gameOver: GAME_OVER_SOUND,
};

/**
 * The line clear sound: a random cheer over a rising run of bells, one more for each extra line and for a
 * streak of 2 or more, so bigger clears sound bigger (BG-17, BG-18).
 */
export function lineClearSound(clearedLineCount: number, streak: number): Sound {
  const streakBonus = streak >= 2 ? 1 : 0;
  const noteCount = Math.min(clearedLineCount + streakBonus, LINE_CLEAR_NOTES_HZ.length);
  const bells = LINE_CLEAR_NOTES_HZ.slice(0, Math.max(noteCount, 1)).flatMap(
    (frequencyHz, noteIndex) => bell(frequencyHz, noteIndex * LINE_CLEAR_NOTE_GAP_SECONDS, 0.2),
  );
  return layeredSound([toneSound(bells), CHEER_SOUND]);
}

/** Every sound the game can play, for the play screen to preload. */
export const BLOCK_GAME_PRELOADED_SOUNDS: readonly Sound[] = [
  ...Object.values(BLOCK_GAME_SOUNDS),
  lineClearSound(1, 1),
];
