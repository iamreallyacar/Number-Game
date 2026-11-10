type SameType<First, Second> = [First] extends [Second]
  ? [Second] extends [First]
    ? true
    : false
  : false;

/**
 * Fails to compile unless both types accept exactly the same values, because only then is `true`
 * a valid argument. Used to keep a TypeBox schema and a type written by hand in step.
 */
export function expectSameType<First, Second>(sameType: SameType<First, Second>): boolean {
  return sameType;
}
