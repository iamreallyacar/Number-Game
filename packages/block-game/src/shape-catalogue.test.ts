import { describe, expect, it } from 'vitest';
import {
  getShape,
  isShapeId,
  SHAPE_CATALOGUE,
  SHAPE_IDS,
  type ShapeId,
} from './shape-catalogue.js';

function cellsAsText(shapeId: ShapeId): string {
  return getShape(shapeId)
    .cells.map((cell) => `${String(cell.rowOffset)},${String(cell.columnOffset)}`)
    .join(' ');
}

describe('shape catalogue', () => {
  it('gives every shape its own id', () => {
    expect(new Set(SHAPE_IDS).size).toBe(SHAPE_CATALOGUE.length);
  });

  it('never lists the same cells twice', () => {
    const cellSets = SHAPE_IDS.map(cellsAsText);
    expect(new Set(cellSets).size).toBe(SHAPE_IDS.length);
  });

  it('keeps every shape inside a tight bounding box of at most 3 x 3', () => {
    for (const shape of SHAPE_CATALOGUE) {
      expect(shape.height).toBeGreaterThanOrEqual(1);
      expect(shape.height).toBeLessThanOrEqual(3);
      expect(shape.width).toBeGreaterThanOrEqual(1);
      expect(shape.width).toBeLessThanOrEqual(3);
      const rows = new Set(shape.cells.map((cell) => cell.rowOffset));
      const columns = new Set(shape.cells.map((cell) => cell.columnOffset));
      expect(rows.size).toBe(shape.height);
      expect(columns.size).toBe(shape.width);
      expect(Math.min(...rows)).toBe(0);
      expect(Math.min(...columns)).toBe(0);
    }
  });

  it('turns a text pattern into cells counted from the top-left', () => {
    expect(getShape('t-up')).toMatchObject({
      height: 2,
      width: 3,
      cells: [
        { rowOffset: 0, columnOffset: 1 },
        { rowOffset: 1, columnOffset: 0 },
        { rowOffset: 1, columnOffset: 1 },
        { rowOffset: 1, columnOffset: 2 },
      ],
    });
  });

  it.each([
    { kind: 'single cell', ids: ['single'], cellCount: 1 },
    { kind: '2 cell lines', ids: ['line-2-horizontal', 'line-2-vertical'], cellCount: 2 },
    { kind: '3 cell lines', ids: ['line-3-horizontal', 'line-3-vertical'], cellCount: 3 },
    { kind: 'squares', ids: ['square-2'], cellCount: 4 },
    { kind: 'big square', ids: ['square-3'], cellCount: 9 },
    { kind: 'rectangles', ids: ['rectangle-3-wide', 'rectangle-3-tall'], cellCount: 6 },
    {
      kind: 'small corners',
      ids: SHAPE_IDS.filter((id) => id.startsWith('corner-small-')),
      cellCount: 3,
    },
    {
      kind: 'big corners',
      ids: SHAPE_IDS.filter((id) => id.startsWith('corner-big-')),
      cellCount: 5,
    },
    { kind: 'L shapes', ids: SHAPE_IDS.filter((id) => id.startsWith('l-')), cellCount: 4 },
    { kind: 'T shapes', ids: SHAPE_IDS.filter((id) => id.startsWith('t-')), cellCount: 4 },
    { kind: 'S and Z shapes', ids: ['s-wide', 's-tall', 'z-wide', 'z-tall'], cellCount: 4 },
    { kind: '2 cell diagonals', ids: ['diagonal-2-down', 'diagonal-2-up'], cellCount: 2 },
    { kind: '3 cell diagonals', ids: ['diagonal-3-down', 'diagonal-3-up'], cellCount: 3 },
    { kind: 'plus', ids: ['plus'], cellCount: 5 },
  ])('has the $kind', ({ ids, cellCount }) => {
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(isShapeId(id)).toBe(true);
      if (isShapeId(id)) {
        expect(getShape(id).cells).toHaveLength(cellCount);
      }
    }
  });

  it('has every orientation of the corners, L shapes, and T shapes', () => {
    const countWithPrefix = (prefix: string): number =>
      SHAPE_IDS.filter((id) => id.startsWith(prefix)).length;
    expect(countWithPrefix('corner-small-')).toBe(4);
    expect(countWithPrefix('corner-big-')).toBe(4);
    expect(countWithPrefix('l-')).toBe(8);
    expect(countWithPrefix('t-')).toBe(4);
  });

  it('makes awkward shapes rarer than small common ones', () => {
    const awkwardIds: ShapeId[] = [
      'square-3',
      'diagonal-2-down',
      'diagonal-3-up',
      'corner-big-top-left',
    ];
    const commonIds: ShapeId[] = ['single', 'line-2-horizontal', 'line-3-vertical', 'square-2'];
    const highestAwkwardWeight = Math.max(...awkwardIds.map((id) => getShape(id).weight));
    const lowestCommonWeight = Math.min(...commonIds.map((id) => getShape(id).weight));
    expect(highestAwkwardWeight).toBeLessThan(lowestCommonWeight);
  });

  it('only recognises catalogue ids', () => {
    expect(isShapeId('square-2')).toBe(true);
    expect(isShapeId('square-4')).toBe(false);
    expect(isShapeId(2)).toBe(false);
  });
});
