import type { Direction } from './player-input.js';
import type { RunEndReason } from './run-state.js';
import type { RunStateReport } from './state-report.js';
import type { SurvivorGameSummary } from './summary.js';
import type { UpgradeId } from './upgrades.js';

/** The URL query parameter that names the player ID when a browser opens the WebSocket. */
export const SOCKET_PLAYER_ID_PARAMETER = 'playerId';

/**
 * The server sends a state report after every this many steps. 2 at 30 steps per second is 15
 * reports per second, which the browser smooths between (see `state-timeline.ts`). It halves the
 * traffic of a report every step.
 */
export const STEPS_PER_STATE_REPORT = 2;

/** The direction the player holds now. The server keeps it for every step until the next message. */
export interface SetDirectionMessage {
  readonly type: 'set-direction';
  readonly direction: Direction | null;
}

export interface ChooseUpgradeMessage {
  readonly type: 'choose-upgrade';
  readonly upgradeId: UpgradeId;
}

/** Everything a browser sends over the WebSocket (SG-58). */
export type ClientMessage = SetDirectionMessage | ChooseUpgradeMessage;

export interface StateReportMessage {
  readonly type: 'state';
  readonly state: RunStateReport;
}

export interface RunEndedMessage {
  readonly type: 'run-ended';
  readonly reason: RunEndReason;
  /** The last state, so the browser can draw the final picture. */
  readonly state: RunStateReport;
  readonly summary: SurvivorGameSummary;
}

/** Tells one browser that its message was refused. The run goes on. */
export interface MessageRefusedMessage {
  readonly type: 'message-refused';
  readonly reason: string;
  readonly message: string;
}

/** Everything the server sends over the WebSocket (SG-60). */
export type ServerMessage = StateReportMessage | RunEndedMessage | MessageRefusedMessage;
