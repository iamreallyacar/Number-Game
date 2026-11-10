/**
 * State of a Mulberry32 generator: an unsigned 32-bit integer. A game keeps it in its game state
 * so the browser and the server draw exactly the same values from the same state.
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

/** Draws one item, each item having the same chance. */
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

/**
 * Draws one item, where an item's chance is its weight divided by the total of all weights.
 * Weights must be whole numbers of 1 or more, so the running total never loses precision.
 */
export function drawWeightedItem<Item>(
  randomState: RandomState,
  items: readonly Item[],
  weightOf: (item: Item) => number,
): RandomDraw<Item> {
  const weightedItems = items.map((item) => {
    const weight = weightOf(item);
    if (!Number.isSafeInteger(weight) || weight < 1) {
      throw new RangeError(
        `Item weights must be whole numbers of 1 or more, got ${String(weight)}`,
      );
    }
    return { item, weight };
  });
  const totalWeight = weightedItems.reduce((total, { weight }) => total + weight, 0);
  if (totalWeight === 0) {
    throw new RangeError('Cannot draw a weighted item from an empty list');
  }
  const draw = drawRandomFraction(randomState);
  let remainingTarget = Math.floor(draw.value * totalWeight);
  for (const { item, weight } of weightedItems) {
    if (remainingTarget < weight) {
      return { value: item, randomState: draw.randomState };
    }
    remainingTarget -= weight;
  }
  throw new Error('Weighted draw ran past the last item, which should be impossible');
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
