import { parseSummaryDetails } from '@local/disk-game';
import type { SummaryDetails } from '@local/game-server-api';
import type { DetailField } from '../browser-game.js';
import { startingDiskCountLabel } from './disk-count-labels.js';

/**
 * Stage, starting disk count, and moves left, from the summary the rules package writes. A high
 * score has no moves left to show (DK-21).
 */
export function describeDiskGameDetails(details: SummaryDetails): readonly DetailField[] {
  const { stage, startingDiskCount, movesLeft } = parseSummaryDetails(details);
  const fields: DetailField[] = [
    { label: 'Stage', value: String(stage) },
    { label: 'Started with', value: startingDiskCountLabel(startingDiskCount) },
  ];
  if (movesLeft !== undefined) {
    fields.push({ label: 'Moves left', value: String(movesLeft) });
  }
  return fields;
}
