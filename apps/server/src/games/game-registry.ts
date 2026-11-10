import type { GameSummary, SummaryDetails } from '@local/game-server-api';
import type { Static, TSchema } from 'typebox';
import { Value } from 'typebox/value';
import { HttpError } from '../http-error.js';
import {
  currentFormatVersion,
  upgradeStoredValue,
  type StoredFormatUpgrade,
} from './stored-format.js';

export type GameMoveOutcome<State> =
  | { readonly accepted: true; readonly state: State }
  | { readonly accepted: false; readonly reason: string };

/** Everything a game gives the server. Shared code never looks inside the game state. */
export interface ServerGameDefinition<
  State,
  NewGameOptionsSchema extends TSchema,
  MoveSchema extends TSchema,
> {
  readonly id: string;
  readonly categories: readonly string[];
  readonly newGameOptionsSchema: NewGameOptionsSchema;
  readonly moveSchema: MoveSchema;
  createGame(options: Static<NewGameOptionsSchema>, seed: number): State;
  /** Upgrades stored states written by older versions of the game. See stored-format.ts. */
  readonly stateUpgrades: readonly StoredFormatUpgrade[];
  /** Checks a stored state, already upgraded to the newest format, and throws if it is broken. */
  parseState(stored: unknown): State;
  applyMove(state: State, move: Static<MoveSchema>): GameMoveOutcome<State>;
  isGameOver(state: State): boolean;
  summarize(state: State): GameSummary;
  /** Upgrades summary details stored with high scores by older versions of the game. */
  readonly summaryDetailsUpgrades: readonly StoredFormatUpgrade[];
  /** Checks stored summary details, already upgraded to the newest format. Throws if broken. */
  parseSummaryDetails(stored: unknown): SummaryDetails;
}

/** A game state as it is kept in a save slot. */
export interface StoredGameState {
  readonly stateJson: string;
  readonly stateVersion: number;
}

/** Summary details as they are kept with a high score. */
export interface StoredSummaryDetails {
  readonly detailsJson: string;
  readonly detailsVersion: number;
}

export interface StartedGame {
  readonly state: unknown;
  readonly storedState: StoredGameState;
}

export type RegisteredMoveOutcome =
  | {
      readonly accepted: true;
      readonly storedState: StoredGameState;
      readonly gameOver: boolean;
      readonly summary: GameSummary;
      readonly storedSummaryDetails: StoredSummaryDetails;
    }
  | { readonly accepted: false; readonly reason: string };

/**
 * A game as the shared server code sees it. It works on stored JSON, so games with different
 * state types can sit in one registry.
 */
export interface RegisteredGame {
  readonly id: string;
  readonly categories: readonly string[];
  startGame(options: unknown, seed: number): StartedGame;
  readState(stored: StoredGameState): unknown;
  applyMove(stored: StoredGameState, move: unknown): RegisteredMoveOutcome;
  summarize(stored: StoredGameState): GameSummary;
  readSummaryDetails(stored: StoredSummaryDetails): SummaryDetails;
}

function describeSchemaError(schema: TSchema, value: unknown): string {
  const [firstError] = Value.Errors(schema, value);
  if (firstError === undefined) {
    return 'does not match the expected shape';
  }
  const location = firstError.instancePath === '' ? 'value' : firstError.instancePath;
  return `${location} ${firstError.message}`;
}

/** Reads stored JSON, upgrades it to the newest format, and checks it, failing with a 500 error. */
function readStoredJson<Parsed>(
  json: string,
  version: number,
  upgrades: readonly StoredFormatUpgrade[],
  parse: (stored: unknown) => Parsed,
  brokenError: { readonly code: string; readonly description: string },
): Parsed {
  try {
    return parse(upgradeStoredValue(JSON.parse(json), version, upgrades));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new HttpError(500, brokenError.code, `${brokenError.description}: ${reason}`);
  }
}

const BROKEN_SAVE = { code: 'broken-save', description: 'This save is broken and cannot be used' };
const BROKEN_HIGH_SCORE = {
  code: 'broken-high-score',
  description: 'A stored high score is broken and cannot be shown',
};

/** Wraps a game definition so the registry can hold it next to games with other state types. */
export function defineServerGame<
  State,
  NewGameOptionsSchema extends TSchema,
  MoveSchema extends TSchema,
>(definition: ServerGameDefinition<State, NewGameOptionsSchema, MoveSchema>): RegisteredGame {
  const stateVersion = currentFormatVersion(definition.stateUpgrades);
  const detailsVersion = currentFormatVersion(definition.summaryDetailsUpgrades);

  function parseStoredState(stored: StoredGameState): State {
    return readStoredJson(
      stored.stateJson,
      stored.stateVersion,
      definition.stateUpgrades,
      (value) => definition.parseState(value),
      BROKEN_SAVE,
    );
  }

  function storeState(state: State): StoredGameState {
    return { stateJson: JSON.stringify(state), stateVersion };
  }

  return {
    id: definition.id,
    categories: definition.categories,

    startGame(options, seed) {
      if (!Value.Check(definition.newGameOptionsSchema, options)) {
        const problem = describeSchemaError(definition.newGameOptionsSchema, options);
        throw new HttpError(400, 'invalid-options', `New game options are invalid: ${problem}`);
      }
      const state = definition.createGame(options, seed);
      return { state, storedState: storeState(state) };
    },

    readState: parseStoredState,

    applyMove(stored, move) {
      if (!Value.Check(definition.moveSchema, move)) {
        const problem = describeSchemaError(definition.moveSchema, move);
        throw new HttpError(400, 'invalid-move', `Move is invalid: ${problem}`);
      }
      const outcome = definition.applyMove(parseStoredState(stored), move);
      if (!outcome.accepted) {
        return { accepted: false, reason: outcome.reason };
      }
      const summary = definition.summarize(outcome.state);
      return {
        accepted: true,
        storedState: storeState(outcome.state),
        gameOver: definition.isGameOver(outcome.state),
        summary,
        storedSummaryDetails: { detailsJson: JSON.stringify(summary.details), detailsVersion },
      };
    },

    summarize(stored) {
      return definition.summarize(parseStoredState(stored));
    },

    readSummaryDetails(stored) {
      return readStoredJson(
        stored.detailsJson,
        stored.detailsVersion,
        definition.summaryDetailsUpgrades,
        (value) => definition.parseSummaryDetails(value),
        BROKEN_HIGH_SCORE,
      );
    },
  };
}

/** Holds every game the server knows, looked up by game id (PL-05). */
export class GameRegistry {
  private readonly gamesById = new Map<string, RegisteredGame>();

  register(game: RegisteredGame): void {
    if (this.gamesById.has(game.id)) {
      throw new Error(`A game with id '${game.id}' is already registered`);
    }
    this.gamesById.set(game.id, game);
  }

  /** Throws a 404 error for an unknown game id, since the id comes from the request URL. */
  getGame(gameId: string): RegisteredGame {
    const game = this.gamesById.get(gameId);
    if (game === undefined) {
      throw new HttpError(404, 'unknown-game', `There is no game with id '${gameId}'`);
    }
    return game;
  }
}
