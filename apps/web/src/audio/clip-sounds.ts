import { clipSound, oneOfSound, type ClipSound, type OneOfSound } from './sound-player.js';
import caoUrl from './clips/game-over-cao.mp3';
import aiyoUrl from './clips/game-over-aiyo.mp3';
import zougouUrl from './clips/game-over-zougou.mp3';
import kaoCantoneseUrl from './clips/game-over-kao.mp3';
import kaoMandarinUrl from './clips/game-over-kao-cmn.mp3';
import woquUrl from './clips/game-over-woqu-cmn.mp3';
import diuUrl from './clips/game-over-diu-yue.mp3';
import diuLongUrl from './clips/game-over-diu-long-yue.mp3';
import canUrl from './clips/game-over-can-cmn.mp3';
import aiMandarinUrl from './clips/game-over-ai-cmn.mp3';
import aaiCantoneseUrl from './clips/game-over-aai-yue.mp3';
import yunUrl from './clips/game-over-yun-cmn.mp3';
import wanleUrl from './clips/game-over-wanle-cmn.mp3';
import sileUrl from './clips/game-over-sile-cmn.mp3';
import seilaaUrl from './clips/game-over-seilaa-yue.mp3';
import tianaUrl from './clips/game-over-tiana-cmn.mp3';
import wanSuiUrl from './clips/wan-sui.mp3';
import huatHokkienFirstUrl from './clips/cheer-huat-hokkien-cut-1.mp3';
import huatHokkienSecondUrl from './clips/cheer-huat-hokkien-cut-2.mp3';
import ongLaiHakuUrl from './clips/cheer-ong-lai-haku4065.mp3';
import ongLaiAkamycocoUrl from './clips/cheer-ong-lai-akamycoco.mp3';
import chinHoUrl from './clips/cheer-chin-ho-haku4065.mp3';
import hoTeochewUrl from './clips/cheer-ho-teochew-assassas77.mp3';
import chaiSinUrl from './clips/cheer-chai-sin-nan-1.mp3';
import lihaiUrl from './clips/cheer-lihai-cmn.mp3';
import gongxiUrl from './clips/cheer-gongxi-cmn.mp3';
import bangUrl from './clips/cheer-bang-cmn.mp3';
import gungheiFaatcoiUrl from './clips/cheer-gunghei-faatcoi-yue.mp3';
import zengUrl from './clips/cheer-zeng-yue.mp3';
import wrongBuzzerUrl from './clips/wrong-buzzer.mp3';
import woodKnockUrl from './clips/wood-knock.mp3';

/** A comic groan in Chinese, picked at random, for when any game ends. */
export const GAME_OVER_SOUND: OneOfSound = oneOfSound([
  clipSound(caoUrl),
  clipSound(aiyoUrl),
  clipSound(zougouUrl),
  clipSound(kaoCantoneseUrl),
  clipSound(kaoMandarinUrl),
  clipSound(woquUrl),
  clipSound(diuUrl),
  clipSound(diuLongUrl),
  clipSound(canUrl),
  clipSound(aiMandarinUrl),
  clipSound(aaiCantoneseUrl),
  clipSound(yunUrl),
  clipSound(wanleUrl),
  clipSound(sileUrl),
  clipSound(seilaaUrl),
  clipSound(tianaUrl),
]);

/**
 * A cheer in Chinese, picked at random, for a big win such as a cleared stage or cleared lines:
 * a Cantonese "maan seoi" (long live), Hokkien and Teochew shouts of "huat", "ong lai", "chin ho",
 * "ho", and "chai sin", Mandarin shouts of "li hai", "gong xi", and "bang", and Cantonese shouts
 * of "gung hei faat coi" and "zeng".
 */
export const CHEER_SOUND: OneOfSound = oneOfSound([
  clipSound(wanSuiUrl),
  clipSound(huatHokkienFirstUrl),
  clipSound(huatHokkienSecondUrl),
  clipSound(ongLaiHakuUrl),
  clipSound(ongLaiAkamycocoUrl),
  clipSound(chinHoUrl),
  clipSound(hoTeochewUrl),
  clipSound(chaiSinUrl),
  clipSound(lihaiUrl),
  clipSound(gongxiUrl),
  clipSound(bangUrl),
  clipSound(gungheiFaatcoiUrl),
  clipSound(zengUrl),
]);

/** A game buzzer, for a move the rules refuse. */
export const WRONG_BUZZER_SOUND: ClipSound = clipSound(wrongBuzzerUrl, 0.7);

/** A wooden knock, for a piece set down. */
export const WOOD_KNOCK_SOUND: ClipSound = clipSound(woodKnockUrl, 1);
