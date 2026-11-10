export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Digit = (typeof DIGITS)[number];

/** One board square: a number from 1 to 9, or null when empty. */
export type Cell = Digit | null;

export function isDigit(value: unknown): value is Digit {
  return DIGITS.some((digit) => digit === value);
}
