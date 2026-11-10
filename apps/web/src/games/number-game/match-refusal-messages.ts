import type { MatchRefusal } from '@local/number-game';

export const MATCH_REFUSAL_MESSAGES: Readonly<Record<MatchRefusal, string>> = {
  'not-a-pair': 'Those numbers are not equal and do not add up to 10',
  'no-line-of-sight': 'Those numbers cannot see each other',
  'empty-cell': 'That cell is empty',
  'same-cell': 'Pick two different numbers',
  'cell-out-of-range': 'That cell is not on the board',
};
