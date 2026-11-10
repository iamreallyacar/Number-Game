import type { SummaryDetails } from '@local/game-server-api';
import { parseSummaryDetails } from '@local/block-game';
import type { DetailField } from '../browser-game.js';
import { boardSizeLabel } from './board-size-labels.js';

/** Board size and lines cleared, from the summary the rules package writes (BG-21). */
export function describeBlockGameDetails(details: SummaryDetails): readonly DetailField[] {
  const { size, linesCleared } = parseSummaryDetails(details);
  return [
    { label: 'Board', value: boardSizeLabel(size) },
    { label: 'Lines cleared', value: String(linesCleared) },
  ];
}
