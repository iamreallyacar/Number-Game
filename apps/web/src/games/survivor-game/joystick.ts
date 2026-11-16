import type { Direction } from '@local/survivor-game';
import { quantiseDirection } from './direction.js';

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

/** How far the thumb can pull the knob, in screen pixels. */
export const JOYSTICK_RADIUS_PX = 56;
/** A pull shorter than this gives no direction, so a resting thumb does not move the character. */
export const JOYSTICK_DEAD_ZONE_PX = 10;

/** The direction a pull from the origin to the point gives, or null inside the dead zone. */
export function joystickDirection(origin: ScreenPoint, point: ScreenPoint): Direction | null {
  const pullX = point.x - origin.x;
  const pullY = point.y - origin.y;
  if (Math.hypot(pullX, pullY) < JOYSTICK_DEAD_ZONE_PX) {
    return null;
  }
  return quantiseDirection(pullX, pullY);
}

export interface JoystickDrawing {
  readonly origin: ScreenPoint;
  /** The knob, held inside the radius. */
  readonly knob: ScreenPoint;
}

/**
 * A joystick that appears where a pointer touches down and follows that one pointer until it is
 * released (SG-54). Other pointers that touch meanwhile are ignored.
 */
export class Joystick {
  private pointerId: number | null = null;
  private origin: ScreenPoint = { x: 0, y: 0 };
  private pointer: ScreenPoint = { x: 0, y: 0 };

  /** Starts at the point, unless a pointer already holds the joystick. Answers whether it started. */
  start(pointerId: number, point: ScreenPoint): boolean {
    if (this.pointerId !== null) {
      return false;
    }
    this.pointerId = pointerId;
    this.origin = point;
    this.pointer = point;
    return true;
  }

  move(pointerId: number, point: ScreenPoint): void {
    if (pointerId === this.pointerId) {
      this.pointer = point;
    }
  }

  /** Releases the joystick if this pointer holds it. Answers whether it did. */
  end(pointerId: number): boolean {
    if (pointerId !== this.pointerId) {
      return false;
    }
    this.pointerId = null;
    return true;
  }

  /** Releases the joystick whichever pointer holds it, for a page that lost focus. */
  cancel(): void {
    this.pointerId = null;
  }

  get direction(): Direction | null {
    return this.pointerId === null ? null : joystickDirection(this.origin, this.pointer);
  }

  /** What to draw, or null when nothing holds the joystick. */
  get drawing(): JoystickDrawing | null {
    if (this.pointerId === null) {
      return null;
    }
    const pullX = this.pointer.x - this.origin.x;
    const pullY = this.pointer.y - this.origin.y;
    const pullLength = Math.hypot(pullX, pullY);
    const shrink = pullLength > JOYSTICK_RADIUS_PX ? JOYSTICK_RADIUS_PX / pullLength : 1;
    return {
      origin: this.origin,
      knob: { x: this.origin.x + pullX * shrink, y: this.origin.y + pullY * shrink },
    };
  }
}
