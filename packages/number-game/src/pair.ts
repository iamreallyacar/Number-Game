import { DIGITS, type Digit } from './cell.js';

const PAIR_SUM = 10;

/** Two numbers are a pair when they are equal or add up to 10. A 5 and a 5 is both, and counts once. */
export function isPair(first: Digit, second: Digit): boolean {
  return first === second || first + second === PAIR_SUM;
}

/** Every number that pairs with the given one. */
export function pairPartners(digit: Digit): Digit[] {
  return DIGITS.filter((candidate) => isPair(digit, candidate));
}
