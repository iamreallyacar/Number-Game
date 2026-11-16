import { balance, type RunStateReport } from '@local/survivor-game';

/** A gap of more steps than this between two states is a jump, such as after a reconnect, not movement to smooth. */
const MAX_SMOOTHED_STEP_GAP = 4;

const MILLISECONDS_PER_STEP = 1000 / balance.STEP_RATE;

export interface TimelineFrame {
  /** The state before the latest one, or null when there is nothing to smooth from. */
  readonly previous: RunStateReport | null;
  readonly latest: RunStateReport;
  /** How far the picture is from the previous state (0) to the latest (1). */
  readonly alpha: number;
}

interface ReceivedState {
  readonly state: RunStateReport;
  readonly receivedAtMs: number;
}

/**
 * Keeps the last two states the server reported, so the screen can slide from one to the next
 * between reports instead of jumping 30 times per second. The picture runs one report behind.
 */
export class StateTimeline {
  private previous: ReceivedState | null = null;
  private latest: ReceivedState | null = null;

  push(state: RunStateReport, nowMs: number): void {
    this.previous = this.latest;
    this.latest = { state, receivedAtMs: nowMs };
  }

  /** The newest state, or null before the first report. */
  get latestState(): RunStateReport | null {
    return this.latest?.state ?? null;
  }

  frameAt(nowMs: number): TimelineFrame | null {
    if (this.latest === null) {
      return null;
    }
    const { previous, latest } = this;
    const stepGap = previous === null ? 0 : latest.state.stepCount - previous.state.stepCount;
    if (previous === null || stepGap <= 0 || stepGap > MAX_SMOOTHED_STEP_GAP) {
      return { previous: null, latest: latest.state, alpha: 1 };
    }
    const smoothingMs = stepGap * MILLISECONDS_PER_STEP;
    const alpha = Math.min(1, Math.max(0, (nowMs - latest.receivedAtMs) / smoothingMs));
    return { previous: previous.state, latest: latest.state, alpha };
  }
}
