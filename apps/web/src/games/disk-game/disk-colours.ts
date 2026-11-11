import { MAX_DISK_COUNT, type DiskSize } from '@local/disk-game';

// One colour for each disk size, spread around the colour wheel so neighbours in size look
// different (DK-03). All are light enough for the dark size number drawn on the disk.
const DISK_COLOURS = [
  '#f28b82',
  '#f6ae5c',
  '#f2d64b',
  '#a9d65c',
  '#5fcf8e',
  '#56c9c9',
  '#6fb1f2',
  '#9a9cf5',
  '#c58af0',
  '#f08ac6',
] as const satisfies { readonly length: typeof MAX_DISK_COUNT };

export function diskColourOf(disk: DiskSize): string {
  const colour = DISK_COLOURS[disk - 1];
  if (colour === undefined) {
    throw new RangeError(`There is no colour for a disk of size ${String(disk)}`);
  }
  return colour;
}

// The smallest disk is this wide, as a share of the widest disk.
const SMALLEST_DISK_WIDTH_SHARE = 0.3;

/** Width of a disk as a share of the widest disk of the stage, from 0 to 1 (DK-03). */
export function diskWidthShareOf(disk: DiskSize, diskCount: number): number {
  if (diskCount <= 1) {
    return 1;
  }
  return (
    SMALLEST_DISK_WIDTH_SHARE + ((1 - SMALLEST_DISK_WIDTH_SHARE) * (disk - 1)) / (diskCount - 1)
  );
}
