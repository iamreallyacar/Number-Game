import type { Direction } from '@local/survivor-game';
import { isSameDirection } from './direction.js';

/**
 * Turns what the joystick and the keys hold into set-direction messages, and sends one only when
 * the direction changes. The joystick wins over the keys while a thumb is on it.
 */
export class DirectionSender {
  private joystickDirection: Direction | null = null;
  private keyboardDirection: Direction | null = null;
  /** What the server holds for this player. It starts with no direction (SG-11). */
  private sentDirection: Direction | null = null;

  /** `send` answers whether the message went out, and a direction that did not is sent later. */
  constructor(private readonly send: (direction: Direction | null) => boolean) {}

  setJoystick(direction: Direction | null): void {
    this.joystickDirection = direction;
    this.sendIfChanged();
  }

  setKeyboard(direction: Direction | null): void {
    this.keyboardDirection = direction;
    this.sendIfChanged();
  }

  /** Lets go of everything, for a page that lost focus (SG-54). */
  releaseAll(): void {
    this.joystickDirection = null;
    this.keyboardDirection = null;
    this.sendIfChanged();
  }

  /** The server forgets the direction when a connection drops, so a new connection starts with none. */
  handleReconnected(): void {
    this.sentDirection = null;
    this.sendIfChanged();
  }

  private sendIfChanged(): void {
    const direction = this.joystickDirection ?? this.keyboardDirection;
    if (isSameDirection(direction, this.sentDirection)) {
      return;
    }
    if (this.send(direction)) {
      this.sentDirection = direction;
    }
  }
}
