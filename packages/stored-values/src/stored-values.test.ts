import { describe, expect, it } from 'vitest';
import { isWholeNumberAtLeast, readStoredFields } from './stored-values.js';

describe('readStoredFields', () => {
  it('returns the fields of an object', () => {
    expect(readStoredFields({ score: 5, stage: 2 })).toEqual(
      new Map<string, unknown>([
        ['score', 5],
        ['stage', 2],
      ]),
    );
  });

  it('does not report built-in object properties as fields', () => {
    expect(readStoredFields({})?.has('toString')).toBe(false);
  });

  it.each([null, undefined, 5, 'text', [1, 2]])('returns null for %j', (value) => {
    expect(readStoredFields(value)).toBeNull();
  });
});

describe('isWholeNumberAtLeast', () => {
  it('accepts whole numbers from the minimum up', () => {
    expect(isWholeNumberAtLeast(1, 1)).toBe(true);
    expect(isWholeNumberAtLeast(40, 1)).toBe(true);
  });

  it.each([0, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 60, '3', null])(
    'refuses %j with a minimum of 1',
    (value) => {
      expect(isWholeNumberAtLeast(value, 1)).toBe(false);
    },
  );
});
