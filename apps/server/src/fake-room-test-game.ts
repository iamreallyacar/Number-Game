// A tiny room game for the tests of shared room code, so they do not depend on the rules of a
// real game. Each connected player holds a number, and the score grows by the held numbers each
// step. The run finishes at step 100. A 'boom' message makes the next step throw, to test that a
// broken run does not take the server down. Excluded from the build in tsconfig.build.json.
import { defineRoomGame } from './games/room-game.js';

export const FAKE_ROOM_GAME_ID = 'fake-room';
export const FAKE_ROOM_PLAYER_PARAMETER = 'player';
export const FAKE_ROOM_STEP_RATE = 10;
export const FAKE_ROOM_STEPS_PER_REPORT = 2;
export const FAKE_ROOM_EMPTY_RUN_SECONDS = 2;
export const FAKE_ROOM_FINAL_STEP = 100;
export const FAKE_ROOM_MAX_PLAYERS = 2;

interface FakeRun {
  readonly playerIds: readonly string[];
  readonly stepCount: number;
  readonly score: number;
  /** The number each player held in the last step. Dropped players are missing. */
  readonly heldInLastStep: Readonly<Record<string, number>>;
  readonly endReason: 'finished' | 'abandoned' | null;
}

interface FakeInput {
  readonly held: number;
  readonly boom: boolean;
}

type FakeMessage =
  | { readonly type: 'hold'; readonly amount: number }
  | { readonly type: 'boom' }
  | { readonly type: 'refuse' };

function readFakeMessage(raw: unknown): FakeMessage {
  if (typeof raw === 'object' && raw !== null && 'type' in raw) {
    if (raw.type === 'hold' && 'amount' in raw && typeof raw.amount === 'number') {
      return { type: 'hold', amount: raw.amount };
    }
    if (raw.type === 'boom' || raw.type === 'refuse') {
      return { type: raw.type };
    }
  }
  throw new Error('not a fake room message');
}

function readEndReason(run: FakeRun): 'finished' | 'abandoned' {
  if (run.endReason === null) {
    throw new Error('the run has not ended');
  }
  return run.endReason;
}

export const fakeRoomTestGame = defineRoomGame<FakeRun, FakeInput, FakeMessage>({
  id: FAKE_ROOM_GAME_ID,
  categories: ['1', '2'],
  minPlayers: 1,
  maxPlayers: FAKE_ROOM_MAX_PLAYERS,
  stepRate: FAKE_ROOM_STEP_RATE,
  stepsPerReport: FAKE_ROOM_STEPS_PER_REPORT,
  emptyRunSeconds: FAKE_ROOM_EMPTY_RUN_SECONDS,
  socketPlayerIdParameter: FAKE_ROOM_PLAYER_PARAMETER,
  idleInput: { held: 0, boom: false },
  createRun: (playerIds) => ({
    playerIds,
    stepCount: 0,
    score: 0,
    heldInLastStep: {},
    endReason: null,
  }),
  parseClientMessage: readFakeMessage,
  applyClientMessage(_run, _playerId, pendingInput, message) {
    switch (message.type) {
      case 'hold':
        return { accepted: true, pendingInput: { ...pendingInput, held: message.amount } };
      case 'boom':
        return { accepted: true, pendingInput: { ...pendingInput, boom: true } };
      case 'refuse':
        return { accepted: false, reason: 'not-allowed', message: 'The fake game refuses this' };
    }
  },
  inputForNextStep: (pendingInput) => ({ ...pendingInput, boom: false }),
  step(run, pendingInputs) {
    const heldInLastStep: Record<string, number> = {};
    let gained = 0;
    for (const [playerId, input] of pendingInputs) {
      if (input.boom) {
        throw new Error('boom');
      }
      heldInLastStep[playerId] = input.held;
      gained += input.held;
    }
    const stepCount = run.stepCount + 1;
    return {
      ...run,
      stepCount,
      score: run.score + gained,
      heldInLastStep,
      endReason: stepCount >= FAKE_ROOM_FINAL_STEP ? 'finished' : null,
    };
  },
  isRunOver: (run) => run.endReason !== null,
  endAsAbandoned(run) {
    if (run.endReason !== null) {
      throw new Error('the run has already ended');
    }
    return { ...run, endReason: 'abandoned' };
  },
  summarize: (run) => ({
    score: run.score,
    category: String(run.playerIds.length),
    details: { steps: run.stepCount },
  }),
  summaryDetailsUpgrades: [],
  parseSummaryDetails(stored) {
    if (
      typeof stored === 'object' &&
      stored !== null &&
      'steps' in stored &&
      typeof stored.steps === 'number'
    ) {
      return { steps: stored.steps };
    }
    throw new Error('stored fake room details have the wrong shape');
  },
  stateReport: (run) => ({ type: 'state', state: run }),
  runEndedReport: (run) => ({
    type: 'run-ended',
    reason: readEndReason(run),
    state: run,
    score: run.score,
  }),
  refusalReport: (refusal) => ({ type: 'message-refused', ...refusal }),
});
