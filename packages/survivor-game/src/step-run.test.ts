import { describe, expect, it } from 'vitest';
import {
  ENEMY_RADIUS,
  ENEMY_TOUCH_DAMAGE,
  PLAYER_RADIUS,
  STEP_RATE,
  TEAM_HEALTH,
} from './balance.js';
import { RunAlreadyEndedError } from './end-of-run.js';
import { enemyLimitFor } from './enemy-spawning.js';
import { experienceNeededAt } from './experience.js';
import { InvalidStepInputError, NO_INPUT, type StepInputs } from './player-input.js';
import type { Enemy, RunState } from './run-state.js';
import { stepRun } from './step-run.js';
import { makeEnemy, makePlayer, makeRun, withPlayers } from './test-support.js';
import { UpgradeChoiceRefusedError } from './upgrade-choice.js';

const noInputs: StepInputs = new Map();

function stepMany(
  state: RunState,
  inputsOf: (step: number) => StepInputs,
  steps: number,
): RunState {
  let current = state;
  for (let step = 0; step < steps; step += 1) {
    current = stepRun(current, inputsOf(step));
  }
  return current;
}

function oneStepFrom(state: RunState, enemy: Enemy): RunState {
  return stepRun({ ...state, enemies: [enemy] }, noInputs);
}

describe('stepRun time', () => {
  it('advances time by one step', () => {
    expect(stepRun(makeRun(), noInputs).stepCount).toBe(1);
    expect(stepMany(makeRun(), () => noInputs, STEP_RATE).stepCount).toBe(STEP_RATE);
  });

  it('does not change the state it was given', () => {
    const state = makeRun(['a', 'b'], 4);
    const copy: unknown = JSON.parse(JSON.stringify(state));
    stepRun(state, new Map([['a', { ...NO_INPUT, direction: { x: 1, y: 0 } }]]));
    expect(state).toEqual(copy);
  });
});

