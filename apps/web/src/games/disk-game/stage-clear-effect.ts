import type { StageClear } from '@local/disk-game';

/** What the board shows for a moment after a stage is cleared (DK-23). */
export interface StageClearEffect {
  /** Tells apart the effects of two stages cleared one after the other. */
  readonly id: number;
  readonly stageClear: StageClear;
}
