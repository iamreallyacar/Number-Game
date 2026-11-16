import { describe, expect, it } from 'vitest';
import { findVisibleRopes } from './visible-ropes.js';

describe('findVisibleRopes', () => {
  it('draws no rope at or below the warning distance of 320', () => {
    expect(
      findVisibleRopes([
        { x: 0, y: 0 },
        { x: 320, y: 0 },
      ]),
    ).toEqual([]);
    expect(findVisibleRopes([{ x: 0, y: 0 }])).toEqual([]);
  });

  it('draws the rope past the warning distance, with the strain growing to 1', () => {
    const [rope] = findVisibleRopes([
      { x: 0, y: 0 },
      { x: 360, y: 0 },
    ]);
    expect(rope?.strain).toBeCloseTo(0.5);
    const [full] = findVisibleRopes([
      { x: 0, y: 0 },
      { x: 0, y: 400 },
    ]);
    expect(full?.strain).toBe(1);
  });

  it('looks at every pair of players', () => {
    const ropes = findVisibleRopes([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 430, y: 0 },
    ]);
    expect(ropes.map((rope) => [rope.from.x, rope.to.x])).toEqual([
      [0, 430],
      [100, 430],
    ]);
  });
});
