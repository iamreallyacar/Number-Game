import type { GameState } from '@local/number-game';
import { describe, expect, it } from 'vitest';
import type { StoredGameState } from './game-registry.js';
import { numberGameServerModule } from './number-game.js';

/** A Hard game with one match left (the two 5s) and no Add Numbers, so that match ends it. */
const ONE_MATCH_FROM_GAME_OVER: GameState = {
  cells: [5, 5, 1, 2, 1, 2, 1, 2, 1, 2],
  score: 120,
  stage: 2,
  difficulty: 'hard',
  addNumbersLeft: 0,
  hintsLeft: 0,
  randomState: 1,
};

const MATCH_THE_FIVES = { type: 'match', firstIndex: 0, secondIndex: 1 };

function store(state: GameState): StoredGameState {
  return { stateJson: JSON.stringify(state), stateVersion: 2 };
}

describe('Number Game server module', () => {
  it('starts a game with the chosen options and sums it up for the save slot list', () => {
    const started = numberGameServerModule.startGame({ difficulty: 'normal' }, 42);
    expect(started.state).toMatchObject({ difficulty: 'normal', stage: 1 });
    expect(started.state).toHaveProperty('cells.length', 100);
    expect(numberGameServerModule.summarize(started.storedState)).toEqual({
      score: 0,
      category: 'normal',
      details: { stage: 1, difficulty: 'normal' },
    });
  });

  it('refuses a width option, since the board is always 10 wide', () => {
    expect(() => numberGameServerModule.startGame({ width: 10, difficulty: 'normal' }, 1)).toThrow(
      'New game options are invalid',
    );
  });

  it('applies a match', () => {
    const outcome = numberGameServerModule.applyMove(
      store({ ...ONE_MATCH_FROM_GAME_OVER, addNumbersLeft: 3 }),
      MATCH_THE_FIVES,
    );
    expect(outcome).toMatchObject({ accepted: true, gameOver: false });
    if (outcome.accepted) {
      expect(numberGameServerModule.readState(outcome.storedState)).toMatchObject({
        score: 130,
        cells: [null, null, 1, 2, 1, 2, 1, 2, 1, 2],
      });
    }
  });

  it('ends the game when no pair and no Add Numbers are left', () => {
    const outcome = numberGameServerModule.applyMove(
      store(ONE_MATCH_FROM_GAME_OVER),
      MATCH_THE_FIVES,
    );
    expect(outcome).toMatchObject({
      accepted: true,
      gameOver: true,
      summary: {
        score: 130,
        category: 'hard',
        details: { stage: 2, difficulty: 'hard' },
      },
    });
    if (outcome.accepted) {
      expect(numberGameServerModule.readSummaryDetails(outcome.storedSummaryDetails)).toEqual({
        stage: 2,
        difficulty: 'hard',
      });
    }
  });

  it('passes on why the rules refused a move', () => {
    expect(
      numberGameServerModule.applyMove(store(ONE_MATCH_FROM_GAME_OVER), { type: 'hint' }),
    ).toEqual({ accepted: false, reason: 'no-hints-left' });
  });

  it('rejects a move with the wrong shape', () => {
    expect(() =>
      numberGameServerModule.applyMove(store(ONE_MATCH_FROM_GAME_OVER), {
        type: 'match',
        firstIndex: 'zero',
      }),
    ).toThrow('Move is invalid');
  });

  it('upgrades a width 10 save from before the width was removed', () => {
    const state = numberGameServerModule.readState({
      stateJson: JSON.stringify({ width: 10, ...ONE_MATCH_FROM_GAME_OVER }),
      stateVersion: 1,
    });
    expect(state).toEqual(ONE_MATCH_FROM_GAME_OVER);
  });

  it('upgrades width 10 summary details from before the width was removed', () => {
    const details = numberGameServerModule.readSummaryDetails({
      detailsJson: '{"stage":2,"width":10,"difficulty":"hard"}',
      detailsVersion: 1,
    });
    expect(details).toEqual({ stage: 2, difficulty: 'hard' });
  });

  it('rejects a broken save with a clear error', () => {
    expect(() =>
      numberGameServerModule.readState({ stateJson: '{"width": 9}', stateVersion: 1 }),
    ).toThrow('This save is broken');
  });

  it('rejects a version 1 save that is not on width 10', () => {
    expect(() =>
      numberGameServerModule.readState({
        stateJson: JSON.stringify({ width: 11, ...ONE_MATCH_FROM_GAME_OVER }),
        stateVersion: 1,
      }),
    ).toThrow('This save is broken');
  });
});
