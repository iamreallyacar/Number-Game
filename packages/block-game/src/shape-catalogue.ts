import type { ShapeColour } from './board-cell.js';

/** Position of one block inside a shape, counted from the top-left corner of its bounding box. */
export interface ShapeCell {
  readonly rowOffset: number;
  readonly columnOffset: number;
}

/** One entry of the shape catalogue, in the fixed orientation it is dealt in (BG-08, BG-09). */
export interface BlockShape {
  readonly id: ShapeId;
  readonly cells: readonly ShapeCell[];
  /** Rows of the bounding box, from 1 to 5. */
  readonly height: number;
  /** Columns of the bounding box, from 1 to 5. */
  readonly width: number;
  readonly colour: ShapeColour;
  /** Chance of being dealt at the start of a game, relative to the other shapes. A whole number of 1 or more. */
  readonly startingWeight: number;
  /** Chance of being dealt once the weights have finished moving (BG-10). A whole number of 1 or more. */
  readonly lateWeight: number;
}

interface ShapeDefinition {
  readonly id: string;
  /** Rows of the bounding box written as text, where '#' is a block and '.' is a gap. */
  readonly pattern: readonly string[];
  readonly colour: ShapeColour;
  readonly startingWeight: number;
  readonly lateWeight: number;
}

// Every shape the game can deal, each orientation as its own entry. The two weights are the one
// place to tune how often each shape appears (BG-09, BG-10): a game starts on the starting weights
// and moves to the late weights over the first placements.
// Ids are stored in saved games, so never rename or remove one that has shipped.
const SHAPE_DEFINITIONS = [
  { id: 'single', pattern: ['#'], colour: 0, startingWeight: 4, lateWeight: 1 },

  { id: 'line-2-horizontal', pattern: ['##'], colour: 1, startingWeight: 5, lateWeight: 1 },
  { id: 'line-2-vertical', pattern: ['#', '#'], colour: 1, startingWeight: 5, lateWeight: 1 },
  { id: 'line-3-horizontal', pattern: ['###'], colour: 2, startingWeight: 5, lateWeight: 2 },
  { id: 'line-3-vertical', pattern: ['#', '#', '#'], colour: 2, startingWeight: 5, lateWeight: 2 },

  { id: 'line-4-horizontal', pattern: ['####'], colour: 3, startingWeight: 2, lateWeight: 3 },
  {
    id: 'line-4-vertical',
    pattern: ['#', '#', '#', '#'],
    colour: 3,
    startingWeight: 2,
    lateWeight: 3,
  },
  { id: 'line-5-horizontal', pattern: ['#####'], colour: 5, startingWeight: 1, lateWeight: 4 },
  {
    id: 'line-5-vertical',
    pattern: ['#', '#', '#', '#', '#'],
    colour: 5,
    startingWeight: 1,
    lateWeight: 4,
  },

  { id: 'square-2', pattern: ['##', '##'], colour: 3, startingWeight: 6, lateWeight: 2 },
  { id: 'square-3', pattern: ['###', '###', '###'], colour: 4, startingWeight: 1, lateWeight: 4 },
  {
    id: 'square-4',
    pattern: ['####', '####', '####', '####'],
    colour: 4,
    startingWeight: 1,
    lateWeight: 3,
  },
  { id: 'rectangle-3-wide', pattern: ['###', '###'], colour: 5, startingWeight: 2, lateWeight: 4 },
  {
    id: 'rectangle-3-tall',
    pattern: ['##', '##', '##'],
    colour: 5,
    startingWeight: 2,
    lateWeight: 4,
  },

  {
    id: 'corner-small-top-left',
    pattern: ['##', '#.'],
    colour: 6,
    startingWeight: 4,
    lateWeight: 1,
  },
  {
    id: 'corner-small-top-right',
    pattern: ['##', '.#'],
    colour: 6,
    startingWeight: 4,
    lateWeight: 1,
  },
  {
    id: 'corner-small-bottom-left',
    pattern: ['#.', '##'],
    colour: 6,
    startingWeight: 4,
    lateWeight: 1,
  },
  {
    id: 'corner-small-bottom-right',
    pattern: ['.#', '##'],
    colour: 6,
    startingWeight: 4,
    lateWeight: 1,
  },

  {
    id: 'corner-big-top-left',
    pattern: ['###', '#..', '#..'],
    colour: 4,
    startingWeight: 1,
    lateWeight: 4,
  },
  {
    id: 'corner-big-top-right',
    pattern: ['###', '..#', '..#'],
    colour: 4,
    startingWeight: 1,
    lateWeight: 4,
  },
  {
    id: 'corner-big-bottom-left',
    pattern: ['#..', '#..', '###'],
    colour: 4,
    startingWeight: 1,
    lateWeight: 4,
  },
  {
    id: 'corner-big-bottom-right',
    pattern: ['..#', '..#', '###'],
    colour: 4,
    startingWeight: 1,
    lateWeight: 4,
  },

  // The L names say where the long arm is and which way its foot points.
  {
    id: 'l-tall-left-foot-right',
    pattern: ['#.', '#.', '##'],
    colour: 7,
    startingWeight: 2,
    lateWeight: 2,
  },
  {
    id: 'l-tall-right-foot-left',
    pattern: ['.#', '.#', '##'],
    colour: 7,
    startingWeight: 2,
    lateWeight: 2,
  },
  {
    id: 'l-tall-left-top-right',
    pattern: ['##', '#.', '#.'],
    colour: 7,
    startingWeight: 2,
    lateWeight: 2,
  },
  {
    id: 'l-tall-right-top-left',
    pattern: ['##', '.#', '.#'],
    colour: 7,
    startingWeight: 2,
    lateWeight: 2,
  },
  {
    id: 'l-wide-top-foot-left',
    pattern: ['###', '#..'],
    colour: 7,
    startingWeight: 2,
    lateWeight: 2,
  },
  {
    id: 'l-wide-top-foot-right',
    pattern: ['###', '..#'],
    colour: 7,
    startingWeight: 2,
    lateWeight: 2,
  },
  {
    id: 'l-wide-bottom-foot-left',
    pattern: ['#..', '###'],
    colour: 7,
    startingWeight: 2,
    lateWeight: 2,
  },
  {
    id: 'l-wide-bottom-foot-right',
    pattern: ['..#', '###'],
    colour: 7,
    startingWeight: 2,
    lateWeight: 2,
  },

  // The T names say which way the middle bump points.
  { id: 't-up', pattern: ['.#.', '###'], colour: 0, startingWeight: 2, lateWeight: 2 },
  { id: 't-down', pattern: ['###', '.#.'], colour: 0, startingWeight: 2, lateWeight: 2 },
  { id: 't-left', pattern: ['.#', '##', '.#'], colour: 0, startingWeight: 2, lateWeight: 2 },
  { id: 't-right', pattern: ['#.', '##', '#.'], colour: 0, startingWeight: 2, lateWeight: 2 },

  // The big T names say which way the stem points.
  { id: 't-big-down', pattern: ['###', '.#.', '.#.'], colour: 0, startingWeight: 1, lateWeight: 3 },
  { id: 't-big-up', pattern: ['.#.', '.#.', '###'], colour: 0, startingWeight: 1, lateWeight: 3 },
  {
    id: 't-big-right',
    pattern: ['#..', '###', '#..'],
    colour: 0,
    startingWeight: 1,
    lateWeight: 3,
  },
  { id: 't-big-left', pattern: ['..#', '###', '..#'], colour: 0, startingWeight: 1, lateWeight: 3 },

  // The U names say which way the opening faces.
  { id: 'u-open-up', pattern: ['#.#', '###'], colour: 6, startingWeight: 1, lateWeight: 3 },
  { id: 'u-open-down', pattern: ['###', '#.#'], colour: 6, startingWeight: 1, lateWeight: 3 },
  { id: 'u-open-right', pattern: ['##', '#.', '##'], colour: 6, startingWeight: 1, lateWeight: 3 },
  { id: 'u-open-left', pattern: ['##', '.#', '##'], colour: 6, startingWeight: 1, lateWeight: 3 },

  { id: 's-wide', pattern: ['.##', '##.'], colour: 1, startingWeight: 2, lateWeight: 3 },
  { id: 's-tall', pattern: ['#.', '##', '.#'], colour: 1, startingWeight: 2, lateWeight: 3 },
  { id: 'z-wide', pattern: ['##.', '.##'], colour: 2, startingWeight: 2, lateWeight: 3 },
  { id: 'z-tall', pattern: ['.#', '##', '#.'], colour: 2, startingWeight: 2, lateWeight: 3 },

  // Down diagonals run from the top-left to the bottom-right, up diagonals the other way.
  { id: 'diagonal-2-down', pattern: ['#.', '.#'], colour: 3, startingWeight: 1, lateWeight: 2 },
  { id: 'diagonal-2-up', pattern: ['.#', '#.'], colour: 3, startingWeight: 1, lateWeight: 2 },
  {
    id: 'diagonal-3-down',
    pattern: ['#..', '.#.', '..#'],
    colour: 3,
    startingWeight: 1,
    lateWeight: 4,
  },
  {
    id: 'diagonal-3-up',
    pattern: ['..#', '.#.', '#..'],
    colour: 3,
    startingWeight: 1,
    lateWeight: 4,
  },

  { id: 'plus', pattern: ['.#.', '###', '.#.'], colour: 5, startingWeight: 1, lateWeight: 4 },
] as const satisfies readonly ShapeDefinition[];

