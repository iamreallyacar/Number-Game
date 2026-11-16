/** Turns a stored value written in one format version into the next version. */
export type StoredFormatUpgrade = (stored: unknown) => unknown;

/**
 * Returns the fields of a stored JSON object, or null when the value is not an object. A map is
 * returned, so a field named like a built-in object property cannot be mistaken for a real one.
 */
export function readStoredFields(value: unknown): Map<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return new Map<string, unknown>(Object.entries(value));
}

export function isWholeNumberAtLeast(value: unknown, minimum: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;
}
