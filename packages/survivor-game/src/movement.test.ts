import { describe, expect, it } from 'vitest';
import { PLAYER_SPEED, STEP_RATE } from './balance.js';
import { movePlayers } from './movement.js';
import { InvalidStepInputError, NO_INPUT, toUnitDirection } from './player-input.js';
import { stepRun } from './step-run.js';
import { makePlayer, makeRun, withPlayers } from './test-support.js';

describe('toUnitDirection', () => {
  it('turns any length into length 1', () => {
    expect(toUnitDirection({ x: 3, y: 4 })).toEqual({ x: 0.6, y: 0.8 });
  });

  it('treats no direction and a zero direction as standing still', () => {
    expect(toUnitDirection(null)).toBeNull();
    expect(toUnitDirection({ x: 0, y: 0 })).toBeNull();
  });

  it('keeps a huge direction a unit vector instead of overflowing to nothing', () => {
    const unit = toUnitDirection({ x: 1e200, y: 1e200 });
    expect(unit?.x).toBeCloseTo(Math.SQRT1_2);
    expect(unit?.y).toBeCloseTo(Math.SQRT1_2);
    expect(toUnitDirection({ x: 1e200, y: 0 })).toEqual({ x: 1, y: 0 });
  });

  it('refuses numbers that are not finite', () => {
    expect(() => toUnitDirection({ x: Number.NaN, y: 0 })).toThrow(InvalidStepInputError);
    expect(() => toUnitDirection({ x: 0, y: Infinity })).toThrow(InvalidStepInputError);
  });
});

describe('movePlayers', () => {
  it('moves a player with a direction by the speed over one step', () => {
    const state = makeRun();
    const [moved] = movePlayers(state.players, new Map([['amy', { x: 0, y: 1 }]]), PLAYER_SPEED);
    expect(moved?.y).toBeCloseTo((state.players[0]?.y ?? 0) + PLAYER_SPEED / STEP_RATE);
  });

  it('leaves a player without a direction where they are', () => {
    const state = makeRun();
    expect(movePlayers(state.players, new Map(), PLAYER_SPEED)).toEqual(state.players);
  });
});

describe('moving in a step', () => {
  it('moves at the same speed in every direction', () => {
    const state = makeRun();
    const next = stepRun(state, new Map([['amy', { ...NO_INPUT, direction: { x: 5, y: 5 } }]]));
    const before = state.players[0];
    const after = next.players[0];
    expect(
      Math.hypot((after?.x ?? 0) - (before?.x ?? 0), (after?.y ?? 0) - (before?.y ?? 0)),
    ).toBeCloseTo(PLAYER_SPEED / STEP_RATE);
  });

  it('lets players pass through each other at full speed (SG-12)', () => {
    const distancePerStep = PLAYER_SPEED / STEP_RATE;
    const start = withPlayers(makeRun(['a', 'b']), [
      makePlayer({ playerId: 'a', x: -100 }),
      makePlayer({ playerId: 'b', x: 100 }),
    ]);
    const inputs = new Map([
      ['a', { ...NO_INPUT, direction: { x: 1, y: 0 } }],
      ['b', { ...NO_INPUT, direction: { x: -1, y: 0 } }],
    ]);
    // 200 apart closing at 2 * 160 per second, so they cross after 37.5 steps.
    const steps = 45;
    let state = start;
    for (let step = 0; step < steps; step += 1) {
      state = stepRun(state, inputs);
    }
    const [a, b] = state.players;
    expect(a?.x).toBeCloseTo(-100 + steps * distancePerStep, 5);
    expect(b?.x).toBeCloseTo(100 - steps * distancePerStep, 5);
    expect(a?.x).toBeGreaterThan(b?.x ?? 0);
  });
});
