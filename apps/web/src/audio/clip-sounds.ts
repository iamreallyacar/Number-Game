import {
  clipSound,
  oneOfSound,
  spokenClipSound,
  type ClipSound,
  type OneOfSound,
} from './sound-player.js';
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
import huatFaatUrl from './clips/huat-faat.mp3';
import huatFaUrl from './clips/huat-fa.mp3';
import huatFacaiUrl from './clips/huat-facai.mp3';
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
import cheerXinnianKuaileYueUrl from './clips/cheer-xinnian-kuaile-yue.mp3';
import cheerYifanFengshunYueUrl from './clips/cheer-yifan-fengshun-yue.mp3';
import cheerGungheiYueUrl from './clips/cheer-gunghei-yue.mp3';
import cheerFaatdaatYueUrl from './clips/cheer-faatdaat-yue.mp3';
import cheerFaatcoiYueUrl from './clips/cheer-faatcoi-yue.mp3';
import cheerHanguenYueUrl from './clips/cheer-hanguen-yue.mp3';
import cheerPingonYueUrl from './clips/cheer-pingon-yue.mp3';
import cheerGatseongYueUrl from './clips/cheer-gatseong-yue.mp3';
import cheerSeonleiYueUrl from './clips/cheer-seonlei-yue.mp3';
import cheerHingwongYueUrl from './clips/cheer-hingwong-yue.mp3';
import cheerFukheiYueUrl from './clips/cheer-fukhei-yue.mp3';
import cheerSingleiYueUrl from './clips/cheer-singlei-yue.mp3';
import cheerChenggongCmnUrl from './clips/cheer-chenggong-cmn.mp3';
import cheerKaixinCmnUrl from './clips/cheer-kaixin-cmn.mp3';
import cheerXingfuCmnUrl from './clips/cheer-xingfu-cmn.mp3';
import cheerShunliCmnUrl from './clips/cheer-shunli-cmn.mp3';
import cheerSinChhunNanUrl from './clips/cheer-sin-chhun-nan.mp3';
import cheerPoUnNanUrl from './clips/cheer-po-un-nan.mp3';
import gameOverDousiYueUrl from './clips/game-over-dousi-yue.mp3';
import gameOverSibaaiYueUrl from './clips/game-over-sibaai-yue.mp3';
import gameOverHoseikYueUrl from './clips/game-over-hoseik-yue.mp3';
import gameOverSatmongYueUrl from './clips/game-over-satmong-yue.mp3';
import gameOverNaangwoYueUrl from './clips/game-over-naangwo-yue.mp3';
import gameOverYunwongYueUrl from './clips/game-over-yunwong-yue.mp3';
import gameOverLaapsaapYueUrl from './clips/game-over-laapsaap-yue.mp3';
import gameOverShibaiCmnUrl from './clips/game-over-shibai-cmn.mp3';
import gameOverShangxinCmnUrl from './clips/game-over-shangxin-cmn.mp3';
import gameOverShuCmnUrl from './clips/game-over-shu-cmn.mp3';
import gameOverMafanCmnUrl from './clips/game-over-mafan-cmn.mp3';
import wrongMatchFaansyuYueUrl from './clips/wrong-match-faansyu-yue.mp3';
import woodKnockUrl from './clips/wood-knock.mp3';

/** A comic groan or a word of regret in Chinese, picked at random, for when any game ends. */
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
  clipSound(gameOverDousiYueUrl),
  clipSound(gameOverSibaaiYueUrl),
  clipSound(gameOverHoseikYueUrl),
  clipSound(gameOverSatmongYueUrl),
  clipSound(gameOverNaangwoYueUrl),
  clipSound(gameOverYunwongYueUrl),
  clipSound(gameOverLaapsaapYueUrl),
  clipSound(gameOverShibaiCmnUrl),
  clipSound(gameOverShangxinCmnUrl),
  clipSound(gameOverShuCmnUrl),
  clipSound(gameOverMafanCmnUrl),
]);

/**
 * A cheer in Chinese, picked at random, for every good event in every game: a cleared pair, cleared
 * lines, or a cleared stage. The pool holds a Cantonese "maan seoi" (long live) and "faat", Mandarin
 * shouts of "fa" and "fa cai", Hokkien and Teochew shouts of "huat", "ong lai", "chin ho", "ho", and
 * "chai sin", Mandarin shouts of "li hai", "gong xi", and "bang", and Cantonese shouts of
 * "gung hei faat coi" and "zeng". It also holds Cantonese, Mandarin, and Hokkien blessings of two
 * or more words, such as "san nin faai lok", "yat faan fung seon", "cheng gong", and "sin chhun". Each clip carries its words in Chinese, written in simplified
 * characters for Mandarin and traditional characters for the other languages, so a screen can show
 * them beside the points.
 */
export const CHEER_SOUND: OneOfSound = oneOfSound([
  spokenClipSound(wanSuiUrl, '萬歲'),
  spokenClipSound(huatFaatUrl, '發'),
  spokenClipSound(huatFaUrl, '发'),
  spokenClipSound(huatFacaiUrl, '发财'),
  spokenClipSound(huatHokkienFirstUrl, '發'),
  spokenClipSound(huatHokkienSecondUrl, '發'),
  spokenClipSound(ongLaiHakuUrl, '旺來'),
  spokenClipSound(ongLaiAkamycocoUrl, '旺來'),
  spokenClipSound(chinHoUrl, '真好'),
  spokenClipSound(hoTeochewUrl, '好'),
  spokenClipSound(chaiSinUrl, '財神'),
  spokenClipSound(lihaiUrl, '厉害'),
  spokenClipSound(gongxiUrl, '恭喜'),
  spokenClipSound(bangUrl, '棒'),
  spokenClipSound(gungheiFaatcoiUrl, '恭喜發財'),
  spokenClipSound(zengUrl, '正'),
  spokenClipSound(cheerXinnianKuaileYueUrl, '新年快樂'),
  spokenClipSound(cheerYifanFengshunYueUrl, '一帆風順'),
  spokenClipSound(cheerGungheiYueUrl, '恭喜'),
  spokenClipSound(cheerFaatdaatYueUrl, '發達'),
  spokenClipSound(cheerFaatcoiYueUrl, '發財'),
  spokenClipSound(cheerHanguenYueUrl, '幸運'),
  spokenClipSound(cheerPingonYueUrl, '平安'),
  spokenClipSound(cheerGatseongYueUrl, '吉祥'),
  spokenClipSound(cheerSeonleiYueUrl, '順利'),
  spokenClipSound(cheerHingwongYueUrl, '興旺'),
  spokenClipSound(cheerFukheiYueUrl, '福氣'),
  spokenClipSound(cheerSingleiYueUrl, '勝利'),
  spokenClipSound(cheerChenggongCmnUrl, '成功'),
  spokenClipSound(cheerKaixinCmnUrl, '开心'),
  spokenClipSound(cheerXingfuCmnUrl, '幸福'),
  spokenClipSound(cheerShunliCmnUrl, '顺利'),
  spokenClipSound(cheerSinChhunNanUrl, '新春'),
  spokenClipSound(cheerPoUnNanUrl, '補運'),
]);

/** A Cantonese "faan syu" (sweet potato, slang for a dummy), for a move the rules refuse. */
export const WRONG_MATCH_SOUND: ClipSound = clipSound(wrongMatchFaansyuYueUrl);

/** A wooden knock, for a piece set down. */
export const WOOD_KNOCK_SOUND: ClipSound = clipSound(woodKnockUrl, 1);