describe('determinism', () => {
  const inputsOf = (step: number): StepInputs =>
    new Map([
      ['a', { ...NO_INPUT, direction: { x: Math.cos(step / 10), y: Math.sin(step / 10) } }],
      ['b', step % 50 < 25 ? { ...NO_INPUT, direction: { x: 1, y: 0 } } : NO_INPUT],
    ]);

  it('gives the same state for the same seed and inputs', () => {
    const first = stepMany(makeRun(['a', 'b'], 99), inputsOf, 600);
    const second = stepMany(makeRun(['a', 'b'], 99), inputsOf, 600);
    expect(second).toEqual(first);
    expect(first.enemies.length).toBeGreaterThan(0);
  });

  it('gives another state for another seed', () => {
    const first = stepMany(makeRun(['a', 'b'], 99), inputsOf, 600);
    expect(stepMany(makeRun(['a', 'b'], 100), inputsOf, 600)).not.toEqual(first);
  });

  it('keeps the state plain data that survives JSON', () => {
    const state = stepMany(makeRun(['a', 'b'], 5), inputsOf, 300);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});

describe('a still or dropped player', () => {
  it('stands still but keeps attacking on its own (SG-44)', () => {
    const state = withPlayers(makeRun(), [makePlayer({ playerId: 'amy' })]);
    const next = stepRun({ ...state, enemies: [makeEnemy({ x: 200 })] }, noInputs);
    expect(next.players[0]).toMatchObject({ x: 0, y: 0 });
    expect(next.bullets).toHaveLength(1);
  });

  it('collects offers while away (SG-46)', () => {
    const state = withPlayers(makeRun(), [
      makePlayer({ openOffer: ['damage'], waitingOfferCount: 0 }),
    ]);
    const needed = experienceNeededAt(1);
    const beaten = Array.from({ length: needed }, (_, index) =>
      makeEnemy({ id: index, health: 0 }),
    );
    const next = stepRun({ ...state, enemies: beaten }, noInputs);
    expect(next.players[0]?.waitingOfferCount).toBe(1);
    expect(next.players[0]?.openOffer).toEqual(['damage']);
  });
});

describe('beating enemies', () => {
  it('adds points and experience of a beaten enemy to the team at once (SG-26, SG-34)', () => {
    const next = oneStepFrom(makeRun(), makeEnemy({ health: 0, points: 14 }));
    expect(next.score).toBe(14);
    expect(next.teamExperience).toBe(1);
    expect(next.enemies.find((enemy) => enemy.id === 100)).toBeUndefined();
  });

  it('beats an enemy with a bullet over several steps', () => {
    let state: RunState = { ...makeRun(), enemies: [makeEnemy({ x: 150, health: 10, points: 7 })] };
    state = withPlayers(state, [makePlayer()]);
    state = stepMany(state, () => noInputs, STEP_RATE);
    expect(state.score).toBe(7);
  });

  it('levels up and gives every player an offer (SG-35, SG-36)', () => {
    const state = makeRun(['a', 'b']);
    const beaten = Array.from({ length: experienceNeededAt(1) + 1 }, (_, index) =>
      makeEnemy({ id: index, health: 0 }),
    );
    const next = stepRun({ ...state, enemies: beaten }, noInputs);
    expect(next.teamLevel).toBe(2);
    expect(next.teamExperience).toBe(1);
    for (const player of next.players) {
      expect(player.openOffer).toHaveLength(3);
    }
  });

  it('queues the offers when the team levels up before a player chose (SG-37)', () => {
    let state = makeRun(['a']);
    for (let level = 0; level < 3; level += 1) {
      const beaten = Array.from({ length: experienceNeededAt(state.teamLevel) }, (_, index) =>
        makeEnemy({ id: 1000 * level + index, health: 0 }),
      );
      state = stepRun({ ...state, enemies: beaten }, noInputs);
    }
    expect(state.teamLevel).toBe(4);
    expect(state.players[0]?.openOffer).toHaveLength(3);
    expect(state.players[0]?.waitingOfferCount).toBe(2);
  });

  it('opens the next queued offer after a choice in the same run (SG-37)', () => {
    let state = makeRun(['a']);
    for (let level = 0; level < 2; level += 1) {
      const beaten = Array.from({ length: experienceNeededAt(state.teamLevel) }, (_, index) =>
        makeEnemy({ id: 1000 * level + index, health: 0 }),
      );
      state = stepRun({ ...state, enemies: beaten }, noInputs);
    }
    const choice = state.players[0]?.openOffer?.[0];
    expect(choice).toBeDefined();
    const next = stepRun(state, new Map([['a', { ...NO_INPUT, upgradeChoice: choice ?? null }]]));
    expect(next.players[0]?.waitingOfferCount).toBe(0);
    expect(next.players[0]?.openOffer).toHaveLength(3);
  });
});

describe('enemies in a step', () => {
  it('removes an enemy far from every player and gives nothing for it (SG-31)', () => {
    const far = makeEnemy({ x: 5000, y: 0, health: 1 });
    const next = oneStepFrom(makeRun(), far);
    expect(next.enemies.find((enemy) => enemy.id === far.id)).toBeUndefined();
    expect(next.score).toBe(0);
    expect(next.teamExperience).toBe(0);
  });

  it('never has more enemies alive than the limit (SG-30)', () => {
    const state = makeRun(['a', 'b']);
    const crowd = Array.from({ length: enemyLimitFor(2) }, (_, index) =>
      makeEnemy({ id: index, x: 300 + (index % 20), y: 40 * Math.floor(index / 20) }),
    );
    const next = stepRun({ ...state, enemies: crowd, enemySpawnCarry: 5 }, noInputs);
    expect(next.enemies.length).toBeLessThanOrEqual(enemyLimitFor(2));
    expect(next.enemies).toHaveLength(enemyLimitFor(2));
  });

  it('takes touch damage off the shared health and ends the run at 0 (SG-32, SG-48)', () => {
    const touching = makeEnemy({ x: PLAYER_RADIUS + ENEMY_RADIUS - 1, health: 1000 });
    const next = oneStepFrom(makeRun(), touching);
    expect(next.teamHealth).toBe(TEAM_HEALTH - ENEMY_TOUCH_DAMAGE);
    expect(next.endReason).toBeNull();
    const dying = stepRun(
      { ...makeRun(), teamHealth: ENEMY_TOUCH_DAMAGE, enemies: [touching] },
      noInputs,
    );
    expect(dying.teamHealth).toBe(0);
    expect(dying.endReason).toBe('defeat');
  });

  it('does not refill health on its own (SG-32)', () => {
    const next = stepMany({ ...makeRun(), teamHealth: 40 }, () => noInputs, 100);
    expect(next.teamHealth).toBeLessThanOrEqual(40);
  });
});

describe('refused input', () => {
  it('refuses an upgrade choice that is not in the offer, and changes nothing', () => {
    const state = withPlayers(makeRun(), [makePlayer({ openOffer: ['damage', 'healing'] })]);
    const inputs = new Map([['amy', { ...NO_INPUT, upgradeChoice: 'piercing' as const }]]);
    expect(() => stepRun(state, inputs)).toThrow(UpgradeChoiceRefusedError);
  });

  it('refuses a choice when no offer is open', () => {
    const inputs = new Map([['amy', { ...NO_INPUT, upgradeChoice: 'damage' as const }]]);
    expect(() => stepRun(makeRun(), inputs)).toThrow(UpgradeChoiceRefusedError);
  });

  it('refuses an input of a player who is not in the run', () => {
    expect(() => stepRun(makeRun(), new Map([['zed', NO_INPUT]]))).toThrow(InvalidStepInputError);
  });

  it('refuses a direction that is not a number', () => {
    const inputs = new Map([['amy', { ...NO_INPUT, direction: { x: Number.NaN, y: 0 } }]]);
    expect(() => stepRun(makeRun(), inputs)).toThrow(InvalidStepInputError);
  });

  it('skips a choice that another player made impossible in the same step', () => {
    const limit = 6;
    const base = withPlayers(makeRun(['a', 'b']), [
      makePlayer({ playerId: 'a', openOffer: ['movement-speed', 'damage', 'healing'] }),
      makePlayer({ playerId: 'b', openOffer: ['movement-speed', 'piercing', 'healing'] }),
    ]);
    const state = { ...base, teamUpgradeCounts: { 'movement-speed': limit - 1, healing: 0 } };
    const next = stepRun(
      state,
      new Map([
        ['a', { ...NO_INPUT, upgradeChoice: 'movement-speed' as const }],
        ['b', { ...NO_INPUT, upgradeChoice: 'movement-speed' as const }],
      ]),
    );
    expect(next.teamUpgradeCounts['movement-speed']).toBe(limit);
    expect(next.players[1]?.openOffer).not.toContain('movement-speed');
  });

  it('refuses to step a run that has ended', () => {
    expect(() => stepRun({ ...makeRun(), endReason: 'defeat' }, noInputs)).toThrow(
      RunAlreadyEndedError,
    );
  });
});
