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
  private discardedBefore = 0;
  private loadCount = 0;

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

  /**
   * Call when newer data arrived by another route, so an answer from a load already in flight
   * (which may predate that data) is not applied. Polling carries on as usual.
   */
  discardLoadsInFlight(): void {
    this.discardedBefore = this.loadCount;
  }

  private isStillRunning(): boolean {
    return this.isRunning;
  }

  private async poll(): Promise<void> {
    const loadNumber = ++this.loadCount;
    let result: PollResult<Value>;
    try {
      result = { kind: 'loaded', value: await this.load() };
    } catch (error) {
      result = { kind: 'failed', error };
    }
    if (!this.isRunning) {
      return;
    }
    if (loadNumber > this.discardedBefore) {
      this.onResult(result);
    }
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
