import { describe, expect, it } from 'vitest';
import {
  directionFromKeys,
  isDirectionKey,
  isSameDirection,
  quantiseDirection,
} from './direction.js';
import { DirectionSender } from './direction-sender.js';
import {
  Joystick,
  JOYSTICK_DEAD_ZONE_PX,
  JOYSTICK_RADIUS_PX,
  joystickDirection,
} from './joystick.js';

describe('quantiseDirection', () => {
  it('gives exact unit directions for the four ways and the diagonals', () => {
    expect(quantiseDirection(5, 0)).toEqual({ x: 1, y: 0 });
    expect(quantiseDirection(0, -3)).toEqual({ x: 0, y: -1 });
    expect(quantiseDirection(-2, 0)).toEqual({ x: -1, y: 0 });
    const diagonal = quantiseDirection(4, 4);
    expect(diagonal?.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(diagonal?.y).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it('gives the same direction for a small change of angle, and a new one for a bigger change', () => {
    const base = quantiseDirection(100, 0);
    expect(quantiseDirection(100, 3)).toEqual(base);
    expect(quantiseDirection(100, 20)).not.toEqual(base);
  });

  it('gives only unit directions', () => {
    for (let angle = 0; angle < 360; angle += 7) {
      const radians = (angle * Math.PI) / 180;
      const direction = quantiseDirection(Math.cos(radians), Math.sin(radians));
      expect(Math.hypot(direction?.x ?? 0, direction?.y ?? 0)).toBeCloseTo(1, 5);
    }
  });

  it('gives no direction for a zero vector', () => {
    expect(quantiseDirection(0, 0)).toBeNull();
  });
});

describe('isSameDirection', () => {
  it('compares directions and none', () => {
    expect(isSameDirection(null, null)).toBe(true);
    expect(isSameDirection({ x: 1, y: 0 }, null)).toBe(false);
    expect(isSameDirection({ x: 1, y: 0 }, { x: 1, y: 0 })).toBe(true);
  });
});

describe('directionFromKeys', () => {
  it('reads WASD and the arrow keys', () => {
    expect(directionFromKeys(new Set(['KeyD']))).toEqual({ x: 1, y: 0 });
    expect(directionFromKeys(new Set(['ArrowUp']))).toEqual({ x: 0, y: -1 });
    expect(directionFromKeys(new Set(['KeyS']))).toEqual({ x: 0, y: 1 });
    expect(directionFromKeys(new Set(['ArrowLeft']))).toEqual({ x: -1, y: 0 });
  });

  it('walks diagonally at the same speed as straight', () => {
    const diagonal = directionFromKeys(new Set(['KeyW', 'KeyD']));
    expect(Math.hypot(diagonal?.x ?? 0, diagonal?.y ?? 0)).toBeCloseTo(1, 5);
    expect(diagonal?.x).toBeGreaterThan(0);
    expect(diagonal?.y).toBeLessThan(0);
  });

  it('cancels opposite keys and ignores other keys', () => {
    expect(directionFromKeys(new Set(['KeyA', 'KeyD']))).toBeNull();
    expect(directionFromKeys(new Set(['KeyQ']))).toBeNull();
    expect(directionFromKeys(new Set())).toBeNull();
    expect(isDirectionKey('KeyW')).toBe(true);
    expect(isDirectionKey('Digit1')).toBe(false);
  });
});

describe('joystickDirection', () => {
  const origin = { x: 100, y: 100 };

  it('gives no direction inside the dead zone', () => {
    expect(joystickDirection(origin, { x: 100 + JOYSTICK_DEAD_ZONE_PX - 1, y: 100 })).toBeNull();
  });

  it('gives a direction just past the dead zone', () => {
    // A literal 11 px, not the constant plus one, so that a wider dead zone makes this fail.
    expect(joystickDirection(origin, { x: 111, y: 100 })).toEqual({ x: 1, y: 0 });
  });

  it('points the way the thumb is pulled', () => {
    expect(joystickDirection(origin, { x: 100, y: 160 })).toEqual({ x: 0, y: 1 });
  });
});

describe('Joystick', () => {
  const start = { x: 200, y: 300 };

  it('starts where the thumb touches down, with no direction yet', () => {
    const joystick = new Joystick();
    expect(joystick.drawing).toBeNull();
    expect(joystick.start(1, start)).toBe(true);
    expect(joystick.direction).toBeNull();
    expect(joystick.drawing?.origin).toEqual(start);
  });

  it('follows the thumb and holds the knob inside the radius', () => {
    const joystick = new Joystick();
    joystick.start(1, start);
    joystick.move(1, { x: 200 + 500, y: 300 });
    expect(joystick.direction).toEqual({ x: 1, y: 0 });
    expect(joystick.drawing?.knob).toEqual({ x: 200 + JOYSTICK_RADIUS_PX, y: 300 });
  });

  it('gives no direction once released', () => {
    const joystick = new Joystick();
    joystick.start(1, start);
    joystick.move(1, { x: 300, y: 300 });
    expect(joystick.end(1)).toBe(true);
    expect(joystick.direction).toBeNull();
    expect(joystick.drawing).toBeNull();
  });

  it('ignores a second finger', () => {
    const joystick = new Joystick();
    joystick.start(1, start);
    expect(joystick.start(2, { x: 0, y: 0 })).toBe(false);
    joystick.move(2, { x: 0, y: 500 });
    expect(joystick.end(2)).toBe(false);
    expect(joystick.drawing?.origin).toEqual(start);
  });

  it('can be cancelled whoever holds it', () => {
    const joystick = new Joystick();
    joystick.start(1, start);
    joystick.move(1, { x: 300, y: 300 });
    joystick.cancel();
    expect(joystick.direction).toBeNull();
  });
});

describe('DirectionSender', () => {
  function senderWithLog(canSend = () => true) {
    const sent: (object | null)[] = [];
    const sender = new DirectionSender((direction) => {
      if (!canSend()) {
        return false;
      }
      sent.push(direction);
      return true;
    });
    return { sender, sent };
  }

  it('sends nothing until the direction changes, and nothing for the same direction twice', () => {
    const { sender, sent } = senderWithLog();
    sender.setKeyboard(null);
    expect(sent).toEqual([]);
    sender.setKeyboard({ x: 1, y: 0 });
    sender.setKeyboard({ x: 1, y: 0 });
    expect(sent).toEqual([{ x: 1, y: 0 }]);
    sender.setKeyboard(null);
    expect(sent).toEqual([{ x: 1, y: 0 }, null]);
  });

  it('prefers the joystick while it is held, then falls back to the keys', () => {
    const { sender, sent } = senderWithLog();
    sender.setKeyboard({ x: 1, y: 0 });
    sender.setJoystick({ x: 0, y: 1 });
    sender.setJoystick(null);
    expect(sent).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ]);
  });

  it('sends no direction when everything is let go', () => {
    const { sender, sent } = senderWithLog();
    sender.setJoystick({ x: 0, y: 1 });
    sender.setKeyboard({ x: 1, y: 0 });
    sender.releaseAll();
    expect(sent.at(-1)).toBeNull();
  });

  it('sends a direction again that could not be sent, and again after a reconnect', () => {
    let isOpen = false;
    const { sender, sent } = senderWithLog(() => isOpen);
    sender.setKeyboard({ x: 1, y: 0 });
    expect(sent).toEqual([]);
    isOpen = true;
    sender.handleReconnected();
    expect(sent).toEqual([{ x: 1, y: 0 }]);
    // The server dropped the direction with the old connection, so the held key is sent again.
    sender.handleReconnected();
    expect(sent).toEqual([
      { x: 1, y: 0 },
      { x: 1, y: 0 },
    ]);
  });
});
