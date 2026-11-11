import { describe, expect, it } from 'vitest';
import { applyHint } from './hint.js';
import { applyDiskMove } from './move-disk.js';
import { applyMove } from './move.js';
import { expectAccepted, makeTestState } from './test-support.js';
import { applyUndo } from './undo.js';

describe('applyMove', () => {
  it('sends each move to its rule', () => {
    const state = makeTestState();
    const diskMove = { fromPeg: 1, toPeg: 2 };
    const moved = expectAccepted(applyMove(state, { type: 'move-disk', ...diskMove }));
    expect(moved.state).toEqual(expectAccepted(applyDiskMove(state, diskMove)).state);
    expect(expectAccepted(applyMove(moved.state, { type: 'undo' })).state).toEqual(
      expectAccepted(applyUndo(moved.state)).state,
    );
    expect(expectAccepted(applyMove(state, { type: 'hint' })).state).toEqual(
      expectAccepted(applyHint(state)).state,
    );
  });

  it('passes on why a move was refused', () => {
    expect(applyMove(makeTestState(), { type: 'undo' })).toEqual({
      accepted: false,
      reason: 'nothing-to-undo',
    });
  });
});
