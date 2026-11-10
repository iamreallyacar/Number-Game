import type { Static, TSchema } from 'typebox';
import { Value } from 'typebox/value';
import { HttpError } from '../http-error.js';

export type SummaryDetails = Readonly<Record<string, string | number>>;

/** What shared code needs to know about a game state for save slot lists and high scores. */
export interface GameSummary {
  readonly score: number;
  /** The value high scores are filtered by. Must be one of the game's `categories`. */
  readonly category: string;
  readonly details: SummaryDetails;
}

export type MoveDetails = Readonly<Record<string, unknown>>;

export type GameMoveOutcome<State> =
  | { readonly accepted: true; readonly state: State; readonly details: MoveDetails }
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
  /** Checks a stored state and throws if it is broken. */
  parseState(stored: unknown): State;
  applyMove(state: State, move: Static<MoveSchema>): GameMoveOutcome<State>;
  isGameOver(state: State): boolean;
  summarize(state: State): GameSummary;
}

export type RegisteredMoveOutcome =
  | {
      readonly accepted: true;
      readonly state: unknown;
      readonly stateJson: string;
      readonly details: MoveDetails;
      readonly gameOver: boolean;
      readonly summary: GameSummary;
    }
  | { readonly accepted: false; readonly reason: string };

export interface StartedGame {
  readonly state: unknown;
  readonly stateJson: string;
}

/**
 * A game as the shared server code sees it. It works on stored JSON, so games with different
 * state types can sit in one registry.
 */
export interface RegisteredGame {
  readonly id: string;
  readonly categories: readonly string[];
  startGame(options: unknown, seed: number): StartedGame;
  readState(stateJson: string): unknown;
  applyMove(stateJson: string, move: unknown): RegisteredMoveOutcome;
  summarize(stateJson: string): GameSummary;
}

function describeSchemaError(schema: TSchema, value: unknown): string {
  const [firstError] = Value.Errors(schema, value);
  if (firstError === undefined) {
    return 'does not match the expected shape';
  }
  const location = firstError.instancePath === '' ? 'value' : firstError.instancePath;
  return `${location} ${firstError.message}`;
}

/** Wraps a game definition so the registry can hold it next to games with other state types. */
export function defineServerGame<
  State,
  NewGameOptionsSchema extends TSchema,
  MoveSchema extends TSchema,
>(definition: ServerGameDefinition<State, NewGameOptionsSchema, MoveSchema>): RegisteredGame {
  function parseStoredState(stateJson: string): State {
    try {
      return definition.parseState(JSON.parse(stateJson));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new HttpError(500, 'broken-save', `This save is broken and cannot be used: ${reason}`);
    }
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
      return { state, stateJson: JSON.stringify(state) };
    },

    readState: parseStoredState,

    applyMove(stateJson, move) {
      if (!Value.Check(definition.moveSchema, move)) {
        const problem = describeSchemaError(definition.moveSchema, move);
        throw new HttpError(400, 'invalid-move', `Move is invalid: ${problem}`);
      }
      const outcome = definition.applyMove(parseStoredState(stateJson), move);
      if (!outcome.accepted) {
        return outcome;
      }
      return {
        accepted: true,
        state: outcome.state,
        stateJson: JSON.stringify(outcome.state),
        details: outcome.details,
        gameOver: definition.isGameOver(outcome.state),
        summary: definition.summarize(outcome.state),
      };
    },

    summarize(stateJson) {
      return definition.summarize(parseStoredState(stateJson));
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
