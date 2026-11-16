export interface FrameRateLimitOptions {
  readonly now: () => number;
  readonly maxFramesPerWindow: number;
  readonly windowMilliseconds: number;
}

/** Counts the frames of one socket in fixed windows of time. Make one for each socket. */
export class FrameRateLimit {
  private windowStartedAt: number;
  private framesInWindow = 0;

  constructor(private readonly options: FrameRateLimitOptions) {
    this.windowStartedAt = options.now();
  }

  /** Counts one frame and answers whether the socket is still within the limit. */
  allowFrame(): boolean {
    const now = this.options.now();
    if (now - this.windowStartedAt >= this.options.windowMilliseconds) {
      this.windowStartedAt = now;
      this.framesInWindow = 0;
    }
    this.framesInWindow += 1;
    return this.framesInWindow <= this.options.maxFramesPerWindow;
  }
}
