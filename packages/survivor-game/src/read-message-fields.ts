import { readStoredFields } from '@local/stored-values';

export class InvalidMessageError extends Error {
  override readonly name = 'InvalidMessageError';
}

export function failMessage(what: string, problem: string): never {
  throw new InvalidMessageError(`Invalid ${what}: ${problem}`);
}

/** Reads the fields of an object, and fails when there are others than the expected ones. */
export function readExactFields(
  value: unknown,
  what: string,
  expectedNames: readonly string[],
): Map<string, unknown> {
  const fields = readStoredFields(value) ?? failMessage(what, 'expected an object');
  for (const name of fields.keys()) {
    if (!expectedNames.includes(name)) {
      failMessage(what, `unknown field '${name}'`);
    }
  }
  for (const name of expectedNames) {
    if (!fields.has(name)) {
      failMessage(what, `missing field '${name}'`);
    }
  }
  return fields;
}

export function readFiniteNumber(value: unknown, what: string, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    failMessage(what, `${name} must be a number`);
  }
  return value;
}

export function readWholeNumber(value: unknown, what: string, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    failMessage(what, `${name} must be a whole number of 0 or more`);
  }
  return value;
}

export function readText(value: unknown, what: string, name: string): string {
  if (typeof value !== 'string') {
    failMessage(what, `${name} must be text`);
  }
  return value;
}

export function readList(value: unknown, what: string, name: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    failMessage(what, `${name} must be a list`);
  }
  return value;
}
