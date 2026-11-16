import type { Tone } from './sound-player.js';

// A struck bell rings with an extra tone at about 2.76 times its main note. A little of it makes a
// plain tone sound like a bell instead of a beep; too much makes it sharp on the ears.
const BELL_OVERTONE_RATIO = 2.76;
const BELL_OVERTONE_GAIN_SHARE = 0.1;
// The overtone dies away sooner than the main note, as it does on a real bell.
const BELL_OVERTONE_RING_SHARE = 1 / 3;

/** The tones of one bell: its main note and a quiet overtone. */
export function bellTones(
  frequencyHz: number,
  startSeconds: number,
  peakGain: number,
  ringSeconds: number,
): Tone[] {
  return [
    { frequencyHz, waveform: 'sine', peakGain, startSeconds, fadeSeconds: ringSeconds },
    {
      frequencyHz: frequencyHz * BELL_OVERTONE_RATIO,
      waveform: 'sine',
      peakGain: peakGain * BELL_OVERTONE_GAIN_SHARE,
      startSeconds,
      fadeSeconds: ringSeconds * BELL_OVERTONE_RING_SHARE,
    },
  ];
}
