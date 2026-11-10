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
  readonly newGamePath: string;
  readonly dashboardPath: string;
}

/**
 * Everything a game gives the browser app (PL-05). The game id must match the server module.
 * Shared pages only use these fields and never look inside a game state (PL-06).
 */
export interface BrowserGame {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly categories: readonly CategoryOption[];
  /** Turns the details of a save slot or high score into labelled values. */
  describeDetails(details: SummaryDetails): readonly DetailField[];
  readonly NewGameOptionsForm: Component<NewGameOptionsFormProps>;
  readonly PlayScreen: Component<PlayScreenProps>;
}
