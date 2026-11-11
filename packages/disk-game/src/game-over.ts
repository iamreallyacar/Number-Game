import { fewestMovesOf } from './fewest-moves.js';
import type { GameState } from './game-state.js';

/** The game is over when the moves left can no longer clear the stage (DK-19). */
export function isGameOver(state: Pick<GameState, 'pegs' | 'movesLeft'>): boolean {
  return state.movesLeft < fewestMovesOf(state.pegs);
}
