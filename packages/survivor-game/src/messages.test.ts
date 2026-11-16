import { describe, expect, it } from 'vitest';
import { InvalidMessageError } from './read-message-fields.js';
import { parseClientMessage } from './parse-client-message.js';
import { parseRunStateReport } from './parse-state-report.js';
import { buildRunStateReport } from './state-report.js';
import { parseServerMessage } from './parse-server-message.js';
import { stepRun } from './step-run.js';
import { summarizeRun } from './summary.js';
import { makeEnemy, makeRun } from './test-support.js';
import type { RunState } from './run-state.js';

function busyRun(): RunState {
  let state: RunState = { ...makeRun(['a', 'b']), enemies: [makeEnemy({ x: 150 })] };
  for (let step = 0; step < 10; step += 1) {
    state = stepRun(state, new Map());
  }
  return state;
}

describe('parseClientMessage', () => {
  it.each([
    { type: 'set-direction', direction: { x: 1, y: -0.5 } },
    { type: 'set-direction', direction: null },
    { type: 'choose-upgrade', upgradeId: 'damage' },
  ])('accepts %j', (message) => {
    expect(parseClientMessage(JSON.parse(JSON.stringify(message)))).toEqual(message);
  });

  it.each([
    { problem: 'text', value: 'hello' },
    { problem: 'an unknown type', value: { type: 'cheat', score: 9 } },
    {
      problem: 'a direction with text',
      value: { type: 'set-direction', direction: { x: '1', y: 0 } },
    },
    {
      problem: 'a direction too big to normalise',
      value: { type: 'set-direction', direction: { x: 1e200, y: 0 } },
    },
    {
      problem: 'a direction whose size is just past the bound',
      value: { type: 'set-direction', direction: { x: 0, y: -1000.5 } },
    },
    { problem: 'a missing direction', value: { type: 'set-direction' } },
    { problem: 'an extra field', value: { type: 'set-direction', direction: null, speed: 99 } },
    { problem: 'an unknown upgrade', value: { type: 'choose-upgrade', upgradeId: 'god-mode' } },
  ])('refuses $problem', ({ value }) => {
    expect(() => parseClientMessage(value)).toThrow(InvalidMessageError);
  });
});

describe('parseServerMessage', () => {
  it('reads back a state report', () => {
    const message = { type: 'state', state: buildRunStateReport(busyRun()) } as const;
    expect(parseServerMessage(JSON.parse(JSON.stringify(message)))).toEqual(message);
  });

  it('reads back the end of a run', () => {
    const state = { ...busyRun(), endReason: 'defeat' } as const;
    const message = {
      type: 'run-ended',
      reason: 'defeat',
      state: buildRunStateReport(state),
      summary: summarizeRun(state),
    } as const;
    expect(parseServerMessage(JSON.parse(JSON.stringify(message)))).toEqual(message);
  });

  it('reads back a refused message', () => {
    const message = { type: 'message-refused', reason: 'not-in-offer', message: 'No' } as const;
    expect(parseServerMessage(message)).toEqual(message);
  });

  it('refuses a state that is broken', () => {
    const report = buildRunStateReport(busyRun());
    const state = { ...report, score: 'lots' };
    expect(() => parseServerMessage({ type: 'state', state })).toThrow(InvalidMessageError);
    expect(() => parseRunStateReport({ ...report, extra: 1 })).toThrow(InvalidMessageError);
    expect(() => parseRunStateReport(busyRun())).toThrow(InvalidMessageError);
  });

  it('refuses an unknown type', () => {
    expect(() => parseServerMessage({ type: 'hello' })).toThrow(InvalidMessageError);
  });
});
