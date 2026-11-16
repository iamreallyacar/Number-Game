import type { GameSummary, SummaryDetails } from '@local/game-server-api';
import type { StoredFormatUpgrade } from '@local/stored-values';
import type { GameBasics } from './game-registry.js';
import { readStoredSummaryDetails, type StoredSummaryDetails } from './read-stored-json.js';
import { currentFormatVersion } from './stored-format.js';

/** Why a message from a browser was refused, and the text shown to the player. */
export interface MessageRefusal {
  readonly reason: string;
  readonly message: string;
}

export type ClientMessageOutcome<PendingInput> =
  | { readonly accepted: true; readonly pendingInput: PendingInput }
  | ({ readonly accepted: false } & MessageRefusal);

/** The reason given when a frame is not JSON, or not text. */
export const UNREADABLE_MESSAGE_REASON = 'unreadable-message';

/** Everything a room game gives the server. Shared code never looks inside the run. */
export interface RoomGameDefinition<Run, PendingInput, ClientMessage> {
  readonly id: string;
  readonly categories: readonly string[];
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly stepRate: number;
  readonly stepsPerReport: number;
  readonly emptyRunSeconds: number;
  /** The URL query parameter that names the player ID when a browser opens the WebSocket. */
  readonly socketPlayerIdParameter: string;
  /** What a player holds before sending anything, and after dropping. */
  readonly idleInput: PendingInput;
  createRun(playerIds: readonly string[], seed: number): Run;
  /** Checks a message from a browser. Throws for a bad one. */
  parseClientMessage(raw: unknown): ClientMessage;
  applyClientMessage(
    run: Run,
    playerId: string,
    pendingInput: PendingInput,
    message: ClientMessage,
  ): ClientMessageOutcome<PendingInput>;
  /** What the player keeps holding after a step. */
  inputForNextStep(pendingInput: PendingInput): PendingInput;
  /** Steps the run with the pending input of every connected player. Dropped players are left out. */
  step(run: Run, pendingInputs: ReadonlyMap<string, PendingInput>): Run;
  isRunOver(run: Run): boolean;
  endAsAbandoned(run: Run): Run;
  summarize(run: Run): GameSummary;
  readonly summaryDetailsUpgrades: readonly StoredFormatUpgrade[];
  parseSummaryDetails(stored: unknown): SummaryDetails;
  /** The messages below are plain data that survives JSON. */
  stateReport(run: Run): unknown;
  runEndedReport(run: Run): unknown;
  refusalReport(refusal: MessageRefusal): unknown;
}

export interface FinishedRunResult {
  readonly summary: GameSummary;
  readonly storedDetails: StoredSummaryDetails;
}

/**
 * One run as the shared room code sees it. It holds the run and the pending input of every
 * player, and speaks in JSON text, so rooms of different games can use it the same way.
 */
export interface RoomRunSession {
  /** Reads one text frame from a player. Returns the refusal message to send back, or null. */
  receiveMessage(playerId: string, text: string): string | null;
  /** A dropped player holds nothing until they send something again. */
  resetInput(playerId: string): void;
  step(connectedPlayerIds: ReadonlySet<string>): void;
  endAsAbandoned(): void;
  isOver(): boolean;
  stateReport(): string;
  runEndedReport(): string;
  finishedResult(): FinishedRunResult;
}

/** A room game as the shared server code sees it. */
export interface RegisteredRoomGame extends GameBasics {
  readonly kind: 'room';
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly stepRate: number;
  readonly stepsPerReport: number;
  readonly emptyRunSeconds: number;
  readonly socketPlayerIdParameter: string;
  startRun(playerIds: readonly string[], seed: number): RoomRunSession;
}

type ParsedMessage<ClientMessage> =
  | { readonly ok: true; readonly message: ClientMessage }
  | { readonly ok: false; readonly refusal: MessageRefusal };

function unreadable(message: string): { readonly ok: false; readonly refusal: MessageRefusal } {
  return { ok: false, refusal: { reason: UNREADABLE_MESSAGE_REASON, message } };
}

function parseJson(
  text: string,
): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Wraps a room game definition so the registry can hold it next to games with other run types. */
export function defineRoomGame<Run, PendingInput, ClientMessage>(
  definition: RoomGameDefinition<Run, PendingInput, ClientMessage>,
): RegisteredRoomGame {
  const detailsVersion = currentFormatVersion(definition.summaryDetailsUpgrades);

  function startRun(playerIds: readonly string[], seed: number): RoomRunSession {
    let run = definition.createRun(playerIds, seed);
    const pendingInputs = new Map<string, PendingInput>(
      playerIds.map((playerId) => [playerId, definition.idleInput]),
    );

    function refusalText(refusal: MessageRefusal): string {
      return JSON.stringify(definition.refusalReport(refusal));
    }

    function parseMessage(text: string): ParsedMessage<ClientMessage> {
      const json = parseJson(text);
      if (!json.ok) {
        return unreadable('The message is not valid JSON');
      }
      try {
        return { ok: true, message: definition.parseClientMessage(json.value) };
      } catch (error) {
        return unreadable(readErrorMessage(error));
      }
    }

    return {
      receiveMessage(playerId, text) {
        const pendingInput = pendingInputs.get(playerId);
        if (pendingInput === undefined) {
          throw new Error(`Player '${playerId}' is not in this run`);
        }
        const parsed = parseMessage(text);
        if (!parsed.ok) {
          return refusalText(parsed.refusal);
        }
        const outcome = definition.applyClientMessage(run, playerId, pendingInput, parsed.message);
        if (!outcome.accepted) {
          return refusalText(outcome);
        }
        pendingInputs.set(playerId, outcome.pendingInput);
        return null;
      },

      resetInput(playerId) {
        pendingInputs.set(playerId, definition.idleInput);
      },

      step(connectedPlayerIds) {
        const connectedInputs = new Map<string, PendingInput>();
        for (const playerId of connectedPlayerIds) {
          const pendingInput = pendingInputs.get(playerId);
          if (pendingInput === undefined) {
            throw new Error(`Player '${playerId}' is not in this run`);
          }
          connectedInputs.set(playerId, pendingInput);
        }
        run = definition.step(run, connectedInputs);
        for (const [playerId, pendingInput] of connectedInputs) {
          pendingInputs.set(playerId, definition.inputForNextStep(pendingInput));
        }
      },

      endAsAbandoned() {
        run = definition.endAsAbandoned(run);
      },

      isOver: () => definition.isRunOver(run),
      stateReport: () => JSON.stringify(definition.stateReport(run)),
      runEndedReport: () => JSON.stringify(definition.runEndedReport(run)),

      finishedResult() {
        const summary = definition.summarize(run);
        return {
          summary,
          storedDetails: { detailsJson: JSON.stringify(summary.details), detailsVersion },
        };
      },
    };
  }

  return {
    kind: 'room',
    id: definition.id,
    categories: definition.categories,
    minPlayers: definition.minPlayers,
    maxPlayers: definition.maxPlayers,
    stepRate: definition.stepRate,
    stepsPerReport: definition.stepsPerReport,
    emptyRunSeconds: definition.emptyRunSeconds,
    socketPlayerIdParameter: definition.socketPlayerIdParameter,
    startRun,
    readSummaryDetails: (stored) =>
      readStoredSummaryDetails(stored, definition.summaryDetailsUpgrades, (value) =>
        definition.parseSummaryDetails(value),
      ),
  };
}
