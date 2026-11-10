/**
 * Colour index of a block. Each catalogue shape has one, and every cell it fills keeps it, so the
 * browser can colour blocks. The browser picks the actual colour for each index.
 */
export const SHAPE_COLOURS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export type ShapeColour = (typeof SHAPE_COLOURS)[number];

/** One board square: the colour of the block that fills it, or null when empty. */
export type BoardCell = ShapeColour | null;

export function isShapeColour(value: unknown): value is ShapeColour {
  return SHAPE_COLOURS.some((colour) => colour === value);
}
