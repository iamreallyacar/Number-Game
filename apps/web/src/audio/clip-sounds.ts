import { clipSound, oneOfSound, type ClipSound, type OneOfSound } from './sound-player.js';
import caoUrl from './clips/game-over-cao.mp3';
import aiyoUrl from './clips/game-over-aiyo.mp3';
import zougouUrl from './clips/game-over-zougou.mp3';
import kaoUrl from './clips/game-over-kao.mp3';
import wrongBuzzerUrl from './clips/wrong-buzzer.mp3';
import woodKnockUrl from './clips/wood-knock.mp3';

/** A comic groan in Chinese, picked at random, for when any game ends. */
export const GAME_OVER_SOUND: OneOfSound = oneOfSound([
  clipSound(caoUrl),
  clipSound(aiyoUrl),
  clipSound(zougouUrl),
  clipSound(kaoUrl),
]);

/** A game buzzer, for a move the rules refuse. */
export const WRONG_BUZZER_SOUND: ClipSound = clipSound(wrongBuzzerUrl, 0.7);

/** A wooden knock, for a piece set down. */
export const WOOD_KNOCK_SOUND: ClipSound = clipSound(woodKnockUrl, 1);
