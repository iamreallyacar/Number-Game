import type { Component } from 'svelte';
import type { SummaryDetails } from '@local/game-server-api';

/** A value high scores can be filtered by, such as a difficulty. */
export interface CategoryOption {
  readonly id: string;
  readonly label: string;
}

/** One labelled value shown next to a save slot or a high score, such as "Stage: 3". */
export interface DetailField {
  readonly label: string;
  readonly value: string;
}

export interface NewGameOptionsFormProps {
  /** Called with the options the server expects for a new game of this game. */
  readonly onSubmit: (options: unknown) => void;
}

export interface PlayScreenProps {
  /** The state from the server. The game checks its shape before using it. */
  readonly storedState: unknown;
  /** Applies nothing itself. It only sends a move the game has already applied to the server. */
  readonly saveMove: (move: unknown) => void;
  /** The game page, where an empty save slot starts a new game. */
  readonly newGamePath: string;
  readonly dashboardPath: string;
}

export interface RoomPlayScreenProps {
  readonly gameId: string;
  readonly roomId: string;
  /** The player ID exactly as the server returned it in the room, since the socket matches it exactly. */
  readonly playerId: string;
  /** The game page, where the rooms are listed. */
  readonly gamePagePath: string;
  readonly dashboardPath: string;
}

/** What every game gives, whatever its kind. */
interface BrowserGameBase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly categories: readonly CategoryOption[];
  /** Turns the details of a save slot or high score into labelled values. */
  describeDetails(details: SummaryDetails): readonly DetailField[];
}

/** A game played by one player in a save slot, one move at a time (PL-21). */
export interface SavedBrowserGame extends BrowserGameBase {
  readonly kind: 'saved';
  /** Downloads the form only when it is first needed, so the dashboard loads fast. */
  loadNewGameOptionsForm(): Promise<Component<NewGameOptionsFormProps>>;
  /** Downloads the play screen only when it is first needed, so the dashboard loads fast. */
  loadPlayScreen(): Promise<Component<PlayScreenProps>>;
}

/** A game played live by one or more players in a room, with no save slots (PL-21). */
export interface RoomBrowserGame extends BrowserGameBase {
  readonly kind: 'room';
  /** Downloads the play screen only when a run starts, so the dashboard loads fast. */
  loadPlayScreen(): Promise<Component<RoomPlayScreenProps>>;
}

/**
 * Everything a game gives the browser app (PL-05). The game id must match the server module.
 * Shared pages only use these fields and never look inside a game state (PL-06).
 */
export type BrowserGame = SavedBrowserGame | RoomBrowserGame;
