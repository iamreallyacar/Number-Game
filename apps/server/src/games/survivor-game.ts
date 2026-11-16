import {
  balance,
  buildRunStateReport,
  endRunAsAbandoned,
  findUpgradeChoiceRefusal,
  isRunOver,
  MAX_PLAYERS_PER_ROOM,
  MIN_PLAYERS_PER_ROOM,
  NO_INPUT,
  parseClientMessage,
  parseSummaryDetails,
  createRun,
  stepRun,
  STEPS_PER_STATE_REPORT,
  summarizeRun,
  SUMMARY_DETAILS_UPGRADES,
  SURVIVOR_GAME_CATEGORIES,
  SOCKET_PLAYER_ID_PARAMETER,
  SURVIVOR_GAME_ID,
  type ClientMessage,
  type MessageRefusedMessage,
  type PlayerInput,
  type RunEndedMessage,
  type RunState,
  type StateReportMessage,
} from '@local/survivor-game';
import { defineRoomGame } from './room-game.js';

function readEndReason(run: RunState): NonNullable<RunState['endReason']> {
  if (run.endReason === null) {
    throw new Error('A run that has not ended has no end reason to report');
  }
  return run.endReason;
}

export const survivorGameServerModule = defineRoomGame<RunState, PlayerInput, ClientMessage>({
  id: SURVIVOR_GAME_ID,
  categories: SURVIVOR_GAME_CATEGORIES,
  minPlayers: MIN_PLAYERS_PER_ROOM,
  maxPlayers: MAX_PLAYERS_PER_ROOM,
  stepRate: balance.STEP_RATE,
  stepsPerReport: STEPS_PER_STATE_REPORT,
  emptyRunSeconds: balance.EMPTY_RUN_SECONDS,
  socketPlayerIdParameter: SOCKET_PLAYER_ID_PARAMETER,
  idleInput: NO_INPUT,
  createRun: (playerIds, seed) => createRun({ playerIds, seed }),
  parseClientMessage,

  applyClientMessage(run, playerId, pendingInput, message) {
    if (message.type === 'set-direction') {
      return { accepted: true, pendingInput: { ...pendingInput, direction: message.direction } };
    }
    const refusal = findUpgradeChoiceRefusal(run, playerId, message.upgradeId);
    if (refusal !== null) {
      return {
        accepted: false,
        reason: refusal,
        message: `The upgrade '${message.upgradeId}' cannot be chosen now: ${refusal}`,
      };
    }
    return { accepted: true, pendingInput: { ...pendingInput, upgradeChoice: message.upgradeId } };
  },

  inputForNextStep: (pendingInput) => ({ ...pendingInput, upgradeChoice: null }),
  step: stepRun,
  isRunOver,
  endAsAbandoned: endRunAsAbandoned,
  summarize: summarizeRun,
  summaryDetailsUpgrades: SUMMARY_DETAILS_UPGRADES,
  parseSummaryDetails,

  stateReport: (run): StateReportMessage => ({ type: 'state', state: buildRunStateReport(run) }),
  runEndedReport: (run): RunEndedMessage => ({
    type: 'run-ended',
    reason: readEndReason(run),
    state: buildRunStateReport(run),
    summary: summarizeRun(run),
  }),
  refusalReport: (refusal): MessageRefusedMessage => ({
    type: 'message-refused',
    reason: refusal.reason,
    message: refusal.message,
  }),
});
