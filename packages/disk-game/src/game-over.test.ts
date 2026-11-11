import { describe, expect, it } from 'vitest';
import { findShortestPath } from './fewest-moves.js';
import { isGameOver } from './game-over.js';
import type { GameState } from './game-state.js';
import { applyDiskMove } from './move-disk.js';
import { createGame } from './new-game.js';
import { expectAccepted, makeTestState } from './test-support.js';

describe('isGameOver', () => {
  it('is over only when moves left is less than the fewest moves (DK-19)', () => {
    expect(isGameOver(makeTestState({ movesLeft: 3 }))).toBe(false);
    expect(isGameOver(makeTestState({ movesLeft: 2 }))).toBe(true);
  });

  it('is reached by wasting moves', () => {
    // Moving the small disk back and forth uses up the 3 spare moves and then 1 more.
    let state = makeTestState();
    for (const move of [
      { fromPeg: 1, toPeg: 2 },
      { fromPeg: 2, toPeg: 1 },
      { fromPeg: 1, toPeg: 2 },
    ]) {
      state = expectAccepted(applyDiskMove(state, move)).state;
      expect(isGameOver(state)).toBe(false);
    }
    state = expectAccepted(applyDiskMove(state, { fromPeg: 2, toPeg: 1 })).state;
    expect(isGameOver(state)).toBe(true);
  });

  it('is never reached by a player who always plays a shortest path (DK-19)', () => {
    let state: GameState = createGame({ startingDiskCount: 3, seed: 21 });
    while (state.stage < 6) {
      const { nextMove } = findShortestPath(state.pegs);
      if (nextMove === null) {
        throw new Error('A game state never holds a sorted layout');
      }
      state = expectAccepted(applyDiskMove(state, nextMove)).state;
      expect(isGameOver(state)).toBe(false);
    }
  });
});
