import { isDifficultyId } from '@local/number-game';
import type { SummaryDetails } from '../../api/game-server-api.js';
import type { DetailField } from '../browser-game.js';
import { DIFFICULTY_LABELS } from './difficulty-labels.js';

function readNumberDetail(details: SummaryDetails, name: string): number {
  const value = details[name];
  if (typeof value !== 'number') {
    throw new Error(`The server sent Number Game details without a numeric ${name}`);
  }
  return value;
}

/** Stage, width, and difficulty, from the summary the server module writes (PS-09, PS-13). */
export function describeNumberGameDetails(details: SummaryDetails): readonly DetailField[] {
  const difficulty = details['difficulty'];
  if (!isDifficultyId(difficulty)) {
    throw new Error(`The server sent Number Game details with an unknown difficulty`);
  }
  return [
    { label: 'Stage', value: String(readNumberDetail(details, 'stage')) },
    { label: 'Width', value: String(readNumberDetail(details, 'width')) },
    { label: 'Difficulty', value: DIFFICULTY_LABELS[difficulty] },
  ];
}
