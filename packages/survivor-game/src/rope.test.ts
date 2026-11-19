import { describe, expect, it } from 'vitest';
import { PLAYER_SPEED, ROPE_LENGTH, STEP_RATE } from './balance.js';
import { distanceBetween } from './geometry.js';
import { NO_INPUT, type PlayerInput, type StepInputs } from './player-input.js';
import { makePlayer, makeRun, withPlayers } from './test-support.js';
import { stepRun } from './step-run.js';
import { pullPlayersBackToRope } from './rope.js';

const walk = (x: number): PlayerInput => ({ ...NO_INPUT, direction: { x, y: 0 } });
const distancePerStep = PLAYER_SPEED / STEP_RATE;

function stepMany(state: ReturnType<typeof makeRun>, inputs: StepInputs, steps: number) {
  let current = state;
  for (let step = 0; step < steps; step += 1) {
    current = stepRun(current, inputs);
  }
  return current;
}

function playerX(state: ReturnType<typeof makeRun>, playerId: string): number {
  const player = state.players.find((candidate) => candidate.playerId === playerId);
  if (player === undefined) {
    throw new Error('missing player');
  }
  return player.x;
}

describe('pullPlayersBackToRope', () => {
  const apart = (distance: number) => [
    makePlayer({ playerId: 'a', x: 0 }),
    makePlayer({ playerId: 'b', x: distance }),
  ];

  it('leaves players within the rope length where they are', () => {
    const pulled = pullPlayersBackToRope(apart(ROPE_LENGTH), new Set(['a']));
    expect(pulled.map((player) => player.x)).toEqual([0, ROPE_LENGTH]);
  });

  it('pulls both back equally when both move', () => {
    const [a, b] = pullPlayersBackToRope(apart(ROPE_LENGTH + 10), new Set(['a', 'b']));
    expect(a?.x).toBeCloseTo(5);
    expect(b?.x).toBeCloseTo(ROPE_LENGTH + 5);
  });

  it('pulls both back equally when both are still', () => {
    const [a, b] = pullPlayersBackToRope(apart(ROPE_LENGTH + 10), new Set());
    expect(a?.x).toBeCloseTo(5);
    expect(b?.x).toBeCloseTo(ROPE_LENGTH + 5);
  });

  it('lets the moving player hold their ground and the still one give way', () => {
    const [a, b] = pullPlayersBackToRope(apart(ROPE_LENGTH + 10), new Set(['a']));
    expect(a?.x).toBe(0);
    expect(b?.x).toBeCloseTo(ROPE_LENGTH);
  });

  it('works the same in any direction', () => {
    const players = [makePlayer({ playerId: 'a' }), makePlayer({ playerId: 'b', x: 0, y: 500 })];
    const [a, b] = pullPlayersBackToRope(players, new Set(['b']));
    expect(a?.y).toBeCloseTo(100);
    expect(b?.y).toBe(500);
  });
});

describe('the rope table of SG-19', () => {
  const twoPlayersAtRopeLength = () =>
    withPlayers(makeRun(['a', 'b']), [
      makePlayer({ playerId: 'a', x: 0 }),
      makePlayer({ playerId: 'b', x: ROPE_LENGTH }),
    ]);

  it('makes no progress when two players push opposite ways', () => {
    const state = stepMany(
      twoPlayersAtRopeLength(),
      new Map([
        ['a', walk(-1)],
        ['b', walk(1)],
      ]),
      20,
    );
    expect(playerX(state, 'a')).toBeCloseTo(0);
    expect(playerX(state, 'b')).toBeCloseTo(ROPE_LENGTH);
  });

  it('drags a still player along at the full speed of the one who moves', () => {
    const steps = 20;
    const state = stepMany(twoPlayersAtRopeLength(), new Map([['b', walk(1)]]), steps);
    expect(playerX(state, 'b')).toBeCloseTo(ROPE_LENGTH + steps * distancePerStep);
    expect(playerX(state, 'a')).toBeCloseTo(steps * distancePerStep);
  });

  it('drags a dropped player the same way as one who let go of the joystick', () => {
    const dropped = stepMany(twoPlayersAtRopeLength(), new Map([['b', walk(1)]]), 5);
    const still = stepMany(
      twoPlayersAtRopeLength(),
      new Map([
        ['a', NO_INPUT],
        ['b', walk(1)],
      ]),
      5,
    );
    expect(dropped.players).toEqual(still.players);
  });

  it('drifts slowly with the three when three push one way and one pushes the other', () => {
    const start = withPlayers(makeRun(['a', 'b', 'c', 'd']), [
      makePlayer({ playerId: 'a', x: 0 }),
      makePlayer({ playerId: 'b', x: 0 }),
      makePlayer({ playerId: 'c', x: 0 }),
      makePlayer({ playerId: 'd', x: 0 }),
    ]);
    const inputs: StepInputs = new Map([
      ['a', walk(1)],
      ['b', walk(1)],
      ['c', walk(1)],
      ['d', walk(-1)],
    ]);
    // The rope pulls moving players back equally (SG-16), so the four's middle only moves by
    // (3 - 1) / 4 = half a step of walking. The rope is taut after 37.5 steps, so measure after that.
    const tautSteps = 60;
    const measuredSteps = 60;
    const taut = stepMany(start, inputs, tautSteps);
    const later = stepMany(taut, inputs, measuredSteps);
    const drift = playerX(later, 'a') - playerX(taut, 'a');
    const fullSpeedDistance = measuredSteps * distancePerStep;
    expect(drift).toBeGreaterThan(0);
    expect(drift).toBeLessThanOrEqual(0.6 * fullSpeedDistance);
    expect(Math.abs(playerX(later, 'd') - playerX(later, 'a'))).toBeLessThanOrEqual(
      ROPE_LENGTH + 1e-6,
    );
  });

  it('never leaves any two players farther apart than the rope length', () => {
    const state = stepMany(
      makeRun(['a', 'b', 'c', 'd']),
      new Map([
        ['a', walk(1)],
        ['b', walk(-1)],
        ['c', { ...NO_INPUT, direction: { x: 0, y: 1 } }],
        ['d', { ...NO_INPUT, direction: { x: 0, y: -1 } }],
      ]),
      200,
    );
    // With more than two players the settling passes in rope.ts can leave a tiny overshoot (below
    // 0.0001 in simulated runs, about 1e-13 here), so allow a little for it.
    const overshootTolerance = 1e-6;
    state.players.forEach((first, firstIndex) => {
      state.players.slice(firstIndex + 1).forEach((second) => {
        expect(distanceBetween(first, second)).toBeLessThanOrEqual(
          ROPE_LENGTH + overshootTolerance,
        );
      });
    });
  });
});
