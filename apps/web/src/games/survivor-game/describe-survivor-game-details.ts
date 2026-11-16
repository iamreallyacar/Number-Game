import type { SummaryDetails } from '@local/game-server-api';
import { parseSummaryDetails } from '@local/survivor-game';
import type { DetailField } from '../browser-game.js';
import { formatTimeSurvived } from './format-time-survived.js';

/** Time survived and level reached, from the summary the rules package writes (SG-49). */
export function describeSurvivorGameDetails(details: SummaryDetails): readonly DetailField[] {
  const { secondsSurvived, levelReached } = parseSummaryDetails(details);
  return [
    { label: 'Time survived', value: formatTimeSurvived(secondsSurvived) },
    { label: 'Level reached', value: String(levelReached) },
  ];
}
