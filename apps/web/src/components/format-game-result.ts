import type { GameResult } from '@local/game-server-api';
import type { BrowserGame } from '../games/browser-game.js';

/** The game's own labels for the details of a finished game, such as "Stage 3, Width 10". */
export function describeResultDetails(game: BrowserGame, result: GameResult): string {
  return game
    .describeDetails(result.details)
    .map((field) => `${field.label} ${field.value}`)
    .join(', ');
}

export function formatResultDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}