export type ShapeId = (typeof SHAPE_DEFINITIONS)[number]['id'];

const MAX_SHAPE_SIDE = 5;

function failDefinition(id: string, problem: string): never {
  throw new Error(`Shape '${id}' in the catalogue is invalid: ${problem}`);
}

/** Turns a text pattern into cells, and checks that its bounding box is tight and at most 5 x 5. */
function buildShape(definition: ShapeDefinition & { readonly id: ShapeId }): BlockShape {
  const { id, pattern } = definition;
  const height = pattern.length;
  const width = pattern[0]?.length ?? 0;
  if (height < 1 || height > MAX_SHAPE_SIDE || width < 1 || width > MAX_SHAPE_SIDE) {
    failDefinition(id, 'the pattern must be 1 to 5 rows of 1 to 5 characters');
  }
  const cells: ShapeCell[] = [];
  for (const [rowOffset, patternRow] of pattern.entries()) {
    if (patternRow.length !== width) {
      failDefinition(id, 'every pattern row must have the same length');
    }
    for (const [columnOffset, character] of Array.from(patternRow).entries()) {
      if (character === '#') {
        cells.push({ rowOffset, columnOffset });
      } else if (character !== '.') {
        failDefinition(id, `unknown pattern character '${character}'`);
      }
    }
  }
  const usesEveryRowAndColumn =
    [...Array(height).keys()].every((row) => cells.some((cell) => cell.rowOffset === row)) &&
    [...Array(width).keys()].every((column) => cells.some((cell) => cell.columnOffset === column));
  if (!usesEveryRowAndColumn) {
    failDefinition(id, 'every row and column of the pattern must hold a block');
  }
  for (const [weightName, weight] of [
    ['starting weight', definition.startingWeight],
    ['late weight', definition.lateWeight],
  ] as const) {
    if (!Number.isSafeInteger(weight) || weight < 1) {
      failDefinition(id, `the ${weightName} must be a whole number of 1 or more`);
    }
  }
  return {
    id,
    cells,
    height,
    width,
    colour: definition.colour,
    startingWeight: definition.startingWeight,
    lateWeight: definition.lateWeight,
  };
}

export const SHAPE_CATALOGUE: readonly BlockShape[] = SHAPE_DEFINITIONS.map(buildShape);

export const SHAPE_IDS: readonly ShapeId[] = SHAPE_CATALOGUE.map((shape) => shape.id);

const SHAPES_BY_ID: ReadonlyMap<ShapeId, BlockShape> = new Map(
  SHAPE_CATALOGUE.map((shape) => [shape.id, shape]),
);

export function isShapeId(value: unknown): value is ShapeId {
  return SHAPE_IDS.some((id) => id === value);
}

export function getShape(id: ShapeId): BlockShape {
  const shape = SHAPES_BY_ID.get(id);
  if (shape === undefined) {
    throw new RangeError(`There is no shape with id '${id}'`);
  }
  return shape;
}
