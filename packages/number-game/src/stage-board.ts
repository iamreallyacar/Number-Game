import { padToFullRows } from './board.js';
import type { Cell, Digit } from './cell.js';
import type { DifficultyPreset } from './difficulty.js';
import { pairGroupsWithOddCount, pairPartners } from './pair.js';
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

/**
 * Changes a few random numbers so every pair group has an even count (NG-34). The count of numbers
 * is even, so the odd groups come in twos, and moving one number from the first group of each two
 * into the second makes both even.
 */
function evenOutPairGroups(
  digits: readonly Digit[],
  randomState: RandomState,
): RandomDraw<Digit[]> {
  if (digits.length % 2 === 1) {
    throw new Error('Pair groups can only be evened out for an even count of numbers');
  }
  const evenedDigits = [...digits];
  let currentState = randomState;
  const oddGroups = pairGroupsWithOddCount(digits);
  for (let groupIndex = 0; groupIndex < oddGroups.length; groupIndex += 2) {
    const fromGroup = oddGroups[groupIndex];
    const toGroup = oddGroups[groupIndex + 1];
    if (fromGroup === undefined || toGroup === undefined) {
      throw new Error('Odd pair groups did not come in twos');
    }
    const fromGroupIndexes = evenedDigits.flatMap((digit, cellIndex) =>
      fromGroup.includes(digit) ? [cellIndex] : [],
    );
    const cellDraw = drawRandomItem(currentState, fromGroupIndexes);
    const digitDraw = drawRandomItem(cellDraw.randomState, toGroup);
    evenedDigits[cellDraw.value] = digitDraw.value;
    currentState = digitDraw.randomState;
  }
  return { value: evenedDigits, randomState: currentState };
}

/**
 * Fills a new stage board of width x width cells (NG-02), shaped by the difficulty preset, so that
 * every number can be paired off (NG-34).
 */
export function generateStageBoard(
  width: number,
  preset: DifficultyPreset,
  randomState: RandomState,
): RandomDraw<Cell[]> {
  const cellCount = width * width;
  // An odd count of numbers can never all be paired off, so such a board leaves its last cell empty.
  const numberCount = cellCount - (cellCount % 2);
  const digits: Digit[] = [];
  let currentState = randomState;
  while (digits.length < numberCount) {
    const draw = drawStartingDigit(currentState, digits.at(-1), preset.startingPairChance);
    digits.push(draw.value);
    currentState = draw.randomState;
  }
  const evened = evenOutPairGroups(digits, currentState);
  return { value: padToFullRows(evened.value, width), randomState: evened.randomState };
}
