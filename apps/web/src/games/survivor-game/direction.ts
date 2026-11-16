import type { Direction } from '@local/survivor-game';

/** The joystick and the keys give one of this many directions, so a small shake of the thumb sends nothing. */
const DIRECTION_COUNT = 32;

// A unit direction has up to 6 decimals, which hides float noise such as 6e-17 for a right angle.
const DECIMAL_SCALE = 1_000_000;

function roundClean(value: number): number {
  // Adding 0 turns -0 into 0.
  return Math.round(value * DECIMAL_SCALE) / DECIMAL_SCALE + 0;
}

/** The unit direction nearest to the way the vector points. A zero vector gives null. */
export function quantiseDirection(x: number, y: number): Direction | null {
  if (x === 0 && y === 0) {
    return null;
  }
  const stepAngle = (2 * Math.PI) / DIRECTION_COUNT;
  const angle = Math.round(Math.atan2(y, x) / stepAngle) * stepAngle;
  return { x: roundClean(Math.cos(angle)), y: roundClean(Math.sin(angle)) };
}

export function isSameDirection(first: Direction | null, second: Direction | null): boolean {
  if (first === null || second === null) {
    return first === second;
  }
  return first.x === second.x && first.y === second.y;
}

// Keys by their place on the keyboard, so WASD works on every layout (SG-54).
const KEY_DIRECTIONS: Readonly<Record<string, Direction>> = {
  KeyW: { x: 0, y: -1 },
  ArrowUp: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

export function isDirectionKey(code: string): boolean {
  return code in KEY_DIRECTIONS;
}

/** The direction of the keys held now. Keys that point opposite ways cancel each other. */
export function directionFromKeys(heldCodes: ReadonlySet<string>): Direction | null {
  let x = 0;
  let y = 0;
  for (const code of heldCodes) {
    const keyDirection = KEY_DIRECTIONS[code];
    if (keyDirection !== undefined) {
      x += keyDirection.x;
      y += keyDirection.y;
    }
  }
  return quantiseDirection(x, y);
}
