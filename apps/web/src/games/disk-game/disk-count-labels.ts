import type { StartingDiskCount } from '@local/disk-game';

/** How a starting disk count is written for the player, such as "3 disks". */
export function startingDiskCountLabel(startingDiskCount: StartingDiskCount): string {
  return `${String(startingDiskCount)} disks`;
}
