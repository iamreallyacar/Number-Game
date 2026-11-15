import type { SummaryDetails } from '@local/game-server-api';
import { parseSummaryDetails } from '@local/block-game';
import type { DetailField } from '../browser-game.js';

/** Lines cleared, from the summary the rules package writes (BG-21). */
export function describeBlockGameDetails(details: SummaryDetails): readonly DetailField[] {
  const { linesCleared } = parseSummaryDetails(details);
  return [{ label: 'Lines cleared', value: String(linesCleared) }];
}
