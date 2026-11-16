export type PollResult<Value> =
  | { readonly kind: 'loaded'; readonly value: Value }
  | { readonly kind: 'failed'; readonly error: unknown };

/**
 * Loads something again and again, with the wait counted from the end of each load so slow
 * answers never pile up. A failed load is reported and polling goes on, since a short network
 * problem should not stop a waiting room.
 */
export class Poller<Value> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  constructor(
    private readonly load: () => Promise<Value>,
    private readonly onResult: (result: PollResult<Value>) => void,
    private readonly intervalMs: number,
  ) {}

  /** Loads at once, then every interval, until stop is called. */
  start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    void this.poll();
  }

  stop(): void {
    this.isRunning = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private isStillRunning(): boolean {
    return this.isRunning;
  }

  private async poll(): Promise<void> {
    let result: PollResult<Value>;
    try {
      result = { kind: 'loaded', value: await this.load() };
    } catch (error) {
      result = { kind: 'failed', error };
    }
    if (!this.isRunning) {
      return;
    }
    this.onResult(result);
    // The callback may have stopped the poller.
    if (!this.isStillRunning()) {
      return;
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.poll();
    }, this.intervalMs);
  }
}
