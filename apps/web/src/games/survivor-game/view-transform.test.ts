import { balance } from '@local/survivor-game';
import { describe, expect, it } from 'vitest';
import {
  computeViewTransform,
  gridLinePositions,
  visibleWorldBounds,
  worldToScreen,
} from './view-transform.js';

const ORIGIN = { x: 0, y: 0 };

describe('computeViewTransform', () => {
  it('shows 480 units along the short side of a tall phone', () => {
    const view = computeViewTransform({ width: 360, height: 640 }, ORIGIN);
    expect(view.scale).toBeCloseTo(360 / 480);
    expect(view.viewWidth).toBe(360);
    expect(view.viewHeight).toBe(640);
    expect(view.viewTop).toBe(0);
    expect(view.viewLeft).toBe(0);
  });

  it('shows 480 units along the short side of a wide screen', () => {
    const view = computeViewTransform({ width: 800, height: 480 }, ORIGIN);
    expect(view.scale).toBe(1);
    expect(view.viewWidth).toBe(800);
    expect(view.viewHeight).toBe(480);
  });

  it('shows the same amount of arena at every pixel ratio', () => {
    const small = visibleWorldBounds(computeViewTransform({ width: 360, height: 640 }, ORIGIN));
    const big = visibleWorldBounds(computeViewTransform({ width: 720, height: 1280 }, ORIGIN));
    expect(big.maxX - big.minX).toBeCloseTo(small.maxX - small.minX);
    expect(big.maxY - big.minY).toBeCloseTo(small.maxY - small.minY);
  });

  it('adds bars to a screen longer than 1040 units, on both ends', () => {
    const view = computeViewTransform({ width: 480, height: 2000 }, ORIGIN);
    expect(view.viewHeight).toBe(balance.VIEW_LONG_SIDE_MAX);
    expect(view.viewTop).toBe((2000 - balance.VIEW_LONG_SIDE_MAX) / 2);
    const wide = computeViewTransform({ width: 3000, height: 480 }, ORIGIN);
    expect(wide.viewWidth).toBe(balance.VIEW_LONG_SIDE_MAX);
    expect(wide.viewLeft).toBe((3000 - balance.VIEW_LONG_SIDE_MAX) / 2);
  });

  it('treats a square screen as tall', () => {
    const view = computeViewTransform({ width: 500, height: 500 }, ORIGIN);
    expect(view.viewWidth).toBe(500);
    expect(view.viewHeight).toBe(500);
  });
});

describe('worldToScreen', () => {
  it('puts the camera in the middle of the view', () => {
    const view = computeViewTransform({ width: 800, height: 480 }, { x: 100, y: -50 });
    expect(worldToScreen(view, { x: 100, y: -50 })).toEqual({ x: 400, y: 240 });
  });

  it('moves a point by the scale for each world unit', () => {
    const view = computeViewTransform({ width: 960, height: 960 }, { x: 0, y: 0 });
    expect(view.scale).toBe(2);
    expect(worldToScreen(view, { x: 10, y: -5 })).toEqual({ x: 500, y: 470 });
  });

  it('keeps the middle of the view in the middle of a screen with bars', () => {
    const view = computeViewTransform({ width: 480, height: 2000 }, ORIGIN);
    expect(worldToScreen(view, ORIGIN)).toEqual({ x: 240, y: 1000 });
  });
});

describe('gridLinePositions', () => {
  it('lists the multiples of the spacing inside the range', () => {
    expect(gridLinePositions(-130, 90, 80)).toEqual([-80, 0, 80]);
  });

  it('includes a line on the edge', () => {
    expect(gridLinePositions(80, 160, 80)).toEqual([80, 160]);
  });
});
