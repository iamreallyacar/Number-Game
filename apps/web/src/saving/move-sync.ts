import { ApiError, describeError, NetworkError } from '../api/api-request.js';

/** What the player is told about saving (PS-08, PS-18). */
export type SaveStatus =
  | { readonly kind: 'saved' }
  | { readonly kind: 'saving' }
  /** A save failed for a reason that may pass, such as a network drop. It is being retried. */
  | { readonly kind: 'retrying'; readonly message: string }
  /** Another device opened this save, so this device stopped saving to it. */
  | { readonly kind: 'opened-elsewhere' }
  /**
   * The slot no longer holds this game, because it ended, was deleted, or a new game took the
   * slot. Reloading would open a different game, so the player is sent elsewhere (PS-19, PS-20).
   */
  | { readonly kind: 'save-gone' }
  /** The server refused a move. The game must be reloaded from the server. */
  | { readonly kind: 'out-of-sync'; readonly message: string };

export type SendMove = (move: unknown) => Promise<unknown>;
export type SaveStatusListener = (status: SaveStatus) => void;

// Waits between retries of a failed save. The last wait repeats until the save goes through.
export const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000] as const;
const LAST_RETRY_DELAY_MS = RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1] ?? 10000;

function isWorthRetrying(error: unknown): boolean {
  return error instanceof NetworkError || (error instanceof ApiError && error.status >= 500);
}

/**
 * Sends the moves of one open save to the server one at a time and in order, since the server
 * applies each move to the state left by the one before. The browser has already applied the
 * moves, so the player keeps playing while saves are on their way.
 */
export class MoveSync {
  private readonly pendingMoves: unknown[] = [];
  private isSending = false;
  private isStopped = false;
  private failedAttempts = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private status: SaveStatus = { kind: 'saved' };

  constructor(
    private readonly sendMove: SendMove,
    private readonly onStatusChange: SaveStatusListener,
  ) {}

  /** True while some moves have not reached the server yet. */
  get hasUnsavedMoves(): boolean {
    return this.pendingMoves.length > 0;
  }

  saveMove(move: unknown): void {
    if (this.isStopped) {
      return;
    }
    this.pendingMoves.push(move);
    if (!this.isSending && this.retryTimer === null) {
      void this.sendNextMove();
    }
  }

  /** Stops sending, for example when the game screen closes or the save must be reloaded. */
  stop(): void {
    this.isStopped = true;
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // A method instead of reading the field, because TypeScript keeps the field narrowed to false
  // across an await, while stop() may have been called during that await.
  private hasStopped(): boolean {
    return this.isStopped;
  }

  private setStatus(status: SaveStatus): void {
    const isRepeat =
      status.kind === this.status.kind && (status.kind === 'saving' || status.kind === 'saved');
    this.status = status;
    if (!isRepeat) {
      this.onStatusChange(status);
    }
  }

  private async sendNextMove(): Promise<void> {
    const [move] = this.pendingMoves;
    if (this.isStopped || move === undefined) {
      return;
    }
    this.isSending = true;
    if (this.failedAttempts === 0) {
      this.setStatus({ kind: 'saving' });
    }
    try {
      await this.sendMove(move);
    } catch (error) {
      this.isSending = false;
      this.handleFailedSave(error);
      return;
    }
    this.isSending = false;
    this.failedAttempts = 0;
    this.pendingMoves.shift();
    if (this.hasStopped()) {
      return;
    }
    if (this.pendingMoves.length === 0) {
      this.setStatus({ kind: 'saved' });
      return;
    }
    await this.sendNextMove();
  }

  private handleFailedSave(error: unknown): void {
    if (this.isStopped) {
      return;
    }
    if (isWorthRetrying(error)) {
      const delay = RETRY_DELAYS_MS[this.failedAttempts] ?? LAST_RETRY_DELAY_MS;
      this.failedAttempts++;
      this.setStatus({ kind: 'retrying', message: describeError(error) });
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        void this.sendNextMove();
      }, delay);
      return;
    }
    this.stop();
    if (error instanceof ApiError && error.errorCode === 'opened-elsewhere') {
      this.setStatus({ kind: 'opened-elsewhere' });
    } else if (error instanceof ApiError && error.errorCode === 'save-gone') {
      this.setStatus({ kind: 'save-gone' });
    } else {
      this.setStatus({ kind: 'out-of-sync', message: describeError(error) });
    }
  }
}
