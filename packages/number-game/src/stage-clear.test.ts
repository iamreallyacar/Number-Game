import { describe, expect, it } from 'vitest';
import { DIFFICULTY_PRESETS } from './difficulty.js';
import { stageClearBonus } from './scoring.js';
import { advanceStage } from './stage-clear.js';
import { cellsFromRows, makeTestState } from './test-support.js';

describe('advanceStage', () => {
  it('adds the bonus, moves up a stage, fills a new board, and resets uses', () => {
    const state = makeTestState({
      cells: [],
      width: 11,
      stage: 3,
      score: 40,
      difficulty: 'hard',
      addNumbersLeft: 0,
      hintsLeft: 0,
    });
    const nextState = advanceStage(state);
    expect(nextState.score).toBe(40 + stageClearBonus(3));
    expect(nextState.stage).toBe(4);
    expect(nextState.cells).toHaveLength(121);
    expect(nextState.cells.filter((cell) => cell !== null)).toHaveLength(120);
    expect(nextState.addNumbersLeft).toBe(DIFFICULTY_PRESETS.hard.addNumbersUsesPerStage);
    expect(nextState.hintsLeft).toBe(DIFFICULTY_PRESETS.hard.hintsPerStage);
    expect(nextState.randomState).not.toBe(state.randomState);
  });

  it('gives the bonus of 500 times the stage just cleared', () => {
    expect(stageClearBonus(1)).toBe(500);
    expect(stageClearBonus(4)).toBe(2000);
  });

  it('refuses to advance while numbers are left', () => {
    const state = makeTestState({ cells: cellsFromRows(['1.........']) });
    expect(() => advanceStage(state)).toThrow('1 numbers are left');
  });
});
