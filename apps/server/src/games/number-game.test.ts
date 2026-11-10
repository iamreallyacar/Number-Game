import type { GameState } from '@local/number-game';
import { describe, expect, it } from 'vitest';
import type { StoredGameState } from './game-registry.js';
import { numberGameServerModule } from './number-game.js';

/** A Hard game with one match left (the two 5s) and no Add Numbers, so that match ends it. */
const ONE_MATCH_FROM_GAME_OVER: GameState = {
  width: 10,
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
  return { stateJson: JSON.stringify(state), stateVersion: 1 };
}

describe('Number Game server module', () => {
  it('starts a game with the chosen options and sums it up for the save slot list', () => {
    const started = numberGameServerModule.startGame({ width: 11, difficulty: 'normal' }, 42);
    expect(started.state).toMatchObject({ width: 11, difficulty: 'normal', stage: 1 });
    expect(numberGameServerModule.summarize(started.storedState)).toEqual({
      score: 0,
      category: 'normal',
      details: { stage: 1, width: 11, difficulty: 'normal' },
    });
  });

  it('refuses a width the game does not offer', () => {
    expect(() => numberGameServerModule.startGame({ width: 9, difficulty: 'normal' }, 1)).toThrow(
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
        details: { stage: 2, width: 10, difficulty: 'hard' },
      },
    });
    if (outcome.accepted) {
      expect(numberGameServerModule.readSummaryDetails(outcome.storedSummaryDetails)).toEqual({
        stage: 2,
        width: 10,
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

  it('rejects a broken save with a clear error', () => {
    expect(() =>
      numberGameServerModule.readState({ stateJson: '{"width": 9}', stateVersion: 1 }),
    ).toThrow('This save is broken');
  });
});
