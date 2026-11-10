import { DIGITS, type Cell, type Digit } from './cell.js';

const PAIR_SUM = 10;

/** Two numbers are a pair when they are equal or add up to 10. A 5 and a 5 is both, and counts once. */
export function isPair(first: Digit, second: Digit): boolean {
  return first === second || first + second === PAIR_SUM;
}

/** Every number that pairs with the given one. */
export function pairPartners(digit: Digit): Digit[] {
  return DIGITS.filter((candidate) => isPair(digit, candidate));
}

// Each pair group holds numbers that all pair with each other, named here by its smallest number.
const PAIR_GROUP_LEADERS: readonly Digit[] = [1, 2, 3, 4, 5];

/**
 * The pair groups (1 and 9, 2 and 8, 3 and 7, 4 and 6, and 5 alone) that hold an odd count of
 * numbers in the given cells. A board can only be cleared completely when this list is empty (NG-34).
 */
export function pairGroupsWithOddCount(cells: readonly Cell[]): Digit[][] {
  return PAIR_GROUP_LEADERS.map(pairPartners).filter(
    (group) => cells.filter((cell) => cell !== null && group.includes(cell)).length % 2 === 1,
  );
}
