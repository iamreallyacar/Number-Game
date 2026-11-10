import { DIGITS, type Digit } from './cell.js';

/**
 * State of a Mulberry32 generator: an unsigned 32-bit integer. It lives in the game state so the
 * browser and the server draw exactly the same numbers from the same state.
 */
export type RandomState = number;

export interface RandomDraw<Value> {
  readonly value: Value;
  readonly randomState: RandomState;
}

const MAX_RANDOM_STATE = 0xffffffff;

export function isRandomState(value: unknown): value is RandomState {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_RANDOM_STATE
  );
}

/** Turns any integer seed into a valid generator state. */
export function createRandomState(seed: number): RandomState {
  if (!Number.isSafeInteger(seed)) {
    throw new RangeError(`Random seed must be a safe integer, got ${String(seed)}`);
  }
  return seed >>> 0;
}

/** Draws a number in the range [0, 1). */
export function drawRandomFraction(randomState: RandomState): RandomDraw<number> {
  // Mulberry32: small, fast, and identical on every JavaScript engine.
  const nextState = (randomState + 0x6d2b79f5) >>> 0;
  let mixed = Math.imul(nextState ^ (nextState >>> 15), nextState | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  const fraction = ((mixed ^ (mixed >>> 14)) >>> 0) / (MAX_RANDOM_STATE + 1);
  return { value: fraction, randomState: nextState };
}

export function drawRandomDigit(randomState: RandomState): RandomDraw<Digit> {
  return drawRandomItem(randomState, DIGITS);
}

export function drawRandomItem<Item>(
  randomState: RandomState,
  items: readonly Item[],
): RandomDraw<Item> {
  const draw = drawRandomFraction(randomState);
  const item = items[Math.floor(draw.value * items.length)];
  if (item === undefined) {
    throw new RangeError('Cannot draw a random item from an empty list');
  }
  return { value: item, randomState: draw.randomState };
}

/** Draws `count` numbers, each picked from `allowedDigits` with the same chance. */
export function drawRandomDigits(
  randomState: RandomState,
  count: number,
  allowedDigits: readonly Digit[],
): RandomDraw<Digit[]> {
  const digits: Digit[] = [];
  let currentState = randomState;
  for (let drawn = 0; drawn < count; drawn++) {
    const draw = drawRandomItem(currentState, allowedDigits);
    digits.push(draw.value);
    currentState = draw.randomState;
  }
  return { value: digits, randomState: currentState };
}

/** Returns the items in a random order, each order having the same chance. */
export function drawShuffled<Item>(
  randomState: RandomState,
  items: readonly Item[],
): RandomDraw<Item[]> {
  const remaining = [...items];
  const shuffled: Item[] = [];
  let currentState = randomState;
  while (remaining.length > 0) {
    const draw = drawRandomFraction(currentState);
    shuffled.push(...remaining.splice(Math.floor(draw.value * remaining.length), 1));
    currentState = draw.randomState;
  }
  return { value: shuffled, randomState: currentState };
}
