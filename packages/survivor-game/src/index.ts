// Public entry point of the Survivor Game rules. Only what the server and the browser use is exported here.
export { SURVIVOR_GAME_ID } from './game-id.js';
export * as balance from './balance.js';
export { MAX_PLAYERS_PER_ROOM, MIN_PLAYERS_PER_ROOM } from './room-limits.js';
export type { Bullet, Enemy, PlayerState, RunEndReason, RunState } from './run-state.js';
export {
  INDIVIDUAL_UPGRADE_IDS,
  isTeamUpgrade,
  isUpgradeId,
  TEAM_UPGRADE_IDS,
  UPGRADE_IDS,
  UPGRADE_LIMITS,
  UPGRADE_TITLES,
  type IndividualUpgradeCounts,
  type IndividualUpgradeId,
  type TeamUpgradeCounts,
  type TeamUpgradeId,
  type UpgradeId,
} from './upgrades.js';
export type { Vector } from './geometry.js';
export {
  InvalidStepInputError,
  MAX_DIRECTION_COMPONENT,
  NO_INPUT,
  type Direction,
  type PlayerInput,
  type StepInputs,
} from './player-input.js';
export { createRun, type NewRunOptions } from './new-run.js';
export { stepRun } from './step-run.js';
export {
  findUpgradeChoiceRefusal,
  UpgradeChoiceRefusedError,
  type UpgradeChoiceRefusal,
} from './upgrade-choice.js';
export { endRunAsAbandoned, isRunOver, RunAlreadyEndedError } from './end-of-run.js';
export { experienceNeededAt } from './experience.js';
export { enemyLimitFor } from './enemy-spawning.js';
export {
  SOCKET_PLAYER_ID_PARAMETER,
  STEPS_PER_STATE_REPORT,
  type ChooseUpgradeMessage,
  type ClientMessage,
  type MessageRefusedMessage,
  type RunEndedMessage,
  type ServerMessage,
  type SetDirectionMessage,
  type StateReportMessage,
} from './messages.js';
export { InvalidMessageError } from './read-message-fields.js';
export { parseClientMessage } from './parse-client-message.js';
export { parseServerMessage } from './parse-server-message.js';
export { parseRunStateReport } from './parse-state-report.js';
export {
  buildRunStateReport,
  type ReportedBullet,
  type ReportedEnemy,
  type ReportedPlayer,
  type RunStateReport,
} from './state-report.js';
export {
  InvalidSummaryDetailsError,
  parseSummaryDetails,
  secondsSurvivedOf,
  summarizeRun,
  SURVIVOR_GAME_CATEGORIES,
  type SurvivorGameSummary,
  type SurvivorGameSummaryDetails,
} from './summary.js';
export { SUMMARY_DETAILS_UPGRADES } from './stored-format-upgrades.js';
