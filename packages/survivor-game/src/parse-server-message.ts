import { readStoredFields } from '@local/stored-values';
import type { ServerMessage } from './messages.js';
import { parseRunStateReport } from './parse-state-report.js';
import { failMessage, readExactFields, readFiniteNumber, readText } from './read-message-fields.js';
import { parseSummaryDetails } from './summary.js';

const WHAT = 'server message';

/**
 * Checks a message the server sent, before the browser draws it. Throws `InvalidMessageError` for
 * anything that is not exactly a message of `ServerMessage`.
 */
export function parseServerMessage(value: unknown): ServerMessage {
  const type = readStoredFields(value)?.get('type');
  if (type === 'state') {
    const fields = readExactFields(value, WHAT, ['type', 'state']);
    return { type, state: parseRunStateReport(fields.get('state')) };
  }
  if (type === 'run-ended') {
    const fields = readExactFields(value, WHAT, ['type', 'reason', 'state', 'summary']);
    const reason = fields.get('reason');
    if (reason !== 'defeat' && reason !== 'abandoned') {
      failMessage(WHAT, "reason must be 'defeat' or 'abandoned'");
    }
    const summary = readExactFields(fields.get('summary'), WHAT, ['score', 'category', 'details']);
    return {
      type,
      reason,
      state: parseRunStateReport(fields.get('state')),
      summary: {
        score: readFiniteNumber(summary.get('score'), WHAT, 'score'),
        category: readText(summary.get('category'), WHAT, 'category'),
        details: parseSummaryDetails(summary.get('details')),
      },
    };
  }
  if (type === 'message-refused') {
    const fields = readExactFields(value, WHAT, ['type', 'reason', 'message']);
    return {
      type,
      reason: readText(fields.get('reason'), WHAT, 'reason'),
      message: readText(fields.get('message'), WHAT, 'message'),
    };
  }
  return failMessage(WHAT, "type must be 'state', 'run-ended', or 'message-refused'");
}
