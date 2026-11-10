import { describe, expect, it } from 'vitest';
import {
  createRandomState,
  drawRandomFraction,
  drawRandomItem,
  drawShuffled,
  drawWeightedItem,
  isRandomState,
  type RandomState,
} from './seeded-random.js';

function drawManyItems<Item>(
  randomState: RandomState,
  count: number,
  drawOne: (state: RandomState) => { value: Item; randomState: RandomState },
): Item[] {
  const items: Item[] = [];
  let currentState = randomState;
  for (let drawn = 0; drawn < count; drawn++) {
    const draw = drawOne(currentState);
    items.push(draw.value);
    currentState = draw.randomState;
  }
  return items;
}

const LETTERS = ['a', 'b', 'c', 'd', 'e'];

describe('seeded random numbers', () => {
  it('draws the same values from the same state', () => {
    const drawLetters = (seed: number): string[] =>
      drawManyItems(createRandomState(seed), 50, (state) => drawRandomItem(state, LETTERS));
    expect(drawLetters(42)).toEqual(drawLetters(42));
  });

  it('draws different values from different seeds', () => {
    const drawLetters = (seed: number): string[] =>
      drawManyItems(createRandomState(seed), 50, (state) => drawRandomItem(state, LETTERS));
    expect(drawLetters(1)).not.toEqual(drawLetters(2));
  });

  it('keeps fractions in [0, 1) and states valid', () => {
    let state = createRandomState(-5);
    for (let drawCount = 0; drawCount < 1000; drawCount++) {
      const draw = drawRandomFraction(state);
      expect(draw.value).toBeGreaterThanOrEqual(0);
      expect(draw.value).toBeLessThan(1);
      expect(isRandomState(draw.randomState)).toBe(true);
      state = draw.randomState;
    }
  });

  it('rejects a seed that is not a whole number', () => {
    expect(() => createRandomState(1.5)).toThrow(RangeError);
    expect(() => createRandomState(Number.NaN)).toThrow(RangeError);
  });

  it('recognises only unsigned 32-bit whole numbers as states', () => {
    expect(isRandomState(0)).toBe(true);
    expect(isRandomState(0xffffffff)).toBe(true);
    expect(isRandomState(2 ** 32)).toBe(false);
    expect(isRandomState(-1)).toBe(false);
    expect(isRandomState(1.5)).toBe(false);
    expect(isRandomState('1')).toBe(false);
  });

  it('draws every item from a list and nothing else', () => {
    const letters = drawManyItems(createRandomState(3), 500, (state) =>
      drawRandomItem(state, LETTERS),
    );
    expect(new Set(letters)).toEqual(new Set(LETTERS));
  });

  it('refuses to draw from an empty list', () => {
    expect(() => drawRandomItem(createRandomState(1), [])).toThrow(RangeError);
  });

  it('shuffles the same items into a new order, the same way from the same state', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = drawShuffled(createRandomState(5), items);
    expect([...shuffled.value].sort()).toEqual(items);
    expect(shuffled.value).not.toEqual(items);
    expect(drawShuffled(createRandomState(5), items)).toEqual(shuffled);
  });
});

describe('drawWeightedItem', () => {
  const weightedLetters = [
    { letter: 'common', weight: 9 },
    { letter: 'rare', weight: 1 },
  ];

  it('draws items roughly in proportion to their weights', () => {
    const drawn = drawManyItems(createRandomState(11), 10000, (state) =>
      drawWeightedItem(state, weightedLetters, (item) => item.weight),
    );
    const rareCount = drawn.filter((item) => item.letter === 'rare').length;
    expect(rareCount).toBeGreaterThan(800);
    expect(rareCount).toBeLessThan(1200);
  });

  it('draws the same item from the same state', () => {
    const state = createRandomState(8);
    expect(drawWeightedItem(state, weightedLetters, (item) => item.weight)).toEqual(
      drawWeightedItem(state, weightedLetters, (item) => item.weight),
    );
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects a weight of %s', (weight) => {
    expect(() => drawWeightedItem(createRandomState(1), ['a'], () => weight)).toThrow(RangeError);
  });

  it('refuses to draw from an empty list', () => {
    expect(() => drawWeightedItem(createRandomState(1), [], () => 1)).toThrow(RangeError);
  });
});
