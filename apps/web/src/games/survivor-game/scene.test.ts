import {
  buildRunStateReport,
  createRun,
  STEPS_PER_STATE_REPORT,
  type RunStateReport,
} from '@local/survivor-game';
import { describe, expect, it } from 'vitest';
import { buildScene, findOwnPlayer } from './scene.js';
import { StateTimeline } from './state-timeline.js';

function stateWith(overrides: Partial<RunStateReport>): RunStateReport {
  return {
    ...buildRunStateReport(createRun({ playerIds: ['Sam', 'Alex'], seed: 1 })),
    ...overrides,
  };
}

function playersAt(sam: number, alex: number, base: RunStateReport): RunStateReport['players'] {
  const [first, second] = base.players;
  if (first === undefined || second === undefined) {
    throw new Error('The test run needs two players');
  }
  return [
    { ...first, x: sam, y: 0 },
    { ...second, x: alex, y: 0 },
  ];
}

const enemy = (id: number, x: number) => ({
  id,
  x,
  y: 0,
});

describe('buildScene', () => {
  const base = stateWith({});
  const before = stateWith({
    stepCount: 10,
    players: playersAt(0, 100, base),
    enemies: [enemy(1, 200)],
  });
  const after = stateWith({
    stepCount: 11,
    players: playersAt(10, 100, base),
    enemies: [enemy(1, 190), enemy(2, 50)],
  });

  it('slides things between the two states by the frame alpha', () => {
    const scene = buildScene({ previous: before, latest: after, alpha: 0.5 }, 'Sam');
    expect(scene.own).toMatchObject({ playerId: 'Sam', x: 5 });
    expect(scene.enemies[0]?.x).toBe(195);
  });

  it('draws a thing that is new in the latest state where it is', () => {
    const scene = buildScene({ previous: before, latest: after, alpha: 0.5 }, 'Sam');
    expect(scene.enemies[1]?.x).toBe(50);
  });

  it('draws the latest state when there is nothing to slide from', () => {
    const scene = buildScene({ previous: null, latest: after, alpha: 1 }, 'Sam');
    expect(scene.own.x).toBe(10);
  });

  it('draws the rope only between players far apart', () => {
    const far = stateWith({ players: playersAt(0, 380, base) });
    expect(buildScene({ previous: null, latest: far, alpha: 1 }, 'Sam').ropes).toHaveLength(1);
    expect(buildScene({ previous: null, latest: after, alpha: 1 }, 'Sam').ropes).toHaveLength(0);
  });

  it('fails loudly when the own player is not in the run', () => {
    expect(() => buildScene({ previous: null, latest: after, alpha: 1 }, 'Kim')).toThrow(
      "Player 'Kim' is not a character in this run",
    );
    expect(() => findOwnPlayer(after, 'Kim')).toThrow('not a character');
  });
});

describe('StateTimeline', () => {
  const base = stateWith({});
  const at = (stepCount: number) => ({ ...base, stepCount });

  it('has no frame before the first state', () => {
    expect(new StateTimeline().frameAt(0)).toBeNull();
  });

  it('shows the first state as it is', () => {
    const timeline = new StateTimeline();
    timeline.push(at(1), 1000);
    expect(timeline.frameAt(1010)).toMatchObject({ previous: null, alpha: 1 });
    expect(timeline.latestState?.stepCount).toBe(1);
  });

  it('slides from the previous state to the latest over one step of time', () => {
    const timeline = new StateTimeline();
    timeline.push(at(1), 1000);
    timeline.push(at(2), 1033);
    const midway = timeline.frameAt(1033 + 1000 / 60);
    expect(midway?.previous?.stepCount).toBe(1);
    expect(midway?.alpha).toBeCloseTo(0.5);
    expect(timeline.frameAt(1033 + 500)?.alpha).toBe(1);
    expect(timeline.frameAt(1000)?.alpha).toBe(0);
  });

  it('slides over two steps of time when the server reports every second step', () => {
    const timeline = new StateTimeline();
    timeline.push(at(2), 1000);
    timeline.push(at(2 + STEPS_PER_STATE_REPORT), 1067);
    expect(timeline.frameAt(1067 + 1000 / 30)?.alpha).toBeCloseTo(0.5);
    expect(timeline.frameAt(1067 + 1000 / 15)?.alpha).toBe(1);
  });

  it('does not slide across a jump of many steps, such as after a reconnect', () => {
    const timeline = new StateTimeline();
    timeline.push(at(1), 1000);
    timeline.push(at(300), 5000);
    expect(timeline.frameAt(5001)).toMatchObject({ previous: null, alpha: 1 });
  });
});
