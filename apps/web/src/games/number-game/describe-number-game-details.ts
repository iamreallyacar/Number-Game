import type { SummaryDetails } from '@local/game-server-api';
import { parseSummaryDetails } from '@local/number-game';
import type { DetailField } from '../browser-game.js';
import { DIFFICULTY_LABELS } from './difficulty-labels.js';

/** Stage, width, and difficulty, from the summary the rules package writes (PS-09, PS-13). */
export function describeNumberGameDetails(details: SummaryDetails): readonly DetailField[] {
  const { stage, width, difficulty } = parseSummaryDetails(details);
  return [
    { label: 'Stage', value: String(stage) },
    { label: 'Width', value: String(width) },
    { label: 'Difficulty', value: DIFFICULTY_LABELS[difficulty] },
  ];
}
