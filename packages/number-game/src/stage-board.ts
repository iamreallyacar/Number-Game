import type { Cell, Digit } from './cell.js';
import type { DifficultyPreset } from './difficulty.js';
import { pairPartners } from './pair.js';
import {
  drawRandomDigit,
  drawRandomFraction,
  drawRandomItem,
  type RandomDraw,
  type RandomState,
} from './random.js';

function drawStartingDigit(
  randomState: RandomState,
  previousDigit: Digit | undefined,
  startingPairChance: number,
): RandomDraw<Digit> {
  if (previousDigit === undefined || startingPairChance === 0) {
    return drawRandomDigit(randomState);
  }
  const chanceDraw = drawRandomFraction(randomState);
  if (chanceDraw.value < startingPairChance) {
    return drawRandomItem(chanceDraw.randomState, pairPartners(previousDigit));
  }
  return drawRandomDigit(chanceDraw.randomState);
}

/** Fills a new stage board of width x width numbers (NG-02), shaped by the difficulty preset. */
export function generateStageBoard(
  width: number,
  preset: DifficultyPreset,
  randomState: RandomState,
): RandomDraw<Cell[]> {
  const digits: Digit[] = [];
  let currentState = randomState;
  for (let cellCount = 0; cellCount < width * width; cellCount++) {
    const draw = drawStartingDigit(currentState, digits.at(-1), preset.startingPairChance);
    digits.push(draw.value);
    currentState = draw.randomState;
  }
  return { value: digits, randomState: currentState };
}
