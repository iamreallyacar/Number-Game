import { DirectionSender } from './direction-sender.js';
import { directionFromKeys, isDirectionKey } from './direction.js';
import { Joystick } from './joystick.js';
import { offerIndexForKey } from './offer-cards.js';

/**
 * Connects the keyboard and the pointer to the direction sender. It only reads events: the
 * direction rules are in `direction.ts`, `joystick.ts`, and `direction-sender.ts`.
 */
export class PlayInput {
  readonly joystick = new Joystick();
  private readonly heldKeyCodes = new Set<string>();

  constructor(
    private readonly sender: DirectionSender,
    private readonly chooseOfferCard: (cardIndex: number) => void,
  ) {}

  /** Listens to the keys and to losing focus. Returns the function that stops listening. */
  attachKeyboard(): () => void {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (isDirectionKey(event.code)) {
        event.preventDefault();
        this.heldKeyCodes.add(event.code);
        this.sender.setKeyboard(directionFromKeys(this.heldKeyCodes));
        return;
      }
      const cardIndex = offerIndexForKey(event.code);
      if (cardIndex !== null && !event.repeat) {
        this.chooseOfferCard(cardIndex);
      }
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (this.heldKeyCodes.delete(event.code)) {
        this.sender.setKeyboard(directionFromKeys(this.heldKeyCodes));
      }
    };
    const releaseEverything = (): void => {
      this.heldKeyCodes.clear();
      this.joystick.cancel();
      this.sender.releaseAll();
    };
    const releaseWhenHidden = (): void => {
      if (document.hidden) {
        releaseEverything();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', releaseEverything);
    document.addEventListener('visibilitychange', releaseWhenHidden);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', releaseEverything);
      document.removeEventListener('visibilitychange', releaseWhenHidden);
    };
  }

  /** Listens for a thumb or a mouse on the play area, where the joystick appears (SG-54). */
  attachPointer(playArea: HTMLElement): () => void {
    const pointOf = (event: PointerEvent): { x: number; y: number } => {
      const box = playArea.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    };
    const handleDown = (event: PointerEvent): void => {
      if (this.joystick.start(event.pointerId, pointOf(event))) {
        playArea.setPointerCapture(event.pointerId);
        this.sender.setJoystick(this.joystick.direction);
      }
    };
    const handleMove = (event: PointerEvent): void => {
      this.joystick.move(event.pointerId, pointOf(event));
      this.sender.setJoystick(this.joystick.direction);
    };
    const handleUp = (event: PointerEvent): void => {
      if (this.joystick.end(event.pointerId)) {
        this.sender.setJoystick(null);
      }
    };
    playArea.addEventListener('pointerdown', handleDown);
    playArea.addEventListener('pointermove', handleMove);
    playArea.addEventListener('pointerup', handleUp);
    playArea.addEventListener('pointercancel', handleUp);
    return () => {
      playArea.removeEventListener('pointerdown', handleDown);
      playArea.removeEventListener('pointermove', handleMove);
      playArea.removeEventListener('pointerup', handleUp);
      playArea.removeEventListener('pointercancel', handleUp);
    };
  }
}
