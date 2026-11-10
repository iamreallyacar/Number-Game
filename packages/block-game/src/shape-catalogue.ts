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
  /** Rows of the bounding box, from 1 to 3. */
  readonly height: number;
  /** Columns of the bounding box, from 1 to 3. */
  readonly width: number;
  readonly colour: ShapeColour;
  /** Chance of being dealt, relative to the other shapes. A whole number of 1 or more. */
  readonly weight: number;
}

interface ShapeDefinition {
  readonly id: string;
  /** Rows of the bounding box written as text, where '#' is a block and '.' is a gap. */
  readonly pattern: readonly string[];
  readonly colour: ShapeColour;
  readonly weight: number;
}

// Every shape the game can deal, each orientation as its own entry. Weights are the one place to
// tune how often each shape appears (BG-10): small common shapes are 4 to 6, awkward ones 1 or 2.
// Ids are stored in saved games, so never rename or remove one that has shipped.
const SHAPE_DEFINITIONS = [
  { id: 'single', pattern: ['#'], colour: 0, weight: 4 },

  { id: 'line-2-horizontal', pattern: ['##'], colour: 1, weight: 5 },
  { id: 'line-2-vertical', pattern: ['#', '#'], colour: 1, weight: 5 },
  { id: 'line-3-horizontal', pattern: ['###'], colour: 2, weight: 5 },
  { id: 'line-3-vertical', pattern: ['#', '#', '#'], colour: 2, weight: 5 },

  { id: 'square-2', pattern: ['##', '##'], colour: 3, weight: 6 },
  { id: 'square-3', pattern: ['###', '###', '###'], colour: 4, weight: 1 },
  { id: 'rectangle-3-wide', pattern: ['###', '###'], colour: 5, weight: 2 },
  { id: 'rectangle-3-tall', pattern: ['##', '##', '##'], colour: 5, weight: 2 },

  { id: 'corner-small-top-left', pattern: ['##', '#.'], colour: 6, weight: 4 },
  { id: 'corner-small-top-right', pattern: ['##', '.#'], colour: 6, weight: 4 },
  { id: 'corner-small-bottom-left', pattern: ['#.', '##'], colour: 6, weight: 4 },
  { id: 'corner-small-bottom-right', pattern: ['.#', '##'], colour: 6, weight: 4 },

  { id: 'corner-big-top-left', pattern: ['###', '#..', '#..'], colour: 4, weight: 1 },
  { id: 'corner-big-top-right', pattern: ['###', '..#', '..#'], colour: 4, weight: 1 },
  { id: 'corner-big-bottom-left', pattern: ['#..', '#..', '###'], colour: 4, weight: 1 },
  { id: 'corner-big-bottom-right', pattern: ['..#', '..#', '###'], colour: 4, weight: 1 },

  // The L names say where the long arm is and which way its foot points.
  { id: 'l-tall-left-foot-right', pattern: ['#.', '#.', '##'], colour: 7, weight: 2 },
  { id: 'l-tall-right-foot-left', pattern: ['.#', '.#', '##'], colour: 7, weight: 2 },
  { id: 'l-tall-left-top-right', pattern: ['##', '#.', '#.'], colour: 7, weight: 2 },
  { id: 'l-tall-right-top-left', pattern: ['##', '.#', '.#'], colour: 7, weight: 2 },
  { id: 'l-wide-top-foot-left', pattern: ['###', '#..'], colour: 7, weight: 2 },
  { id: 'l-wide-top-foot-right', pattern: ['###', '..#'], colour: 7, weight: 2 },
  { id: 'l-wide-bottom-foot-left', pattern: ['#..', '###'], colour: 7, weight: 2 },
  { id: 'l-wide-bottom-foot-right', pattern: ['..#', '###'], colour: 7, weight: 2 },

  // The T names say which way the middle bump points.
  { id: 't-up', pattern: ['.#.', '###'], colour: 0, weight: 2 },
  { id: 't-down', pattern: ['###', '.#.'], colour: 0, weight: 2 },
  { id: 't-left', pattern: ['.#', '##', '.#'], colour: 0, weight: 2 },
  { id: 't-right', pattern: ['#.', '##', '#.'], colour: 0, weight: 2 },

  { id: 's-wide', pattern: ['.##', '##.'], colour: 1, weight: 2 },
  { id: 's-tall', pattern: ['#.', '##', '.#'], colour: 1, weight: 2 },
  { id: 'z-wide', pattern: ['##.', '.##'], colour: 2, weight: 2 },
  { id: 'z-tall', pattern: ['.#', '##', '#.'], colour: 2, weight: 2 },

  // Down diagonals run from the top-left to the bottom-right, up diagonals the other way.
  { id: 'diagonal-2-down', pattern: ['#.', '.#'], colour: 3, weight: 1 },
  { id: 'diagonal-2-up', pattern: ['.#', '#.'], colour: 3, weight: 1 },
  { id: 'diagonal-3-down', pattern: ['#..', '.#.', '..#'], colour: 3, weight: 1 },
  { id: 'diagonal-3-up', pattern: ['..#', '.#.', '#..'], colour: 3, weight: 1 },

  { id: 'plus', pattern: ['.#.', '###', '.#.'], colour: 5, weight: 1 },
] as const satisfies readonly ShapeDefinition[];

export type ShapeId = (typeof SHAPE_DEFINITIONS)[number]['id'];

const MAX_SHAPE_SIDE = 3;

function failDefinition(id: string, problem: string): never {
  throw new Error(`Shape '${id}' in the catalogue is invalid: ${problem}`);
}

/** Turns a text pattern into cells, and checks that its bounding box is tight and at most 3 x 3. */
function buildShape(definition: ShapeDefinition & { readonly id: ShapeId }): BlockShape {
  const { id, pattern } = definition;
  const height = pattern.length;
  const width = pattern[0]?.length ?? 0;
  if (height < 1 || height > MAX_SHAPE_SIDE || width < 1 || width > MAX_SHAPE_SIDE) {
    failDefinition(id, 'the pattern must be 1 to 3 rows of 1 to 3 characters');
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
  if (!Number.isSafeInteger(definition.weight) || definition.weight < 1) {
    failDefinition(id, 'the weight must be a whole number of 1 or more');
  }
  return { id, cells, height, width, colour: definition.colour, weight: definition.weight };
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
