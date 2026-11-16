import { describe, expect, it } from 'vitest';
import {
  endRunAsAbandoned,
  endRunIfDefeated,
  isRunOver,
  RunAlreadyEndedError,
} from './end-of-run.js';
import { makeRun } from './test-support.js';

describe('end of run', () => {
  it('ends in defeat when the health reaches 0 (SG-48)', () => {
    expect(endRunIfDefeated({ ...makeRun(), teamHealth: 0 }).endReason).toBe('defeat');
    expect(endRunIfDefeated({ ...makeRun(), teamHealth: 1 }).endReason).toBeNull();
  });

  it('ends as abandoned when the server says nobody was connected (SG-47)', () => {
    const ended = endRunAsAbandoned(makeRun());
    expect(ended.endReason).toBe('abandoned');
    expect(isRunOver(ended)).toBe(true);
    expect(isRunOver(makeRun())).toBe(false);
  });

  it('does not end a run twice', () => {
    expect(() => endRunAsAbandoned(endRunAsAbandoned(makeRun()))).toThrow(RunAlreadyEndedError);
  });
});
